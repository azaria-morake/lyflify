import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from functools import lru_cache 

# --- 1. EXISTING AUTH SETUP ---
firebase_creds = os.getenv("FIREBASE_CREDENTIALS")

if not firebase_admin._apps:
    if firebase_creds:
        try:
            cred_dict = json.loads(firebase_creds)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("SUCCESS: Firebase initialized from Environment Variable")
        except Exception as e:
            print(f"ERROR: Failed to load Firebase Env Var: {e}")
    elif os.path.exists("serviceAccountKey.json"):
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        print("SUCCESS: Firebase initialized from local file")
    else:
        print("CRITICAL WARNING: No Firebase Credentials found.")

db = firestore.client()

# --- 2. PROMPT MANAGEMENT (NEW) ---

@lru_cache(maxsize=10) 
def get_system_prompt(prompt_id: str) -> str:
    """
    Fetches a raw prompt template from Firestore.
    Includes caching to prevent excessive DB reads.
    """
    try:
        doc = db.collection('system_prompts').document(prompt_id).get()
        if doc.exists:
            return doc.to_dict().get('text', "")
    except Exception as e:
        print(f"Error fetching prompt {prompt_id}: {e}")
    
    # Fallbacks in case Firestore is unreachable or empty
    defaults = {
        "triage_nurse": "You are a helpful nurse. You are speaking to {context_str}.",
        "health_summary": "Summarize the patient health."
    }
    return defaults.get(prompt_id, "You are a helpful assistant.")

# --- 3. QUEUE FUNCTIONS ---

def get_queue():
    """Fetches all patients from Firestore"""
    users_ref = db.collection('queue')
    docs = users_ref.stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

def add_to_queue(booking_data):
    """Adds a new patient to Firestore"""
    update_time, ref = db.collection('queue').add(booking_data)
    return {**booking_data, "id": ref.id}

def update_booking_by_doc_id(doc_id, updates):
    """Updates a document directly by its Firestore ID"""
    try:
        doc_ref = db.collection('queue').document(doc_id)
        doc_ref.update(updates)
        return True
    except Exception as e:
        print(f"Error updating doc {doc_id}: {e}")
        return False

def update_booking_in_db(patient_id, updates):
    """Finds a patient by ID and updates their status/time"""
    docs = db.collection('queue').where('patient_id', '==', patient_id).stream()
    for doc in docs:
        doc.reference.update(updates)
        return True 
    return False

def delete_booking(patient_id):
    """Finds a patient by ID and deletes the record"""
    docs = db.collection('queue').where('patient_id', '==', patient_id).stream()
    for doc in docs:
        doc.reference.delete()
        return True
    return False

def seed_queue(data):
    """Resets the DB for demos"""
    collection = db.collection('queue')
    for doc in collection.stream():
        doc.reference.delete()
    for item in data:
        collection.add(item)
    return True

# --- 4. RECORD FUNCTIONS ---

def add_patient_record(data):
    """Saves a new medical record"""
    db.collection('records').add(data)
    return True

def get_patient_records(patient_id):
    """Fetches medical history for a patient"""
    docs = db.collection('records').where('patient_id', '==', patient_id).stream()
    records = [{**doc.to_dict(), "id": doc.id} for doc in docs]
    records.sort(key=lambda x: x.get('created_at', x.get('date', '')), reverse=True)
    return records

def seed_records(patient_id):
    """Seeds dummy records for the demo user if none exist"""
    records_ref = db.collection('records')
    dummy_data = [
        {
            "patient_id": patient_id,
            "date": "2024-12-05",
            "doctor": "Dr. Nkosi",
            "diagnosis": "Acute Bronchitis",
            "meds": ["Amoxicillin 500mg (TDS)", "Paracetamol 500mg (PRN)"],
            "notes": "Patient presents with wheezing and persistent cough. Chest clear on X-Ray.",
            "type": "Consultation"
        },
        {
            "patient_id": patient_id,
            "date": "2024-11-12",
            "doctor": "Sr. Zulu",
            "diagnosis": "Hypertension (Routine)",
            "meds": ["Amlodipine 5mg (Daily)"],
            "notes": "BP 150/95. Dosage adjusted.",
            "type": "Check-up"
        }
    ]
    for data in dummy_data:
        records_ref.add(data)
    return True

def get_unique_patients():
    docs = db.collection('records').stream()
    registry = {}
    for doc in docs:
        data = doc.to_dict()
        pid = data.get("patient_id")
        if not pid: continue
        name = data.get("patient_name", "Unknown")
        date = data.get("date", "0000-00-00")
        should_update = False
        if pid not in registry:
            should_update = True
        else:
            current = registry[pid]
            if (current['patient_name'] in ["Unknown", "----"]) and (name not in ["Unknown", "----"]):
                should_update = True
            elif date > current['last_visit']:
                should_update = True
        if should_update:
            registry[pid] = {
                "patient_id": pid,
                "patient_name": name,
                "last_visit": date,
                "last_diagnosis": data.get("diagnosis"),
                "last_doctor": data.get("doctor")
            }
    return sorted(list(registry.values()), key=lambda x: x['patient_name'])