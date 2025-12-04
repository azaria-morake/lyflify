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
    db.collection('queue').add(booking_data)
    return booking_data

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