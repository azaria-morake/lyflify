from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
# Import the new helper
from app.services.firebase import add_to_queue, update_booking_by_doc_id, delete_booking

router = APIRouter()

class BookingRequest(BaseModel):
    patient_id: str
    patient_name: str
    triage_score: int | str
    symptoms: str

class StatusUpdateRequest(BaseModel):
    doc_id: str  # CHANGED: We now need the Firestore Document ID
    action: str 

@router.post("/create")
async def create_booking(request: BookingRequest):
    score_input = str(request.triage_score).lower()
    
    score_formatted = "Medium (5/10)"
    is_urgent = False
    
    if score_input in ["red", "10", "9"]:
        score_formatted = "Critical (10/10)"
        is_urgent = True
    elif score_input in ["orange", "7", "8"]:
        score_formatted = "High (8/10)"
        is_urgent = True
    else:
        score_formatted = "Low (3/10)"
        is_urgent = False

    status = "Emergency En Route" if is_urgent else "Pending Approval"
    
    booking_data = {
        "patient_name": request.patient_name,
        "patient_id": request.patient_id,
        "score": score_formatted,
        "status": status,
        "urgent": is_urgent,
        "symptoms": request.symptoms,
        "created_at": datetime.now().isoformat(),
        # FIX 1: Default time is hidden until approved
        "time": "--:--" 
    }

    add_to_queue(booking_data)
    
    return {"status": "success", "booking_status": status}

@router.post("/update")
async def update_booking_status(request: StatusUpdateRequest):
    if request.action == "approve":
        # Calculate a mock slot time (e.g., +30 mins from now)
        assigned_time = (datetime.now() + timedelta(minutes=30)).strftime("%H:%M")
        
        # FIX 2: Use doc_id to target the specific row
        success = update_booking_by_doc_id(request.doc_id, {
            "status": "Confirmed",
            "time": assigned_time
        })
        if not success:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        return {"status": "approved", "time": assigned_time}
        
    elif request.action == "cancel":
        # For cancel, we might still use patient_id or switch to doc_id. 
        # For safety in this demo, let's leave cancel as is or update it if you have the ID.
        pass 
        
    return {"status": "no_action"}