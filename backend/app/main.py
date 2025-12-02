from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.services.firebase import get_queue, seed_queue

app = FastAPI(title="LyfLify API")

# Allow Frontend to talk to Backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow Vercel frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "LyfLify Backend Online", "version": "0.1"}

@app.get("/queue")
def read_queue():
    """Get the live clinic queue"""
    return get_queue()

@app.post("/seed")
def seed_database():
    """Reset the database with dummy data (For Demo)"""
    dummy_data = [
        {"time": "08:15", "name": "Thabo Mbeki", "patient_id": "920211...", "score": "High (8/10)", "status": "Waiting", "urgent": True},
        {"time": "08:30", "name": "Gogo Dlamini", "patient_id": "540105...", "score": "Medium (4/10)", "status": "In Review", "urgent": False},
        {"time": "08:45", "name": "Sarah Jones", "patient_id": "880523...", "score": "Low (1/10)", "status": "Checked In", "urgent": False},
    ]
    seed_queue(dummy_data)
    return {"message": "Database seeded with demo data"}
