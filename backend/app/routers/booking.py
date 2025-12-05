from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
# Import the new functions we just created
from app.services.firebase import add_to_queue, update_booking_by_doc_id, delete_booking, get_queue
# Ensure db is imported if you need direct access, or rely on services
from app.services.firebase import db 

router = APIRouter()

class BookingRequest(BaseModel):
    patient_id: str
    patient_name: str
    triage_score: int | str
    symptoms: str

class StatusUpdateRequest(BaseModel):
    doc_id: str
    action: str # "approve", "cancel", "delete", "vitals"

@router.post("/create")
async def create_booking(request: BookingRequest):
    # ... (Keep existing create logic) ...
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
        "time": "--:--" 
    }

    add_to_queue(booking_data)
    
    return {"status": "success", "booking_status": status}

@router.post("/update")
async def update_booking_status(request: StatusUpdateRequest):
    """
    Handles Doctor Approvals, Patient Cancellations, and Deletions
    """
    if request.action == "approve":
        assigned_time = (datetime.now() + timedelta(minutes=30)).strftime("%H:%M")
        
        success = update_booking_by_doc_id(request.doc_id, {
            "status": "Confirmed",
            "time": assigned_time
        })
        if not success:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        return {"status": "approved", "time": assigned_time}
    
    # NEW: Updates status to 'Cancelled' (Does NOT delete yet)
    elif request.action == "cancel":
        success = update_booking_by_doc_id(request.doc_id, {
            "status": "Cancelled",
            "time": "--:--" # Reset time
        })
        if not success:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"status": "cancelled", "message": "Booking marked as cancelled"}

    # NEW: Actually removes the record
    elif request.action == "delete":
        try:
            db.collection('queue').document(request.doc_id).delete()
            return {"status": "deleted", "message": "Booking removed permanent"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
    return {"status": "no_action"}