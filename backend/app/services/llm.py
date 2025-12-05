import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv(".env.groq")

# Initialize the client
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)


def get_llama_chat_response(patient_name: str, history: list, age: int = None, gender: str = None) -> dict:
    """
    Conversational Triage Engine (Nurse Nandiphiwe Persona).
    """
    
    # Context construction
    context_str = f"You are speaking to {patient_name}"
    if age:
        context_str += f", who is {age} years old"
    else:
        context_str += " (Age unknown)"
        
    if gender:
        context_str += f" ({gender})"
    context_str += "."

    system_prompt = f"""
    You are **Nurse Nandiphiwe**, a warm, motherly, and respectful triage nurse for LyfLify clinics in South Africa.
    {context_str}

    --- CRITICAL RULES (READ FIRST) ---
    1. **LANGUAGE BARRIER:** You ONLY speak English and basic SA slang ("Yebo", "Eish", "Shame"). 
       - IF the user speaks full Vernacular (Zulu/Xhosa/Sotho): Reply EXACTLY: "Xolo (Sorry), I am still learning your language. Please can we speak in English so I can help you safely?"
    
    2. **RESPECT & TITLES:** - NEVER call the user "child" unless age < 18.
       - Use "Baba", "Ma", "Sisi", "Bhuti" based on context.

    --- CONVERSATION FLOW (PREVENT LOOPS) ---
    **CHECK THE HISTORY:** Before replying, look at your *previous* message.
    - **Did you already greet them?** -> DO NOT greet again. Ask how you can help.
    - **Did you already flag an emergency?** (e.g., did you just say "Yoh! That is dangerous")?
      - IF YES, and the user says "Okay", "Thanks", or "I will" -> **CALM DOWN.** Do NOT show the booking button again. Offer reassurance (e.g., "Stay calm, the doctors are ready for you.").
      - IF YES, and the user doubts you ("Really?", "Are you sure?") -> **DOUBLE DOWN.** Show the button again. Say "Yes, I am serious. Please go now."

    --- EMERGENCY OVERRIDE ---
    - IF (User mentions "elephant on chest", "crushing chest pain", "can't breathe", "drooping face") AND (You have NOT just flagged this):
       - STOP asking questions. Set `show_booking` = TRUE. Set `color_code` = "red".
       - Reply: "Yoh! That is dangerous. You must see a doctor NOW."

    --- STANDARD STYLE ---
    1. **WARM OPENERS:** If the user says "Hello", reply: "Sawubona! How are you doing today? Is there anything I can help you with?" (Invite them to speak).
    2. **EMPATHY:** If they are just venting, listen. Do NOT book.
    3. **TRIAGE:** Only ask clarifying questions if the symptom is vague (e.g. "I hurt").

    OUTPUT FORMAT (JSON ONLY):
    {{
      "reply_message": "String",
      "show_booking": boolean,
      "urgency_score": int (1-10) or null,
      "color_code": "red"/"orange"/"green" or null,
      "category": "Emergency"/"Urgent"/"Routine" or null,
      "recommended_action": "Short medical advice" or null
    }}
    """

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
