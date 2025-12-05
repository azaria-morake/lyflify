from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.firebase import get_patient_records, seed_records
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
