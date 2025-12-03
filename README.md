
# LyfLify (Impilo Flow) 🏥💙

**A Unified, AI-Driven Patient Journey Ecosystem.**

> **Hackathon Track:** Custom Problem Statement — "Unifying the Care Continuum"  
> **Live Demo:** [Insert Vercel Link Here]

---

## 📖 Overview

LyfLify acts as the "Operating System" for community healthcare. It bridges the gap between chaotic physical queues and actual consultation.

- **For Patients (Mobile):** A "Gogo-friendly" app to check triage status, book slots, and access medical records.
- **For Clinics (Desktop):** A dashboard to manage live queues and verify AI-generated summaries.

---

## 🛠️ Tech Stack

We are using a **Monorepo** structure (Frontend + Backend in one folder).

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS + Shadcn UI  
- **Backend:** Python (FastAPI)  
- **Database:** Firebase (Firestore)  
- **AI:** Meta Llama 3 (via Groq/LangChain)

![LyfLify Architecture](attachment)

---

## 🚀 Setup Instructions

### Prerequisites

1. **Node.js:** v20 LTS recommended (Avoid Node v23).  
2. **Python:** v3.10+.  
3. **Git**

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/lyflify.git
cd lyflify
```

---

### Step 2: Frontend Setup (Patient App & Doctor Dashboard)

```bash
cd frontend
npm install
```

**Environment Configuration:**

Create `.env.development` in `frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

**Start Frontend:**

```bash
npm run dev
```

> Local URL: http://localhost:5173/

---

### Step 3: Backend Setup (Logic, Database, AI)

```bash
cd backend
```

**Create Virtual Environment:**

- **Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

- **Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Install Dependencies:**

```bash
pip install -r requirements.txt
```

**Database Key:**

- Obtain `serviceAccountKey.json` from Azaria. This is because the file is sensitive.
- Place it inside `backend/`.  
- ⚠️ Do NOT push this file to GitHub.

**Start Backend:**

```bash
uvicorn app.main:app --reload
```

> Local URL: http://127.0.0.1:8000

---

## 🐛 Troubleshooting

1. **"require is not defined" or Tailwind errors**  
   - Delete `node_modules` and run `npm install` again.

2. **"Network Error" on Frontend**  
   - Ensure backend is running and `.env.development` points to `http://localhost:8000`.

3. **"Missing firestore module" in Backend**  
   - Make sure virtual environment is activated. Look for `(venv)` in your terminal prompt.

---

## 👩‍💻 Developer Workflow

**Frontend (UI):**

- Edit `frontend/src/pages`
- Add components: `npx shadcn@latest add [component]`

**Backend (Logic):**

- Edit `backend/app/routers`
- API auto-reloads on save

**Push Changes & Deploy:**

```bash
git add .
git commit -m "Describe your changes"
git push
```

> This will automatically deploy the project to Vercel.

---

## 🏆 Features

- AI-driven triage and summarization
- Real-time queue management
- Patient-friendly mobile experience
- Clinic dashboard with AI verification
- Fully integrated backend with Firebase

---

## 📬 Contact

For questions or to get `serviceAccountKey.json`, reach out to **Azaria**.



# 🛡️ The "Don't Break Prod" Protocol

## The Golden Rule
NEVER push directly to the main branch.  
The main branch is our Live Production site. If you break main, you break the demo for the judges.  
Instead, we use Feature Branches and Pull Requests.

---

## Step 1: Create your "Safe Space" (The Branch)

Before you start coding a new feature (e.g., the Chat UI), create a separate copy of the code.

1. Make sure you have the latest code:

```bash
git checkout main
git pull origin main
```

2. Create your branch:

**Naming convention:** `name/feature-description`  
Example:

```bash
git checkout -b thabo/triage-chat-ui
# or your own:
git checkout -b yourname/feature-name
```

You are now in a safe sandbox. You can break everything here, and the live site remains safe.

---

## Step 2: Work & Save

Write your code. Break things. Fix things.  

When you are ready to save:

```bash
git add .
git commit -m "Added the chat bubbles and send button"
```

---

## Step 3: Push to GitHub (Not Main!)

When you are done, push your specific branch up to the cloud.

```bash
git push origin yourname/feature-name
```

> ⚠️ Don't push `main`. Push **YOUR branch name**.

---

## Step 4: Open a Pull Request (The Magic Moment)

1. Go to our GitHub Repository in your browser.  
2. You will see a yellow banner saying "`yourname/feature-name` had recent pushes".  
3. Click the green button "Compare & pull request".  
4. Write a quick title (e.g., "Added Triage Chat UI") and click **Create Pull Request**.

### 🌟 Why this is amazing for us: Vercel Preview Deployments

As soon as you open that Pull Request, Vercel will automatically build a "Preview Site" just for your code.

- You will see a bot comment with a link (e.g., `lyflify-git-thabo-chat.vercel.app`).  
- You can click that link to see your changes live on a real server, without touching the main `lyflify.vercel.app`.

---

## Step 5: The Merge (My Job)

Do **not** merge your own code. Assign the Pull Request to **Azaria**.

- I will look at the code.  
- I will click the Vercel Preview link to make sure it works.  
- If it's good, I will click the **Merge** button.  

Only when I click Merge does the code go to the Main Live Site.

---

## Summary for the Team

```bash
git checkout -b my-new-feature
# Code code code...
git push origin my-new-feature
# Go to GitHub -> Create Pull Request.
# Wait for review.
```
