# LyfLify [Powered by Llama 3]

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Hackathon](https://img.shields.io/badge/Hackathon-Custom%20Problem%20Statement-orange)
![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript-lightblue)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-yellow)
![AI](https://img.shields.io/badge/AI-Llama%203.1-ff69b4)
![Database](https://img.shields.io/badge/Database-Firebase%20Firestore-blueviolet)

**A Unified, AI-Driven Patient Journey Ecosystem**

> **Hackathon Track:** Custom Problem Statement: "Unifying the Care Continuum"  
> **Live Demo:** https://lyflify.vercel.app/

---

## Overview

LyfLify acts as the **“Operating System” for community healthcare**, bridging the gap between chaotic physical queues and quality consultation.  

It features a **dual-interface system**:

<details>
<summary> Patient Interface (Mobile)</summary>

- **“Nurse Nandiphiwe”**, a **Gogo-friendly empathetic AI persona**, assists patients in triage, explains medical jargon in plain language, and provides **live queue updates**.  
- **Health Pulse**: AI-generated personalized summary of the patient’s health status with actionable tips.  
- **Live Journey Tracker**: Keeps patients updated on appointment status (Pending, Confirmed, Delayed) with estimated wait times.  
- **Jargon Buster**: Button that translates complex diagnoses and prescriptions into simple, easy-to-understand English.

</details>

<details>
<summary> Clinic Interface (Desktop)</summary>

- **Live Queue Dashboard**: Staff can see incoming patients, their AI-assigned urgency scores, and estimated wait times.  
- **Operational Analytics**: Powered by **Llama 3**, providing actionable insights to prevent bottlenecks before they happen.  
- **Digital Consultation**: Doctors can view AI triage notes, record vitals, and issue digital prescriptions efficiently.  
- **Simulation Tools**: Instantly test how the system handles crisis scenarios and see real-time updates for patients.

</details>

---

##  Core Features

### For Patients
![AI Triage](https://img.shields.io/badge/AI%20Triage-✅-pink)
![Health Pulse](https://img.shields.io/badge/Health%20Pulse-✅-green)
![Live Journey Tracker](https://img.shields.io/badge/Live%20Journey%20Tracker-✅-blue)
![Jargon Buster](https://img.shields.io/badge/Jargon%20Buster-✅-orange)

- **AI Triage Chat (Nurse Nandiphiwe)**: Uses Llama 3 to assess symptoms, assign color-coded urgency (Red/Orange/Green), and book appointments automatically.  
- **Health Pulse**: Personalized health insights immediately on login.  
- **Live Journey Tracker**: Real-time appointment status and wait times.  
- **Jargon Buster**: Makes complex medical terms easy to understand.

### For Clinics
![Live Queue](https://img.shields.io/badge/Live%20Queue-✅-purple)
![Operational Analytics](https://img.shields.io/badge/Operational%20Analytics-✅-yellow)
![Digital Consultation](https://img.shields.io/badge/Digital%20Consultation-✅-lightblue)
![Simulation Tools](https://img.shields.io/badge/Simulation%20Tools-✅-red)

- **Live Queue Dashboard**: See all incoming patients and AI urgency scores.  
- **Operational Analytics**: AI-driven insights to optimize staff allocation and prevent bottlenecks.  
- **Digital Consultation**: Doctors can access AI triage notes, record vitals, and issue prescriptions.  
- **Simulation Tools**: Test system performance in simulated crises.

---

## Tech Stack

![React](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript-lightblue)
![Tailwind](https://img.shields.io/badge/Styling-TailwindCSS-green)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-yellow)
![Firebase](https://img.shields.io/badge/Database-Firebase%20Firestore-blueviolet)
![Zustand](https://img.shields.io/badge/State%20Mgmt-Zustand%20%7C%20ReactQuery-purple)
![Llama3](https://img.shields.io/badge/AI-Llama%203.1-pink)

---

## Setup Instructions

<details>
<summary>Prerequisites</summary>

- Node.js v20 LTS  
- Python 3.10+  
- Firebase & Groq Keys (`serviceAccountKey.json` + Groq API Key)  

</details>

<details>
<summary>Frontend Setup</summary>

```bash
cd frontend
npm install
```

Create `.env.development`:
```env
VITE_API_URL=http://localhost:8000
```

Start frontend:
```bash
npm run dev
# Runs on http://localhost:5173
```

</details>

<details>
<summary>Backend Setup</summary>

```bash
cd backend
python -m venv venv
# Activate venv:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Configuration:
- Place `serviceAccountKey.json` in `backend/` root
- Create `.env.groq`:
```env
GROQ_API_KEY=gsk_...
```

Start server:
```bash
uvicorn app.main:app --reload
# Runs on http://127.0.0.1:8000
```

</details>

---

## Demo Accounts

| Role     | Email           | Password | Features |
|---------|-----------------|---------|---------|
| Patient | user@demo.com   | 123456  | AI Triage, Health Pulse, My Records |
| Doctor  | dr@demo.com     | 123456  | Consultation Modal, Vitals, Discharge |
| Admin   | clinic@demo.com | 123456  | Live Queue, Assign Doctors, Analytics |

---

## Future Roadmap

![Dependent Profiles](https://img.shields.io/badge/Dependent%20Profiles-📌-blue)
![Granular Staff Access](https://img.shields.io/badge/Granular%20Staff%20Access-📌-purple)
![Voice Integration](https://img.shields.io/badge/Voice%20Integration-📌-green)
![SMS Notifications](https://img.shields.io/badge/SMS%20%26%20WhatsApp-📌-yellow)
![EHR Interoperability](https://img.shields.io/badge/EHR%20Integration-📌-red)
![Offline Mode](https://img.shields.io/badge/Offline%20Mode-📌-lightblue)

- Dependent Profiles: Allow parents/guardians to manage child & elderly health profiles.  
- Granular Staff Access: RBAC for receptionists, nurses, and specialists.  
- mjolnir Voice Integration: Voice-to-text triage for elderly or illiterate patients.  
- SMS & WhatsApp Notifications: Appointment reminders, queue updates, and prescription summaries.  
- EHR Interoperability: HL7/FHIR integration with national health databases.  
- Offline Mode: PWA access to last-loaded records.

---

## Contact & Contributions

  
**Lead Dev:** Azaria Morake  

💡 Reset demo database: send POST request to `/reset-demo` or use `backend/scripts/reset_demo.py`
