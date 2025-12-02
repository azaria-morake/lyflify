from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timedelta
from firebase_admin import firestore
from app.services.firebase import db, get_queue

router = APIRouter()

class BookingRequest(BaseModel):
    patient_id: str
    patient_name: str
    triage_score: str     # "Red", "Orange", "Green"
    symptoms: str

@router.post("/create")
async def create_booking(request: BookingRequest):
    # 1. Get current queue state
    current_queue = get_queue()
    queue_length = len(current_queue)
    
    # 2. Calculate Slot Time
    now = datetime.now()
    
    if request.triage_score.lower() == "red":
        # Emergency: Slot is NOW
        slot_time = now.strftime("%H:%M")
        status = "Emergency En Route"
        is_urgent = True
    else:
        # Routine: Add to back of line (15 mins per person)
        wait_minutes = queue_length * 15
        # Round to nearest 5 mins for neatness
        wait_minutes = 5 * round(wait_minutes/5)
        # Minimum 15 mins travel time
        if wait_minutes < 15: wait_minutes = 15
        
        calculated_time = now + timedelta(minutes=wait_minutes)
        slot_time = calculated_time.strftime("%H:%M")
        status = "Booked"
        is_urgent = False

    # 3. Create the Record
    booking_data = {
        "patient_id": request.patient_id,
        "name": request.patient_name,
        "time": slot_time,
        "score": request.triage_score, # "High (8/10)" or similar logic
        "status": status,
        "urgent": is_urgent,
        "symptoms": request.symptoms,
        "created_at": firestore.SERVER_TIMESTAMP
    }
    
    # 4. Save to Firestore (This updates the Doctor's Dashboard instantly)
    db.collection('queue').add(booking_data)
    
    return {
        "success": True,
        "assigned_time": slot_time,
        "message": f"Booking confirmed for {slot_time}"
    }
