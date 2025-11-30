# LyfLify (Impilo Flow)

**A Unified, AI-Driven Patient Journey Ecosystem.**


> **Hackathon Track:** Custom Problem Statement — "Unifying the Care Continuum"  
> **Core Intelligence:** Meta Llama 3 AI

---

## Overview

**LyfLify** (pronounced *Life-Lify*) is a community-centered digital companion that bridges the critical gaps in the public healthcare experience. 

Current healthcare solutions often exist in silos—you might have a booking app, or a queueing system, or a translation tool. LyfLify consolidates these into a single **End-to-End Care Path**. It manages the patient lifecycle from the first symptom (Triage), through the logistics of getting there (Navigation), the stress of the visit (Anxiety Reduction), to the long-term understanding of treatment (Records Explainer).

---

## The Problem
**The "Silo Effect" in Community Healthcare.**

High-traffic community facilities suffer from systemic fragmentation.
1.  **Access:** Patients queue physically for hours, risking cross-infection.
2.  **Logistics:** Appointments are static and do not account for real-time delays.
3.  **Treatment:** High anxiety and low health literacy lead to poor procedure adherence.
4.  **Retention:** Patients leave with complex medical notes they cannot understand.

*LyfLify connects these dots to ensure no patient falls through the cracks.*

---

## The Solution: 4 Modules, 1 Ecosystem

LyfLify is built on four interconnected pillars:

### 1. Intelligent Entry (Digital Queue & Triage)
*Replaces chaotic physical lines with transparent virtual queuing.*
* **Feature:** Remote check-in via WhatsApp/USSD.
* **AI Function:** Zero-shot classification of symptoms to prioritize urgent cases over routine check-ups.

### 2. Smart Appointment & Care Path Navigator
*The "GPS" for your healthcare journey.*
* **Feature:** Dynamic scheduling that adjusts based on real-time clinic load.
* **AI Function:** Predictive logic that matches patient travel times with facility throughput to minimize waiting room congestion.

### 3. Empathetic Preparation (Anxiety Reduction)
*Psychological scaffolding before the doctor enters the room.*
* **Feature:** Step-by-step visual guides for upcoming procedures.
* **AI Function:** Sentiment analysis detects fear in user queries and adjusts the response tone to be reassuring, slower-paced, and empathetic.

### 4. Patient Medical Records Explainer
*Turning medical jargon into vernacular advice.*
* **Feature:** Scans discharge notes and converts them into simple instructions.
* **AI Function:** Summarization and translation of HL7/clinical text into local South African languages (e.g., Zulu, Sotho).

---

## Meta Llama AI Integration Strategy

We utilize **Meta Llama 3 (Instruction-tuned)** as the central brain of the operation, leveraging its reasoning capabilities for:

* **Triage Classification:** Parsing unstructured natural language symptoms into triage categories.
* **Style Transfer:** Adapting complex medical text into "Gogo-friendly" (grandmother-friendly) explanations.
* **RAG (Retrieval-Augmented Generation):** Connecting Llama to a vector database of approved medical guidelines to prevent hallucinations.

---

## Technical Architecture

**Mobile-First & Data-Light**

* **Frontend:**
    * **WhatsApp Business API:** For maximum reach (Triage/Notifications).
    * **React Native / PWA:** For the visual dashboard and medical records view.
* **Backend:**
    * **FastAPI (Python):** REST API middleware.
    * **Firebase/Firestore:** Real-time database for queue syncing and user profiles.
* **AI & ML:**
    * **Model:** Meta Llama 3 (via Groq/Hugging Face Inference).
    * **Orchestration:** LangChain.
    * **Vector DB:** Pinecone (for medical context injection).

---

## Getting Started

### Prerequisites
* Node.js & npm
* Python 3.9+
* Meta Llama API Key (or local equivalent)

### Installation

1.  **Clone the Repo**
    ```bash
    git clone [https://github.com/your-username/lyflify.git](https://github.com/your-username/lyflify.git)
    cd lyflify
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm start
    ```

---


## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
