import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Check for Env Var first (Cloud), then File (Local)
firebase_creds = os.getenv("FIREBASE_CREDENTIALS")

if not firebase_admin._apps:
    if firebase_creds:
        # Load from Env Var (Render)
        try:
            cred_dict = json.loads(firebase_creds)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("SUCCESS: Firebase initialized from Environment Variable")
        except Exception as e:
            print(f"ERROR: Failed to load Firebase Env Var: {e}")
    elif os.path.exists("serviceAccountKey.json"):
        # Load from File (Localhost)
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        print("SUCCESS: Firebase initialized from local file")
    else:
        print("CRITICAL WARNING: No Firebase Credentials found (Env Var or File).")

db = firestore.client()

def get_queue():
    users_ref = db.collection('queue')
    docs = users_ref.stream()
    return [{**doc.to_dict(), "id": doc.id} for doc in docs]

def seed_queue(data):
    collection = db.collection('queue')
    for doc in collection.stream():
        doc.reference.delete()
    for item in data:
        collection.add(item)
    return True
