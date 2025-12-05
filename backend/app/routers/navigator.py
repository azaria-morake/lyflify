from fastapi import APIRouter
from datetime import datetime, timedelta
# Ensure we import update_booking_in_db to avoid NameError
from app.services.firebase import get_queue, update_booking_in_db 

router = APIRouter()

# --- 1. THE DEMO GOD ENDPOINT (Simulate Delay) ---
@router.post("/delay")
async def simulate_clinic_delay():
    """
    DEMO FEATURE: Adds 15 minutes to all active appointments 
    and sets status to 'Delayed'.
    """
    queue = get_queue()
    count = 0
    
    for patient in queue:
        # Only update patients who have a valid time (ignore TBD/Pending)
        if patient.get("time") and ":" in patient.get("time"):
            try:
                # 1. Parse current time
                current_time_str = patient["time"]
                current_dt = datetime.strptime(current_time_str, "%H:%M")
                
                # 2. Add 15 Minutes
                new_time = current_dt + timedelta(minutes=15)
                new_time_str = new_time.strftime("%H:%M")
                
                # 3. Update Firestore
                update_booking_in_db(patient["patient_id"], {
                    "time": new_time_str, 
                    "status": "Delayed" 
                })
                count += 1
            except Exception as e:
                print(f"Skipping {patient.get('patient_id')}: {e}")
                continue
    
    return {"message": f"CRISIS MODE: Delayed {count} patients by 15 mins."}

# --- 2. PATIENT STATUS READER ---
@router.get("/status/{patient_id}")
async def get_patient_journey(patient_id: str):
    queue = get_queue()
    # Sort by created_at string safe logic
    my_bookings = [p for p in queue if p["patient_id"] == patient_id]
    my_bookings.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    
    results = []
    
    for entry in my_bookings:
        status = entry.get("status", "Unknown")
        score = entry.get("score", "Standard")
        
        # Default
        color = "green"
        advice = "Please arrive on time."
        display_time = entry.get("time", "--:--")

        # --- LOGIC MAPPING ---
        
        if status == "Delayed":
            color = "red"
            advice = "⚠ CLINIC DELAYED. We apologize for the wait."
        
        # FIX 3: Specific text for Pending
        elif status == "Pending Approval":
            color = "gray"
            advice = "Pending approval. Please be patient."
            display_time = "--:--"
            
        elif entry.get("urgent") or "Critical" in score or status == "Emergency En Route":
            color = "red"
            advice = "Emergency Team Notified. Proceed immediately."
            # Urgent patients usually get a time immediately, or you can hide it
            
        # FIX 4: Specific text for Confirmed
        elif status in ["Confirmed", "Booked"]:
            color = "teal"
            advice = "Appointment set. Please read details and don't miss your next appointment."
            
        elif status == "Waiting":
            color = "orange"
            advice = "You are in the queue."

        results.append({
            "status": status,
            "symptoms": entry.get("symptoms", "General Checkup"),
            "estimated_time": display_time,
            "advice": advice,
            "color_code": color,
            "ticket_score": score,
            "queue_position": 0 
        })

    return results