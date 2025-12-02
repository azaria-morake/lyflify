import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize connection using the JSON key
# In production (Render/Vercel), we will use ENV variables, but for local use JSON.
cred_path = "serviceAccountKey.json"

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
else:
    # Fallback for when we deploy and use ENV vars later
    print("Warning: serviceAccountKey.json not found.")

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
