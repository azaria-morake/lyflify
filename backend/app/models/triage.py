from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str 
    content: str

class TriageRequest(BaseModel):
    patient_id: str
    patient_name: Optional[str] = "Patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    history: List[ChatMessage]

class TriageResponse(BaseModel):
    reply_message: str
    show_booking: bool
    urgency_score: Optional[int] = None
    color_code: Optional[str] = None
    category: Optional[str] = None
    recommended_action: Optional[str] = None