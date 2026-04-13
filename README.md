# TalentIQ - AI Career Copilot

TalentIQ is a comprehensive AI-powered career platform designed to help users land their dream jobs quickly and efficiently through advanced resume analysis, precise semantic job matching, dynamic mock interviews, collaborative coding environments, and 3D visual experiences.

## 🚀 Features

*   **Resume Intelligence (AI Parsing):** Deep PDF text extraction using PyMuPDF and `gpt-4o` LangChain structured parsers with ATS scoring against global tech vocabularies.
*   **Vector Search Job Matching:** Hybrid scoring combining Jaccard capability overlap and OpenAI `text-embedding-ada-002` semantic similarity stored in `pgvector` datasets.
*   **Virtual Mock Interviews:** Chat and voice interfaces evaluated on 6 independent technical communication dimensions by LLM chains.
*   **Live Collaborative Rooms:** Video/Audio rooms powered by the Stream SDK, integrated with a Monaco IDE and Piston API for real-time sandboxed code execution.
*   **Interactive 3D WebGL Interface:** Built natively into Next.js using React Three Fiber, Framer Motion, and Rapier Physics:
    *   `HeroGlobe`: Interactive 3D landing planet
    *   `ResumeOrb`: Reactive physics orb mimicking extraction
    *   `SkillGraph3D`: Node-based job compatibility graph
    *   `InterviewAvatar3D`: Voice-reactive simulated recruiter avatar
    *   `RoomParticles`: Ambient particle arrays synced dynamically to room energy

---

## 🛠️ Technical Stack & Tools

### 🎨 Frontend (Next.js Ecosystem)
- **Core**: Next.js 15 (App Router), React 19, TypeScript.
- **Styling & UI**: Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/) icons.
- **3D & Physics**: [Three.js](https://threejs.org/), [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), [Rapier Physics](https://rapier.rs/), Post-processing effects.
- **State & Animation**: [Zustand](https://zustand-demo.pmnd.rs/) for global state, [Framer Motion](https://www.framer.com/motion/) for fluid transitions.
- **Interactive Tools**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) for live coding, [Recharts](https://recharts.org/) for analytics.
- **Real-time**: [Stream Video & Chat SDKs](https://getstream.io/) for collaborative rooms.

### ⚙️ Backend (FastAPI Ecosystem)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Python).
- **Database & ORM**: PostgreSQL 16 with `pgvector`, [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (Async), [Alembic](https://alembic.sqlalchemy.org/) for migrations.
- **Task Processing**: [Celery](https://docs.celeryq.dev/) with [Redis 7](https://redis.io/) as the message broker and cache.
- **AI & NLP**: OpenAI GPT-4o, [LangChain](https://www.langchain.com/), [PyMuPDF](https://pymupdf.readthedocs.io/) for deep resume parsing.
- **Integrations**: [Cloudinary](https://cloudinary.com/) for media storage, [Svix](https://www.svix.com/) for reliable webhooks.

### 🏗️ Infrastructure & DevOps
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) for full-stack orchestration.
- **Code Execution**: [Piston API](https://github.com/engineer-man/piston) for sandboxed multi-language code execution.
- **Auth**: [Clerk](https://clerk.com/) for secure, scalable authentication.

---

## 🛠️ Quickstart

### Prerequisites

*   Docker and Docker Compose installed
*   Node.js 20+ (for local frontend development)
*   Python 3.11+ (for local backend development)

### 1. Configure Environment Variables

Create `.env` inside `backend/`:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/talent_iq
REDIS_URL=redis://localhost:6379/0
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-proj-...
STREAM_API_KEY=...
STREAM_API_SECRET=...
```

Create `.env.local` inside `frontend/`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STREAM_API_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
```

### 2. Start Application via Docker
The easiest way to run the entire backend + database infrastructure alongside the frontend is via `docker-compose`:

```bash
docker-compose up -d --build
```

### 3. Local Development (Optional)
If you prefer running the backend natively (without Docker):

1.  **Backend Setup**:
    ```powershell
    cd backend
    .\venv\Scripts\activate
    python -m uvicorn src.main:app --reload --port 8000
    ```
    *Note: If `python` is not found, use `.\venv\Scripts\python.exe` directly.*

2.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### 4. Database Initialization (Manual)
---

## ⚖️ License
Proprietary under TalentIQ 2026. All rights reserved.
