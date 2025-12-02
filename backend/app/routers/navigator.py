from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timedelta
from app.services.firebase import get_queue

router = APIRouter()

class RouteRequest(BaseModel):
    patient_location: str  # "Soweto, Zone 6"
    transport_type: str    # "Taxi", "Walk", "Car"

class RouteResponse(BaseModel):
    estimated_start_time: str
    queue_position: int
    clinic_status: str     # "On Time", "Delayed", "Smooth"
    traffic_note: str      # "Taxi rank is busy"

@router.post("/calculate", response_model=RouteResponse)
async def calculate_care_path(request: RouteRequest):
    # 1. Get Live Queue Depth from Firebase
    queue = get_queue()
    queue_length = len(queue)
    
    # 2. Define "Heartbeat" (Avg time per patient)
    # In a real app, AI calculates this based on history.
    # For Hackathon, we hardcode logic:
    avg_consult_minutes = 15
    
    # 3. Calculate Delay
    # If there are > 5 people, we are "Delayed"
    clinic_status = "On Time"
    if queue_length > 5:
        clinic_status = "Delayed"
        avg_consult_minutes = 20  # Slower when busy
        
    total_wait_minutes = queue_length * avg_consult_minutes
    
    # 4. Calculate "Best Arrival Time"
    # We want them to arrive 15 mins before their turn
    now = datetime.now()
    arrival_time = now + timedelta(minutes=total_wait_minutes)
    
    # 5. Add "Travel Logic" (Mocked for now)
    # If using Taxi, add 10 mins buffer for waiting at rank
    traffic_note = "Traffic is flowing smoothly."
    if request.transport_type == "Taxi":
        traffic_note = "Allow +10 mins for taxi rank filling."
    
    return RouteResponse(
        estimated_start_time=arrival_time.strftime("%H:%M"),
        queue_position=queue_length + 1,
        clinic_status=clinic_status,
        traffic_note=traffic_note
    )
