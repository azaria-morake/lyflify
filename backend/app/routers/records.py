from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.services.firebase import get_patient_records, seed_records, add_patient_record, get_unique_patients
from app.services.llm import explain_prescription, analyze_patient_health, synthesize_doctor_findings

router = APIRouter()

class ExplainRequest(BaseModel):
    diagnosis: str
    meds: List[str]
    notes: str

class AgentGenerateRecordRequest(BaseModel):
    patient_id: str
    patient_name: Optional[str] = "Patient"
    findings: str

@router.post("/agent-generate")
async def agent_generate_record(request: AgentGenerateRecordRequest):
    """AI Clinical Scribe synthesizes doctor findings into a structured medical record."""
    result = synthesize_doctor_findings(request.findings)
    return result

@router.get("/list/{patient_id}")
async def list_records(patient_id: str):
    """Get all records for the patient."""
    records = get_patient_records(patient_id)
    return records or []

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

    now = datetime.now()
    
    record_data = {
        "patient_id": request.patient_id,
        "patient_name": request.patient_name, 
        # CRITICAL: Use ISO format (YYYY-MM-DD) so 2025 > 2024
        "date": datetime.now().strftime("%Y-%m-%d"),
        "created_at": now.isoformat(),
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

@router.get("/ai-summary/{patient_id}")
async def get_health_pulse(patient_id: str):
    """
    Generates a Llama Health Pulse for the patient home screen.
    """
    records = get_patient_records(patient_id)
    if not records:
        return {
            "summary": "Welcome to Sindi Care! You currently have no chronic diagnoses on file. Sindi is ready to assist whenever you need medical guidance.",
            "vital_status": "Clear"
        }
    analysis = analyze_patient_health(records)
    return analysis