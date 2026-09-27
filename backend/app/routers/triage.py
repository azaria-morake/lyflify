from fastapi import APIRouter
from app.models.triage import TriageRequest, TriageResponse
from app.services.clinical_agent import run_clinical_triage_agent

router = APIRouter()

@router.post("/assess", response_model=TriageResponse)
async def assess_patient(request: TriageRequest):
    print(f"Autonomous Clinical Agent triage for {request.patient_name} ({request.patient_id}): {len(request.history)} messages")
    
    ai_data = await run_clinical_triage_agent(
        patient_id=request.patient_id,
        patient_name=request.patient_name, 
        history=request.history,
        age=request.age,
        gender=request.gender
    )
    
    return TriageResponse(**ai_data)