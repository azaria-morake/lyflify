from fastapi import APIRouter
from datetime import datetime, timedelta
# Ensure we import update_booking_in_db to avoid NameError
from app.services.firebase import get_queue, update_booking_in_db
from collections import Counter

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
    my_bookings = [p for p in queue if p["patient_id"] == patient_id]
    
    # Sort safe logic
    my_bookings.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    
    results = []
    
    for entry in my_bookings:
        status = entry.get("status", "Unknown")
        score = entry.get("score", "Standard")
        
        # ... (keep existing color/advice logic) ...
        # Default
        color = "green"
        advice = "Please arrive on time."
        display_time = entry.get("time", "--:--")

        if status == "Delayed":
            color = "red"
            advice = "⚠ CLINIC DELAYED. We apologize for the wait."
        elif status == "Pending Approval":
            color = "gray"
            advice = "Pending approval. Please be patient."
            display_time = "--:--"
        elif entry.get("urgent") or "Critical" in score or status == "Emergency En Route":
            color = "red"
            advice = "Emergency Team Notified. Proceed immediately."
        elif status in ["Confirmed", "Booked"]:
            color = "teal"
            advice = "Appointment set. Please read details and don't miss your next appointment."
        elif status == "Cancelled":
            color = "gray"
            advice = "This appointment has been cancelled."
        elif status == "Waiting":
            color = "orange"
            advice = "You are in the queue."

        results.append({
            "id": entry.get("id"), # <--- CRITICAL FIX: Pass the Firestore Doc ID
            "status": status,
            "symptoms": entry.get("symptoms", "General Checkup"),
            "estimated_time": display_time,
            "advice": advice,
            "color_code": color,
            "ticket_score": score,
            "queue_position": 0 
        })

    return results

@router.get("/analytics")
async def get_clinic_analytics():
    """
    Aggregates live data for the Clinic Analytics Dashboard.
    """
    queue = get_queue()
    now = datetime.now()
    
    # 1. Key Metrics
    total_patients = len(queue)
    critical_cases = sum(1 for p in queue if p.get("urgent") or "Critical" in p.get("score", ""))
    
    # Avg Wait Time calculation
    total_wait_minutes = 0
    valid_times = 0
    
    # 2. Hourly Traffic (Group by Hour)
    # Initialize 08:00 to 17:00 with 0
    hours_map = {f"{h:02d}:00": 0 for h in range(8, 18)}

    for p in queue:
        created_at_str = p.get("created_at")
        if created_at_str:
            try:
                # Handle ISO format calculation
                created_dt = datetime.fromisoformat(created_at_str)
                wait = (now - created_dt).total_seconds() / 60
                total_wait_minutes += wait
                valid_times += 1
                
                # Hourly bucket
                hour_key = f"{created_dt.hour:02d}:00"
                if hour_key in hours_map:
                    hours_map[hour_key] += 1
            except:
                pass
    
    avg_wait = int(total_wait_minutes / valid_times) if valid_times > 0 else 0
    
    # Efficiency Score (Mock logic: 100 - (5 points per Delayed patient))
    delayed_count = sum(1 for p in queue if p.get("status") == "Delayed")
    efficiency = max(0, 100 - (delayed_count * 5))

    hourly_traffic = [{"time": k, "patients": v} for k, v in hours_map.items()]

    # 3. Categories (Pie Chart) - Based on Score Text
    category_counts = Counter()
    for p in queue:
        score_str = p.get("score", "Routine")
        # Extract "High" from "High (8/10)"
        label = score_str.split(" ")[0] if " " in score_str else score_str
        category_counts[label] += 1
        
    # Map to Brand Colors
    color_map = {
        "Critical": "#ef4444", # Red
        "High": "#f97316",     # Orange
        "Medium": "#0d9488",   # Teal
        "Low": "#94a3b8",      # Slate
        "Routine": "#94a3b8"
    }
    
    diagnosis_data = []
    for label, count in category_counts.items():
        diagnosis_data.append({
            "name": label,
            "value": count,
            "color": color_map.get(label, "#cbd5e1")
        })
        
    if not diagnosis_data: 
        diagnosis_data = [{"name": "No Data", "value": 1, "color": "#f1f5f9"}]

    return {
        "metrics": [
            {"label": "Avg Wait Time", "value": f"{avg_wait}m", "change": "Live", "type": "time"},
            {"label": "Active Queue", "value": str(total_patients), "change": "Live", "type": "users"},
            {"label": "Critical Cases", "value": str(critical_cases), "change": "Live", "type": "alert"},
            {"label": "Efficiency Score", "value": f"{efficiency}%", "change": "Live", "type": "activity"},
        ],
        "hourly_traffic": hourly_traffic,
        "diagnosis_data": diagnosis_data
    }