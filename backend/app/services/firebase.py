import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Check for Env Var first (Cloud), then File (Local)
firebase_creds = os.getenv("FIREBASE_CREDENTIALS")

if not firebase_admin._apps:
    if firebase_creds:
        # Load from Env Var (Render)
        cred_dict = json.loads(firebase_creds)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
    elif os.path.exists("serviceAccountKey.json"):
        # Load from File (Localhost)
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
    else:
        print("CRITICAL WARNING: No Firebase Credentials found.")

db = firestore.client()

def get_queue():
    """Fetch all patients currently in the queue"""
    users_ref = db.collection('queue')
    docs = users_ref.stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

def seed_queue(data):
    """Helper to wipe and populate DB for demo"""
    collection = db.collection('queue')
    # Delete existing
    for doc in collection.stream():
        doc.reference.delete()
    # Add new
    for item in data:
        collection.add(item)
    return True
