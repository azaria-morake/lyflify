from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import triage, navigator, booking, records
from app.services.firebase import get_queue, seed_queue
# Import the gatekeeper
from app.dependencies import verify_firebase_token

app = FastAPI(title="LyfLify API")

# Allow Frontend to talk to Backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, verify this matches your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- PROTECTED ROUTES ---
# We add `dependencies=[Depends(verify_firebase_token)]` to lock these down.

app.include_router(
    triage.router, 
    prefix="/triage", 
    tags=["Triage"],
    dependencies=[Depends(verify_firebase_token)]
)

app.include_router(
    navigator.router, 
    prefix="/navigator", 
    tags=["Navigator"],
    dependencies=[Depends(verify_firebase_token)]
)

app.include_router(
    booking.router, 
    prefix="/booking", 
    tags=["Booking"],
    dependencies=[Depends(verify_firebase_token)]
)

app.include_router(
    records.router, 
    prefix="/records", 
    tags=["Records"],
    dependencies=[Depends(verify_firebase_token)]
)

# --- PUBLIC ROUTES ---
# We leave these open for health checks or initial setup (optional)

@app.get("/")
def read_root():
    return {"status": "LyfLify Backend Online", "version": "0.1"}

# Optional: You might want to protect this too, but for a demo, it's often easier to leave open
# or protect it so random people don't reset your database.
@app.get("/queue", dependencies=[Depends(verify_firebase_token)]) 
def read_queue():
    """Get the live clinic queue (Protected)"""
    return get_queue()

@app.post("/seed")
def seed_database():
    """Reset the database (Public for easier demo setup, or protect if desired)"""
    dummy_data = [
        {"time": "08:15", "name": "Thabo Mbeki", "patient_id": "920211...", "score": "High (8/10)", "status": "Waiting", "urgent": True},
        {"time": "08:30", "name": "Gogo Dlamini", "patient_id": "540105...", "score": "Medium (4/10)", "status": "In Review", "urgent": False},
        {"time": "08:45", "name": "Sarah Jones", "patient_id": "880523...", "score": "Low (1/10)", "status": "Checked In", "urgent": False},
    ]
    seed_queue(dummy_data)
    return {"message": "Database seeded with demo data"}
