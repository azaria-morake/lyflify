from pydantic import BaseModel
from typing import List, Optional

class TriageRequest(BaseModel):
    patient_id: str
    symptoms: str
    age: Optional[int] = None
    gender: Optional[str] = None

class TriageResponse(BaseModel):
    urgency_score: int  # 1-10 scale
    color_code: str     # "red", "orange", "green"
    category: str       # "Emergency", "Urgent", "Routine"
    ai_reasoning: str   # The "Why"
    recommended_action: str
