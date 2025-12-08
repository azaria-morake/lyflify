from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.services.firebase import add_to_queue, update_booking_by_doc_id, delete_booking, get_queue
from app.services.firebase import db
from typing import Optional


router = APIRouter()

class BookingRequest(BaseModel):
    patient_id: str
    patient_name: str
    triage_score: int | str
    symptoms: str

class StatusUpdateRequest(BaseModel):
    doc_id: str
    action: str # "approve", "cancel", "delete", "vitals"
    payload: Optional[dict] = None

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
    
    # --- SAFETY CHECK: Prevent actions on Cancelled bookings ---
    doc_ref = db.collection('queue').document(request.doc_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    current_status = doc.to_dict().get("status")

    # If the booking is cancelled, we ONLY allow the 'delete' action.
    # Any attempt to 'assign' or 'approve' will be rejected.
    if current_status == "Cancelled" and request.action != "delete":
        raise HTTPException(
            status_code=400, 
            detail="Cannot update a cancelled booking. Please delete it or create a new one."
        )
    # -----------------------------------------------------------

    if request.action == "assign":
        # New Logic: Assign to specific doctor
        success = update_booking_by_doc_id(request.doc_id, {
            "status": "Waiting for Doctor",
            "doctor_id": request.payload.get("doctor_id"), # You'll need to pass this
            "doctor_name": request.payload.get("doctor_name"),
            "time": (datetime.now() + timedelta(minutes=15)).strftime("%H:%M") 
        })
        return {"status": "assigned"}
    
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