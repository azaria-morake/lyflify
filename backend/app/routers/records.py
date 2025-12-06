from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.services.firebase import get_patient_records, seed_records, add_patient_record, get_unique_patients
from app.services.llm import explain_prescription

router = APIRouter()

class ExplainRequest(BaseModel):
    diagnosis: str
    meds: List[str]
    notes: str

@router.get("/list/{patient_id}")
async def list_records(patient_id: str):
    """Get all records. Auto-seeds if empty for the demo."""
    records = get_patient_records(patient_id)
    
    if not records:
        seed_records(patient_id)
        records = get_patient_records(patient_id)
        
    return records

@router.post("/explain")
async def explain_record(request: ExplainRequest):
    """Real-time AI explanation of the record"""
    explanation = explain_prescription(request.diagnosis, request.meds, request.notes)
    return {"explanation": explanation}

# --- CORRECT DEFINITION (Only One Version) ---
class CreateRecordRequest(BaseModel):
    patient_id: str
    patient_name: str  # <--- Essential for the Registry
    doctor_name: str
    diagnosis: str
    meds: List[str]
    notes: str

@router.post("/create")
async def create_new_record(request: CreateRecordRequest):
    """Doctor submits a new record"""
    
    record_data = {
        "patient_id": request.patient_id,
        "patient_name": request.patient_name, 
        # CRITICAL: Use ISO format (YYYY-MM-DD) so 2025 > 2024
        "date": datetime.now().strftime("%Y-%m-%d"), 
        "doctor": request.doctor_name,
        "diagnosis": request.diagnosis,
        "meds": request.meds,
        "notes": request.notes,
        "type": "Consultation"
    }
    
    add_patient_record(record_data)
    
    return {"status": "success", "message": "Record created"}

@router.get("/all-patients")
async def list_all_patients():
    """Returns a unique list of patients who have records."""
    return get_unique_patients()