from fastapi import APIRouter, HTTPException
from app.models.triage import TriageRequest, TriageResponse
from app.services.mock_service import mock_triage_assessment
# from app.services.ai_service import get_llama_assessment  <-- ML Engineer will add this later

router = APIRouter()

# FEATURE FLAG
ENABLE_AI_TRIAGE = False  # Set to True once ML Engineer delivers

@router.post("/assess", response_model=TriageResponse)
async def assess_patient(request: TriageRequest):
    print(f"Analyzing symptoms for patient {request.patient_id}: {request.symptoms}")
    
    if ENABLE_AI_TRIAGE:
        # try:
        #     return await get_llama_assessment(request.symptoms)
        # except Exception as e:
        #     print(f"AI Failed: {e}. Falling back to Mock.")
        return mock_triage_assessment(request.symptoms)
    
    else:
        # Fast Mock Response
        return mock_triage_assessment(request.symptoms)
