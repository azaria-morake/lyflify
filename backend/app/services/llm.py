import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv(".env.groq")

# Initialize the client
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def get_llama_assessment(user_message: str) -> str:
    """
    Analyzes symptoms using Llama 3 via Groq and returns a triage assessment.
    """
    
    # 1. The "Doctor" Persona (System Prompt)
    system_prompt = (
        "You are an expert triage nurse AI. Analyze the symptoms and output ONLY valid JSON. "
        "Use this EXACT schema:\n"
        "{\n"
        "  'urgency_score': int (1-10, where 10 is immediate death/critical),\n"
        "  'color_code': str ('red' for critical, 'orange' for urgent, 'green' for routine),\n"
        "  'category': str ('Emergency', 'Urgent', or 'Routine'),\n"
        "  'ai_reasoning': str (Max 20 words explaining why),\n"
        "  'recommended_action': str (Max 15 words on what to do)\n"
        "}\n"
        "Rules:\n"
        "- Chest pain, breathing issues, severe bleeding = Red/Emergency/Score 9-10\n"
        "- High fever, fractures, vomiting = Orange/Urgent/Score 6-8\n"
        "- Cough, mild pain, rash = Green/Routine/Score 1-5"
    )


    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="llama-3.1-8b-instant",  # Fast, efficient, and capable
            temperature=0.1,         # Low randomness for consistent medical advice
            max_tokens=256,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)

    except Exception as e:
        print(f"LLM Error: {e}")
        # Fail gracefully so the app never crashes
        return {
            "urgency_score": 5,
            "color_code": "orange",
            "category": "Urgent",
            "ai_reasoning": "AI Service Unavailable. Defaulting to caution.",
            "recommended_action": "Please see a receptionist."
        }
    
def explain_prescription(diagnosis: str, meds: list, notes: str) -> str:
    """
    Translates medical jargon into simple, empathetic English/Vernacular for patients.
    """
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
            temperature=0.2, # Low creativity for accuracy
            max_tokens=256
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Sorry, I cannot explain this right now. Please ask the nurse."
