import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# --- 1. EXISTING AUTH SETUP (UNCHANGED) ---
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

# --- 2. QUEUE FUNCTIONS ---

def get_queue():
    """Fetches all patients from Firestore"""
    users_ref = db.collection('queue')
    docs = users_ref.stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

def add_to_queue(booking_data):
    """Adds a new patient to Firestore"""
    # Fix: Return the ref so we know the ID if needed immediately (optional but good practice)
    update_time, ref = db.collection('queue').add(booking_data)
    return {**booking_data, "id": ref.id}

def update_booking_by_doc_id(doc_id, updates):
    """Updates a document directly by its Firestore ID (Prevents collisions)"""
    try:
        doc_ref = db.collection('queue').document(doc_id)
        doc_ref.update(updates)
        return True
    except Exception as e:
        print(f"Error updating doc {doc_id}: {e}")
        return False

def update_booking_in_db(patient_id, updates):
    """Finds a patient by ID and updates their status/time"""
    # Query to find the document with this patient_id
    docs = db.collection('queue').where('patient_id', '==', patient_id).stream()
    for doc in docs:
        doc.reference.update(updates)
        return True # Stop after updating the first match
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

def get_patient_records(patient_id):
    """Fetches medical history for a patient"""
    # Sort by date descending (newest first)
    docs = db.collection('records').where('patient_id', '==', patient_id).stream()
    records = [{**doc.to_dict(), "id": doc.id} for doc in docs]
    # Simple sort (assuming ISO date strings)
    records.sort(key=lambda x: x.get('date', ''), reverse=True)
    return records

def seed_records(patient_id):
    """Seeds dummy records for the demo user if none exist"""
    records_ref = db.collection('records')
    
    # Demo Data
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