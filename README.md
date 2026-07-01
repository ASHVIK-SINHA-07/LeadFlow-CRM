# LeadFlow AI - Intelligent CRM

LeadFlow AI is a premium fullstack CRM designed to keep pipelines active using **Autonomous AI Agents** built on Lemma Pods.

---

## 🛠️ Tech Stack
* **Frontend**: React (Vite, TypeScript, Tailwind CSS, Lucide icons)
* **Backend**: Node.js (Express, TypeScript, local JSON database)
* **AI Engine**: Lemma Pods API + OpenRouter (Fallback engine)

---

## 🚀 Setup & Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd CRMupdated
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
LEMMA_API_URL=https://api.lemma.work
LEMMA_AUTH_URL=https://auth.lemma.work
LEMMA_POD_ID=019f17c5-ee7f-729c-882c-8d04ebb1a1c1

# OpenRouter Key for Robust fallback
OPENCODE_API_KEY=sk-WDfefy3ZwCPekuyWrEPsfU8eJHVqE79jGQiHzepOOTR2Ck9gMGzqLX6CzYPeO6YI

# Lemma Active Session Token
LEMMA_API_KEY=eyJraWQiOiJkLTE3...
```

### 3. Run Locally

#### Start the Backend Server:
```bash
cd backend
npm install
npm run dev
```

#### Start the Frontend App:
```bash
cd LeadFlow-AI/frontend
npm install
npm run dev -- --port 5175
```

Open `http://localhost:5175` in your browser to view the application.

---

## 🤖 AI Agents Implemented
1. **Memory Agent** (`memory-agent`): Readers past conversation logs and summarizes commitments.
2. **Warmth Decay Agent** (`cold-alert-agent`): Monitors lead scores and flags going-cold alerts.
3. **Follow-up Draft Agent** (`follow-up-draft-agent`): Generates tailored 1-click email drafts.
4. **Transcript Analyzer** (`transcript-analyzer`): Automates lead ingestion and scoring.
5. **Pre-call Brief Agent** (`pre-call-brief-agent`): Coaches sales rep on openers/objections before calls.
