from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
# Import the new functions we just created
from app.services.firebase import add_to_queue, update_booking_in_db, delete_booking, get_queue

router = APIRouter()

class BookingRequest(BaseModel):
    patient_id: str
    patient_name: str
    triage_score: int | str
    symptoms: str

class StatusUpdateRequest(BaseModel):
    patient_id: str
    action: str # "approve" or "cancel"

@router.post("/create")
async def create_booking(request: BookingRequest):
    # 1. Logic to Standardize Score/Status
    score_input = str(request.triage_score).lower()
    
    # Defaults
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

    # 2. Determine Initial Status
    # Routine bookings go to "Pending" so the Doctor can approve them
    status = "Emergency En Route" if is_urgent else "Pending Approval"
    
    # 3. Create the Data Object
    booking_data = {
        "patient_name": request.patient_name,
        "patient_id": request.patient_id,
        "score": score_formatted,
        "status": status,
        "urgent": is_urgent,
        "symptoms": request.symptoms,
        "created_at": datetime.now().isoformat(),
        # Default time is TBD until approved
        "time": datetime.now().strftime("%H:%M") if is_urgent else "TBD" 
    }

    # 4. Save to Firestore using our helper
    add_to_queue(booking_data)
    
    return {"status": "success", "booking_status": status}

@router.post("/update")
async def update_booking_status(request: StatusUpdateRequest):
    """
    Handles Doctor Approvals and Patient Cancellations
    """
    if request.action == "approve":
        # Calculate a mock slot time (e.g., +30 mins from now)
        assigned_time = (datetime.now() + timedelta(minutes=30)).strftime("%H:%M")
        
        success = update_booking_in_db(request.patient_id, {
            "status": "Confirmed",
            "time": assigned_time
        })
        if not success:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        return {"status": "approved", "time": assigned_time}
        
    elif request.action == "cancel":
        success = delete_booking(request.patient_id)
        if not success:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        return {"status": "cancelled", "message": "Booking removed"}
        
    return {"status": "no_action"}