# 🚀 LeadFlow AI — Intelligent Autonomous CRM

[![React](https://img.shields.io/badge/Frontend-React%2019-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**LeadFlow AI** is an intelligent, agentic CRM built to streamline sales workflows, prevent deal slippage, and automate repetitive pipeline tasks. Powered by specialized autonomous AI agents (built on **Lemma Pods** with fallback support for **OpenRouter** / LLM backends), LeadFlow AI actively analyzes conversation transcripts, tracks commitments and promises made to prospects, monitors lead warmth decay, and crafts personalized pre-call briefs and follow-up drafts.

---

## ✨ Key Features

- **🤖 Autonomous AI Multi-Agent Network**:
  - **Transcript Analyzer Agent** (`transcript-analyzer`): Automatically ingests unstructured meeting notes or call transcripts, identifies company details, assesses qualification, and scores deal potential.
  - **Memory & Promise Tracking Agent** (`memory-agent`): Parses historical interactions to extract explicit customer commitments, action items, and rep promises so nothing slips through the cracks.
  - **Warmth Decay Monitor** (`cold-alert-agent`): Automatically tracks lead inactivity, flags cooling relationships, and notifies reps before a deal goes dormant.
  - **Follow-up Draft Generator** (`follow-up-draft-agent`): Produces hyper-tailored, context-aware 1-click email follow-ups based on the last conversation and open commitments.
  - **Pre-call Briefing Coach** (`pre-call-brief-agent`): Generates pre-meeting executive summaries, opening hooks, key discussion points, and objection-handling strategies.
- **📊 Comprehensive Pipeline & Deal Dashboard**: Live tracking of stage progression, deal values, health scores, and pipeline analytics.
- **⚡ Quick Command Palette (`Cmd + K` / `Ctrl + K`)**: Rapid global navigation and AI-driven fuzzy search across leads, transcripts, and actions.
- **📁 File & Lead Ingestion**: Support for uploading and parsing CSV / Excel sheets to bulk-import and categorize prospect databases.
- **🔒 Authentication & Team Settings**: User registration, session handling, custom AI prompt customization, and API integration settings.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations & Icons**: [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Routing & Networking**: [React Router DOM v7](https://reactrouter.com/), [Axios](https://axios-http.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Server Framework**: [Express](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (executed via `ts-node`)
- **Data Persistence**: JSON Document Store (`backend/data/`) with file-system locking
- **File Parsing**: `multer`, `csv-parse`, `xlsx`
- **Security**: `bcryptjs` password hashing

### AI & Agents
- **Primary AI Agent Runtime**: [Lemma Pods](https://lemma.work) (`lemma-sdk`)
- **Fallback / Secondary AI Engine**: OpenRouter API (`OPENCODE_API_KEY`)

---

## 📂 Project Structure

```text
LeadFlow-CRM/
├── backend/                    # Express + TypeScript API server
│   ├── data/                   # Persistent local JSON data stores
│   │   ├── leads.json          # Active & closed leads, notes, and promises
│   │   ├── settings.json       # Agent configuration & CRM settings
│   │   └── users.json          # User accounts and credentials
│   ├── src/
│   │   └── server.ts           # REST API endpoints & Lemma AI integration
│   ├── package.json
│   └── tsconfig.json
│
├── LeadFlow-AI/
│   └── frontend/               # React 19 + Vite frontend application
│       ├── public/             # Static public assets
│       ├── src/
│       │   ├── assets/         # App assets & media
│       │   ├── components/     # UI components (Command Palette, Layout, etc.)
│       │   ├── context/        # React application contexts (Auth, Theme)
│       │   ├── hooks/          # Custom hooks
│       │   ├── pages/          # App views (Dashboard, Leads, Brief, Alerts, etc.)
│       │   ├── services/       # API client & backend service bridges
│       │   ├── App.tsx         # Main route declarations
│       │   └── main.tsx        # React entrypoint
│       ├── package.json
│       └── vite.config.ts
│
├── CSV file/                   # Sample lead datasets for ingestion testing
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or `pnpm` / `yarn`)

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/LeadFlow-CRM.git
cd LeadFlow-CRM
```

---

### 2. Configure Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
touch backend/.env
```

Add your environment variables inside `backend/.env`:

```env
# Server Configuration (Optional, defaults to 5001)
PORT=5001

# Lemma Pod Configuration
LEMMA_API_URL=https://api.lemma.work
LEMMA_AUTH_URL=https://auth.lemma.work
LEMMA_POD_ID=your_lemma_pod_id_here
LEMMA_API_KEY=your_lemma_api_key_or_session_token

# Fallback AI Engine (OpenRouter / OpenCode)
OPENCODE_API_KEY=your_openrouter_api_key_here
```

> [!NOTE]  
> If Lemma Pod credentials are not provided or the remote pod is unreachable, the system automatically routes AI agent prompts through the fallback model endpoint.

---

### 3. Install Dependencies and Run

#### Backend Server
From the project root:

```bash
cd backend
npm install
npm run dev
```

The backend server will spin up on **`http://localhost:5001`**.

#### Frontend Client
In a separate terminal window, from the project root:

```bash
cd LeadFlow-AI/frontend
npm install
npm run dev -- --port 5175
```

The client application will run on **`http://localhost:5175`**.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and create a session |
| `GET` | `/api/leads` | Retrieve all active leads and stages |
| `POST` | `/api/leads` | Create a new lead |
| `POST` | `/api/analyze` | Ingest meeting notes/transcript & analyze with AI |
| `POST` | `/api/leads/:id/pre-call-brief` | Generate an AI pre-call preparation brief |
| `POST` | `/api/draft-followup/:id` | Draft an intelligent personalized follow-up email |
| `GET` | `/api/alerts` | Fetch deals flagged for warmth decay |
| `POST` | `/api/alerts/:id/draft-reengagement` | Generate re-engagement messaging for cooling leads |
| `GET` | `/api/archive` | Fetch closed, lost, and won deals |
| `POST` | `/api/search` | Full-text and semantic search across CRM records |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
