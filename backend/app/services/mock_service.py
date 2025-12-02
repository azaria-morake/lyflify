from app.models.triage import TriageResponse

def mock_triage_assessment(symptoms: str) -> TriageResponse:
    symptoms_lower = symptoms.lower()
    
    # Simple keyword matching for demo purposes
    if any(x in symptoms_lower for x in ["chest pain", "heart", "breath", "blood", "collapse"]):
        return TriageResponse(
            urgency_score=9,
            color_code="red",
            category="Emergency",
            ai_reasoning="DETECTED: Keywords indicating potential cardiac or respiratory failure. Immediate intervention required.",
            recommended_action="Admit to Resus Area immediately. Prepare ECG."
        )
    
    if any(x in symptoms_lower for x in ["fever", "dizzy", "vomit", "cough"]):
        return TriageResponse(
            urgency_score=5,
            color_code="orange",
            category="Urgent",
            ai_reasoning="DETECTED: Signs of infection or dehydration. Patient stable but requires attention.",
            recommended_action="Route to Triage Nurse for vitals check."
        )

    # Default to Green
    return TriageResponse(
        urgency_score=2,
        color_code="green",
        category="Routine",
        ai_reasoning="No critical keywords detected. Likely minor ailment or chronic check-up.",
        recommended_action="Queue for General Practitioner."
    )
