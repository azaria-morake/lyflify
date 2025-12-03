from fastapi import APIRouter
from app.models.triage import TriageRequest, TriageResponse
from app.services.mock_service import mock_triage_assessment
from app.services.llm import get_llama_assessment 

router = APIRouter()

# 🚀 FEATURE FLAG ENABLED
ENABLE_AI_TRIAGE = True 

@router.post("/assess", response_model=TriageResponse)
async def assess_patient(request: TriageRequest):
    print(f"Analyzing symptoms for patient {request.patient_id}: {request.symptoms}")
    
    if ENABLE_AI_TRIAGE:
        try:
            # 1. Get AI Analysis (returns a dict)
            ai_data = get_llama_assessment(request.symptoms)
            
            # 2. Convert to TriageResponse Model
            # We unpack the dict (**ai_data) because keys match exactly now
            return TriageResponse(**ai_data)
            
        except Exception as e:
            print(f"⚠️ AI Failed: {e}. Falling back to Mock.")
            return mock_triage_assessment(request.symptoms)
    
    else:
        return mock_triage_assessment(request.symptoms)
