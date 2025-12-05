from fastapi import APIRouter
from app.models.triage import TriageRequest, TriageResponse
from app.services.llm import get_llama_chat_response 

router = APIRouter()

@router.post("/assess", response_model=TriageResponse)
async def assess_patient(request: TriageRequest):
    # Log the interaction for debugging
    print(f"Chat from {request.patient_name}: {len(request.history)} messages")
    
    # Call the new Conversational Service (Nurse Nandiphiwe)
    # We pass the age and gender so the AI can be context-aware
    ai_data = get_llama_chat_response(
        patient_name=request.patient_name, 
        history=request.history,
        age=request.age,
        gender=request.gender
    )
    
    # Convert the dict back into the Pydantic model
    return TriageResponse(**ai_data)