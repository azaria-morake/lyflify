from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.services.firebase import add_to_queue, update_booking_by_doc_id, delete_booking, get_queue
from app.services.firebase import db
from typing import Optional, List


router = APIRouter()

class BookingRequest(BaseModel):
    patient_id: str
    patient_name: str
    triage_score: int | str
    symptoms: str
    transcript: Optional[str] = None

class StatusUpdateRequest(BaseModel):
    doc_id: str
    action: str # "approve", "assign", "cancel", "delete", "vitals"
    payload: Optional[dict] = None

class NotificationReadRequest(BaseModel):
    patient_id: str
    notification_id: Optional[str] = None

@router.post("/create")
async def create_booking(request: BookingRequest):
    """
    Submits a booking request from Sindi Triage Chat.
    All new requests start with status 'Pending Approval' so Clinic Admin receives an alert.
    """
    score_input = str(request.triage_score).lower()
    
    score_formatted = "Medium (5/10)"
    is_urgent = False
    
    if score_input in ["red", "10", "9", "critical"]:
        score_formatted = "Critical (10/10)"
        is_urgent = True
    elif score_input in ["orange", "7", "8", "yellow", "high", "urgent"]:
        score_formatted = "High (8/10)"
        is_urgent = True
    else:
        score_formatted = "Standard (3/10)"
        is_urgent = False

    # All booking requests await admin approval
    status = "Pending Approval"
    
    booking_data = {
        "patient_name": request.patient_name,
        "patient_id": request.patient_id,
        "score": score_formatted,
        "status": status,
        "urgent": is_urgent,
        "symptoms": request.symptoms,
        "transcript": request.transcript,
        "created_at": datetime.now().isoformat(),
        "time": "--:--" 
    }

    booking_doc = add_to_queue(booking_data)
    
    # Also create incoming live notification for clinic dashboard
    if db:
        try:
            clinic_notif = {
                "title": f"New Booking Request: {request.patient_name}",
                "desc": f"Triage Acuity: {score_formatted} • {request.symptoms[:80]}",
                "time": datetime.now().strftime("%H:%M"),
                "type": "critical" if is_urgent else "alert",
                "patient_name": request.patient_name,
                "patient_id": request.patient_id,
                "doc_id": booking_doc.get("id"),
                "symptoms": request.symptoms,
                "score": score_formatted,
                "transcript": request.transcript,
                "created_at": datetime.now().isoformat(),
                "read": False
            }
            db.collection("clinic_notifications").add(clinic_notif)
        except Exception as e:
            print(f"Error creating clinic notification: {e}")
    
    return {"status": "success", "booking_status": status, "doc_id": booking_doc.get("id")}

@router.post("/update")
async def update_booking_status(request: StatusUpdateRequest):
    """
    Handles Admin/Doctor Approvals, Patient Cancellations, and Deletions
    """
    if not db:
        return {"status": "no_action"}
    doc_ref = db.collection('queue').document(request.doc_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    doc_data = doc.to_dict()
    current_status = doc_data.get("status")

    if current_status == "Cancelled" and request.action != "delete":
        raise HTTPException(
            status_code=400, 
            detail="Cannot update a cancelled booking. Please delete it or create a new one."
        )

    # ACTION: APPROVE & AUTO-SCHEDULE BY AGENT
    if request.action == "approve":
        now = datetime.now()
        arrival_time = (now + timedelta(minutes=10)).strftime("%H:%M")
        vitals_time = (now + timedelta(minutes=20)).strftime("%H:%M")
        doctor_time = (now + timedelta(minutes=30)).strftime("%H:%M")
        pharmacy_time = (now + timedelta(minutes=55)).strftime("%H:%M")
        appointment_date = now.strftime("%Y-%m-%d")

        payload = request.payload or {}
        doctor_name = payload.get("doctor_name", "Dr. Zulu")
        doctor_id = payload.get("doctor_id", "dr.zulu@lyflify.com")

        schedule = {
            "arrival_time": arrival_time,
            "vitals_time": vitals_time,
            "doctor_time": doctor_time,
            "medication_pickup_time": pharmacy_time,
            "appointment_date": appointment_date,
            "interim_notes": "Please rest, stay hydrated with warm fluids, and avoid cold air. If you experience severe chest pain or shortness of breath, call emergency services immediately.",
            "what_to_bring": [
                "South African ID or Passport",
                "Clinic / Health Card",
                "Current chronic medications"
            ]
        }

        # Update booking in queue
        update_booking_by_doc_id(request.doc_id, {
            "status": "Waiting for Doctor",
            "doctor_id": doctor_id,
            "doctor_name": doctor_name,
            "time": doctor_time,
            "schedule": schedule
        })

        # Generate real notification for patient
        patient_id = doc_data.get("patient_id", "demo_user")
        notification_doc = {
            "patient_id": patient_id,
            "title": "Appointment Confirmed! 📅",
            "message": f"Your appointment with {doctor_name} has been approved for {doctor_time}. Sindi has generated your full schedule, preparation instructions, and interim advice in the Visits tab.",
            "type": "appointment_approved",
            "doc_id": request.doc_id,
            "doctor_name": doctor_name,
            "doctor_time": doctor_time,
            "schedule": schedule,
            "created_at": datetime.now().isoformat(),
            "read": False,
            "link": "/visits"
        }
        db.collection("notifications").add(notification_doc)

        return {"status": "approved", "schedule": schedule}

    elif request.action == "assign":
        update_booking_by_doc_id(request.doc_id, {
            "status": "Waiting for Doctor",
            "doctor_id": request.payload.get("doctor_id"),
            "doctor_name": request.payload.get("doctor_name"),
            "time": (datetime.now() + timedelta(minutes=15)).strftime("%H:%M") 
        })
        return {"status": "assigned"}
    
    elif request.action == "cancel":
        success = update_booking_by_doc_id(request.doc_id, {
            "status": "Cancelled",
            "time": "--:--"
        })
        if not success:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"status": "cancelled", "message": "Booking marked as cancelled"}

    elif request.action == "delete":
        delete_booking(request.doc_id)
        return {"status": "deleted"}
        
    return {"status": "unknown_action"}

@router.get("/notifications/{patient_id}")
async def get_patient_notifications(patient_id: str):
    """Fetches in-app notifications for the patient."""
    if not db:
        return []
    try:
        docs = db.collection("notifications").where("patient_id", "==", patient_id).stream()
        results = []
        for d in docs:
            item = d.to_dict()
            item["id"] = d.id
            results.append(item)
        results.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return results
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return []

@router.post("/notifications/read")
async def mark_notifications_read(request: NotificationReadRequest):
    """Marks patient notifications as read."""
    if not db:
        return {"status": "success"}
    try:
        if request.notification_id:
            db.collection("notifications").document(request.notification_id).update({"read": True})
        else:
            docs = db.collection("notifications").where("patient_id", "==", request.patient_id).stream()
            for d in docs:
                db.collection("notifications").document(d.id).update({"read": True})
        return {"status": "success"}
    except Exception as e:
        print(f"Error marking notification read: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/clinic-notifications")
async def get_clinic_notifications():
    """Fetches real-time clinic incoming notifications for staff."""
    if not db:
        return []
    try:
        docs = db.collection("clinic_notifications").stream()
        results = []
        for d in docs:
            item = d.to_dict()
            item["id"] = d.id
            results.append(item)
        results.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return results
    except Exception as e:
        print(f"Error fetching clinic notifications: {e}")
        return []

@router.post("/clinic-notifications/read")
async def mark_clinic_notification_read(payload: Optional[dict] = None):
    """Marks clinic notifications as read."""
    if not db:
        return {"status": "success"}
    try:
        notif_id = payload.get("notification_id") if payload else None
        if notif_id:
            db.collection("clinic_notifications").document(notif_id).update({"read": True})
        else:
            docs = db.collection("clinic_notifications").stream()
            for d in docs:
                db.collection("clinic_notifications").document(d.id).update({"read": True})
        return {"status": "success"}
    except Exception as e:
        print(f"Error marking clinic notifications read: {e}")
        return {"status": "error", "message": str(e)}