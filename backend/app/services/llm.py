import os
import json
from groq import Groq
from dotenv import load_dotenv
from app.services.firebase import get_system_prompt # Import new function

load_dotenv(".env.groq")

# Initialize the client
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def get_llama_chat_response(patient_name: str, history: list, age: int = None, gender: str = None) -> dict:
    """
    Conversational Triage Engine (Nurse Nandiphiwe Persona).
    Uses prompts stored in Firestore for real-time updates.
    """
    
    # 1. Fetch the raw template from Firestore
    raw_template = get_system_prompt("triage_nurse")
    
    # 2. Construct context variables
    context_str = f"You are speaking to {patient_name}"
    if age:
        context_str += f", who is {age} years old"
    else:
        context_str += " (Age unknown)"
        
    if gender:
        context_str += f" ({gender})"
    context_str += "."

    # 3. Inject variables into the template
    try:
        # We replace the placeholder in the Firestore string with actual data
        system_prompt = raw_template.replace("{context_str}", context_str)
    except Exception as e:
        print(f"Prompt formatting error: {e}")
        system_prompt = raw_template

    # 4. Build messages
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            temperature=0.1, 
            max_tokens=256,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)

    except Exception as e:
        print(f"LLM Error: {e}")
        return {
            "reply_message": "Eish, my connection is a bit slow. Please tell me your symptoms again.",
            "show_booking": False
        }
    
def explain_prescription(diagnosis: str, meds: list, notes: str) -> str:
    """
    Translates medical jargon into simple, empathetic English/Vernacular.
    """
    # Note: You can move this prompt to Firestore later as 'prescription_explainer'
    system_prompt = (
        "You are a helpful, empathetic medical assistant for a patient in a South African community clinic. "
        "Your job is to explain complex medical terms in simple, easy-to-understand English. "
        "1. Start with a warm greeting (e.g., 'Sawubona', 'Hello'). "
        "2. Explain the diagnosis simply (what is wrong). "
        "3. Explain the medication instructions clearly (e.g., translate 'TDS' to '3 times a day'). "
        "4. Do NOT give new medical advice or change the prescription. Only explain what is provided."
        "5. Keep it short (max 3-4 sentences)."
    )
    
    user_content = f"Diagnosis: {diagnosis}\nMedications: {', '.join(meds)}\nDoctor's Notes: {notes}\n\nPlease explain this to the patient."

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.2, 
            max_tokens=256
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Sorry, I cannot explain this right now. Please ask the nurse."
    

def analyze_operational_metrics(metrics: dict) -> list:
    """
    Generates Facility Management insights based on live data.
    """
    system_prompt = """
    You are an expert Hospital Operations Manager AI. 
    Analyze the provided clinic metrics and output 3 short, punchy insights.
    
    FORMAT: JSON Array of objects: [{"type": "success"|"warning"|"critical"|"info", "text": "Insight..."}]
    
    RULES:
    1. Look for bottlenecks (High wait times, low efficiency).
    2. Identify good performance (Low wait times).
    3. Spot triage trends (Spike in flu/critical).
    4. Be executive and directive (e.g., "Allocate more staff to Triage").
    """
    
    user_content = f"Current Metrics: {json.dumps(metrics)}"

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.4,
            max_tokens=256,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content).get("insights", [])
    except Exception as e:
        print(f"LLM Error: {e}")
        return [{"type": "info", "text": "AI Analysis unavailable. Using standard protocols."}]
    

def analyze_patient_health(records: list) -> dict:
    """
    Generates a personalized health summary for the patient view.
    """
    if not records:
        return {
            "status": "Good",
            "summary": "You have no medical records yet. Stay healthy!",
            "tip": "Drink water and stay active."
        }

    # Fetch dynamic prompt
    system_prompt = get_system_prompt("health_summary")

    # Format records for the LLM
    history_text = ""
    for r in records[:5]: 
        history_text += f"- {r.get('date')}: {r.get('diagnosis')} (Doc: {r.get('doctor')})\n"

    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Patient History:\n{history_text}"}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
            max_tokens=200,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        print(f"LLM Error: {e}")
        return {
            "status": "Unknown",
            "summary": "I am having trouble reading your file right now.",
            "tip": "Please see a doctor if you feel unwell."
        }