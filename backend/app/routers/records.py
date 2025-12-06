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

class CreateRecordRequest(BaseModel):
    patient_id: str
    doctor_name: str
    diagnosis: str
    meds: List[str]
    notes: str

@router.post("/create")
async def create_new_record(request: CreateRecordRequest):
    """Doctor submits a new record"""
    
    record_data = {
        "patient_id": request.patient_id,
        "date": datetime.now().strftime("%d %b %Y"), # e.g. "05 Dec 2024"
        "doctor": request.doctor_name,
        "diagnosis": request.diagnosis,
        "meds": request.meds,
        "notes": request.notes,
        "type": "Consultation"
    }
    
    add_patient_record(record_data)
    
    return {"status": "success", "message": "Record created"}


class CreateRecordRequest(BaseModel):
    patient_id: str
    patient_name: str  # <--- NEW FIELD
    doctor_name: str
    diagnosis: str
    meds: List[str]
    notes: str

@router.post("/create")
async def create_new_record(request: CreateRecordRequest):
    """Doctor submits a new record"""
    
    record_data = {
        "patient_id": request.patient_id,
        "patient_name": request.patient_name, # <--- SAVE IT
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
