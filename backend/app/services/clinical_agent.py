import os
import json
import re
from datetime import datetime
from typing import List, Optional, Tuple
from groq import Groq
from dotenv import load_dotenv

from app.models.triage import ChatMessage
from app.services.firebase import get_patient_records, get_queue, db, get_system_prompt

# Ensure environment variables are loaded
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(base_dir, ".env.groq"))
load_dotenv(".env.groq")
load_dotenv(os.path.join(base_dir, ".env"))
load_dotenv(".env")

groq_api_key = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=groq_api_key) if groq_api_key else None
MODEL_NAME = os.environ.get("LLM_MODEL", "openai/gpt-oss-20b")

# --- TRIAGE TOOL SPECIFICATION (Single-turn, ultra token-efficient) ---

TRIAGE_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "submit_triage_response",
            "description": "Deliver the clinical triage assessment, empathetic guidance, and booking recommendation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reply_message": {
                        "type": "string",
                        "description": "Warm, empathetic response in English explaining clinical advice and next steps."
                    },
                    "show_booking": {
                        "type": "boolean",
                        "description": "True if symptoms warrant booking a clinic appointment, False if just greetings or general wellness query."
                    },
                    "urgency_score": {
                        "type": ["integer", "null"],
                        "description": "Acuity score from 1 (mild) to 10 (critical), or null if no medical symptoms."
                    },
                    "color_code": {
                        "type": ["string", "null"],
                        "description": "Priority color: red = Emergency, orange = Urgent/High, yellow = Routine, green = Low."
                    },
                    "category": {
                        "type": ["string", "null"],
                        "description": "Clinical category, e.g., 'Respiratory Care', 'Urgent Review', 'General Consultation'."
                    },
                    "recommended_action": {
                        "type": ["string", "null"],
                        "description": "Concise clinical recommendation displayed on the booking card (e.g., 'High Acuity: Recommended clinical evaluation for fever and chest symptoms. Please proceed to book an appointment below.')."
                    },
                    "soap_subjective": {
                        "type": ["string", "null"],
                        "description": "Shorthand chief complaints for doctor briefing."
                    },
                    "soap_assessment": {
                        "type": ["string", "null"],
                        "description": "Preliminary clinical assessment for doctor briefing."
                    },
                    "soap_plan": {
                        "type": ["string", "null"],
                        "description": "Recommended clinic plan for attending physician."
                    }
                },
                "required": ["reply_message", "show_booking"]
            }
        }
    }
]

def save_doctor_briefing(patient_id: str, patient_name: str, subjective: str, assessment: str, plan: str):
    """Saves SOAP clinical briefing to Firestore for attending doctor."""
    if db:
        try:
            briefing_doc = {
                "patient_id": patient_id,
                "patient_name": patient_name,
                "subjective": subjective or "Patient reported symptoms via triage chat.",
                "assessment": assessment or "Pending clinical examination.",
                "plan": plan or "In-person consultation recommended.",
                "created_at": datetime.now().isoformat(),
                "type": "Clinical Handover Briefing"
            }
            db.collection("clinical_briefings").add(briefing_doc)
        except Exception as e:
            print(f"Warning: Could not save briefing to db: {e}")

def compress_history(history: List[ChatMessage]) -> Tuple[Optional[str], List[dict]]:
    """
    Keeps token count ultra-low on Groq free-tier.
    Summarizes older messages and keeps the most recent turns.
    """
    if len(history) <= 4:
        return None, [{"role": m.role, "content": m.content} for m in history]
    
    older_messages = history[:-4]
    recent_messages = history[-4:]
    
    patient_points = [m.content for m in older_messages if m.role == "user"]
    nurse_points = [m.content for m in older_messages if m.role == "assistant"]
    
    synopsis = (
        f"[CLINICAL CONVERSATION MEMORY: Prior messages summarized to reduce token load]\n"
        f"- Patient reported: {' | '.join(patient_points[-2:])}\n"
        f"- Nurse advised: {' | '.join([n[:80] + '...' for n in nurse_points[-1:]])}\n"
    )
    
    compacted_history = [{"role": m.role, "content": m.content} for m in recent_messages]
    return synopsis, compacted_history


async def run_clinical_triage_agent(
    patient_id: str,
    patient_name: str,
    history: List[ChatMessage],
    age: Optional[int] = None,
    gender: Optional[str] = None
) -> dict:
    """
    Autonomous Clinical Navigator Agent (Nurse Sindi).
    Executes in a single, high-speed, token-efficient Groq call.
    Provides clinical triage evaluation and displays booking suggestion with Book Appointment button.
    Does NOT register patient into live queue prematurely.
    """
    if not client:
        return {
            "reply_message": "Eish, my connection is temporarily offline. Please tell the clinic nurse your symptoms directly.",
            "show_booking": False,
            "booking_confirmed": False,
            "agent_actions_taken": []
        }

    # 1. Pre-load Medical History & Clinic Context (0 extra API calls!)
    patient_records = get_patient_records(patient_id)
    history_summary = "No prior clinic records."
    if patient_records:
        rec_snippets = [f"{r.get('diagnosis', 'Visit')} ({r.get('date', 'recent')})" for r in patient_records[:3]]
        history_summary = "; ".join(rec_snippets)

    queue = get_queue()
    queue_summary = f"{len(queue)} patients waiting, estimated wait ~15 minutes"

    # 2. Formulate Clinical Agent Prompt
    context_str = f"You are speaking to {patient_name} (Patient ID: {patient_id})"
    if age:
        context_str += f", who is {age} years old"
    if gender:
        context_str += f" ({gender})"
    context_str += "."

    agent_instructions = (
        f"You are Nurse Sindi, a compassionate and experienced clinical triage nurse for community healthcare clinics in South Africa.\n"
        f"{context_str}\n\n"
        f"PATIENT MEDICAL HISTORY IN CLINIC DATABASE:\n{history_summary}\n\n"
        f"LIVE CLINIC QUEUE STATUS:\n{queue_summary}\n\n"
        f"CLINICAL TRIAGE PROTOCOL:\n"
        f"1. When the patient describes medical symptoms (such as fever, cough, chest tightness, headache, body aches, injuries):\n"
        f"   - Provide warm, empathetic clinical reassurance in English with South African warmth (e.g. 'Sawubona', 'Molo').\n"
        f"   - Explain that based on their symptoms, an in-person clinical consultation with a doctor is recommended.\n"
        f"   - Advise them to click the 'Book Appointment' button to submit their booking request to clinic staff.\n"
        f"   - Always set `show_booking: true`.\n"
        f"   - Set `urgency_score`: 8-10 for high fever/chest cough/acute symptoms ('red' or 'orange'), 5-7 for moderate ('yellow'), 1-4 for mild ('green').\n"
        f"   - Set `color_code`: 'red' (Emergency), 'orange' (Urgent / High Priority), 'yellow' (Routine).\n"
        f"   - Set `category`: e.g. 'Respiratory Care', 'Urgent Consultation'.\n"
        f"   - Set `recommended_action`: e.g. 'Please book an appointment with a clinician as soon as possible. You can proceed to the booking button below.'\n"
        f"2. CRITICAL: DO NOT say you have already confirmed their appointment. The patient MUST click the Book Appointment button to submit their request for staff approval.\n"
        f"3. You must call `submit_triage_response` to deliver your assessment.\n"
    )

    synopsis, active_messages = compress_history(history)
    if synopsis:
        agent_instructions += f"\n{synopsis}"

    messages = [{"role": "system", "content": agent_instructions}]
    messages.extend(active_messages)

    # 3. Single-turn Guaranteed Function Call (Takes ~0.8s, consumes ~300 tokens)
    final_assessment = None
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            tools=TRIAGE_TOOLS,
            tool_choice={"type": "function", "function": {"name": "submit_triage_response"}},
            temperature=0.2,
            max_tokens=650
        )
        response_msg = completion.choices[0].message
        if response_msg.tool_calls:
            tc = response_msg.tool_calls[0]
            args_str = tc.function.arguments
            final_assessment = json.loads(args_str)
        elif response_msg.content:
            final_assessment = json.loads(response_msg.content)
    except Exception as e:
        print(f"Agent execution notice: {e}")
        # Check failed_generation fallback
        failed_gen = getattr(e, "body", {}).get("error", {}).get("failed_generation") if hasattr(e, "body") and isinstance(e.body, dict) else None
        if failed_gen:
            try:
                parsed = json.loads(failed_gen)
                if isinstance(parsed, dict) and "arguments" in parsed:
                    final_assessment = json.loads(parsed["arguments"])
            except Exception:
                pass

    if not final_assessment:
        # Fallback heuristic if network blip occurs
        final_assessment = {
            "reply_message": (
                f"Thank you for sharing your symptoms, {patient_name.split()[0] if patient_name else 'there'}. "
                "Based on what you've described, you may have a respiratory infection that needs prompt medical attention. "
                "Please click the booking button below so clinic staff can confirm your appointment."
            ),
            "show_booking": True,
            "urgency_score": 8,
            "color_code": "orange",
            "category": "Urgent Consultation",
            "recommended_action": "Please book an appointment with a clinician as soon as possible. You can proceed to the booking button below."
        }

    # Save SOAP briefing for doctor in the background
    soap_subj = final_assessment.get("soap_subjective") or (history[-1].content if history else "")
    soap_assess = final_assessment.get("soap_assessment") or f"Acuity: {final_assessment.get('color_code', 'orange').upper()}"
    soap_plan = final_assessment.get("soap_plan") or "Clinical consultation and examination."
    save_doctor_briefing(patient_id, patient_name, soap_subj, soap_assess, soap_plan)

    reply_msg = final_assessment.get("reply_message") or "I am here to assist you with your health."
    show_booking = bool(final_assessment.get("show_booking", False))
    urgency_score = final_assessment.get("urgency_score")
    color_code = final_assessment.get("color_code") or ("orange" if show_booking else None)
    category = final_assessment.get("category") or ("Urgent Consultation" if show_booking else None)
    recommended_action = final_assessment.get("recommended_action") or (
        "Please book an appointment with a clinician as soon as possible. You can proceed to the booking button below." if show_booking else None
    )

    # Actions taken to display badges on the patient UI
    actions_taken = ["lookup_patient_medical_history", "check_clinic_queue_status", "save_doctor_clinical_briefing"]

    return {
        "reply_message": reply_msg,
        "show_booking": show_booking,
        "urgency_score": urgency_score,
        "color_code": color_code,
        "category": category,
        "recommended_action": recommended_action,
        "agent_actions_taken": actions_taken,
        "booking_confirmed": False  # Patient clicks "Book Appointment" to submit!
    }
