<div align="center">

<img src="./screenshots/Home.png" alt="TalentIQ Banner" width="100%" style="border-radius:12px"/>

# 🧠 TalentIQ — AI-Powered Career Intelligence Platform

**Next.js 15 · FastAPI · Google Gemini · PostgreSQL · Stream SDK · Three.js**

*A premium, full-stack AI career ecosystem that bridges the gap between talent and opportunity — through intelligent automation, immersive 3D interfaces, and real-time collaboration.*

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](#)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](#)
[![Frontend: Next.js 15](https://img.shields.io/badge/Frontend-Next.js_15-black.svg)](#)
[![LLM: Google Gemini](https://img.shields.io/badge/LLM-Google_Gemini-4285F4.svg)](#)
[![Mobile: Flutter](https://img.shields.io/badge/Mobile-Flutter_(In_Progress)-02569B.svg)](#)

</div>

---

## 📌 What is TalentIQ?

TalentIQ is not just a job-search tool — it's a **complete AI Career Copilot**. Designed for modern job seekers, students, and career switchers, it combines:

- 🤖 **Generative AI** (Google Gemini) for resume analysis, interview coaching, and roadmap generation
- 🎙️ **Real-time collaboration** via Stream SDK for live interview rooms with shared code editors
- 🌐 **Immersive 3D UI** using Three.js / React Three Fiber for premium visual experiences
- 📊 **Full analytics stack** for tracking applications, interview performance, and skill growth
- 🎓 **Integrated Ed-Tech** (StudyNotion) for learning directly within the platform

The platform follows a signature `Black → Deep Blue → White` design language with glassmorphism, dynamic micro-animations, and WebGL-powered components throughout.

---

## 🖼️ Platform Walkthrough

### 🏠 Landing Page

<img src="./screenshots/Home.png" alt="Landing Page" width="100%"/>

The landing page features an interactive 3D `HeroGlobe`, scroll-reveal animations, and a full walkthrough of TalentIQ's feature ecosystem. Built with Three.js and Framer Motion for a premium first impression.

---

<img src="./screenshots/home2.png" alt="Landing Page Feature Section" width="100%"/>

The second scroll section showcases the platform's core AI pillars with animated feature cards, glowing hover states, and interactive exploder panels.

---

<img src="./screenshots/home3.png" alt="Landing Page Tech Stack" width="100%"/>

The tech stack showcase section with orbital animations and 3D floating technology cards — demonstrating the breadth of the platform's engineering.

---

### 📊 Main Dashboard

<img src="./screenshots/dashboard.png" alt="Dashboard" width="100%"/>

The **central nerve center** of TalentIQ. At a glance, see:
- AI-powered career score and progress indicators
- Recent application activity and upcoming interview reminders
- Quick-access cards to all major platform features
- Real-time resume insights and job match score

---

### 📄 AI Resume Analyzer

<img src="./screenshots/resume_ai.png" alt="Resume AI Analyzer" width="100%"/>

Upload your PDF resume and TalentIQ's AI engine instantly:
- **Extracts** structured data: skills, experience, education, projects
- **Scores** your resume against an ATS vocabulary of 2000+ tech keywords
- **Identifies** gaps and suggests improvements
- **Visualizes** skill coverage with an interactive `ResumeOrb` 3D sphere
- Powered by **PyMuPDF** for extraction and **Google Gemini** for intelligence

---

### 🔍 Job Analysis & Semantic Matching

<img src="./screenshots/job_match.png" alt="Job Analysis" width="100%"/>

Paste any Job Description and TalentIQ performs a **deep comparative analysis** against your resume:
- Hybrid scoring: keyword overlap (Jaccard) + semantic similarity (embedding-based)
- Visual gap analysis: exactly which skills you're missing vs. bonuses you already have
- AI-generated action plan: what to learn before applying
- Match score breakdown across experience, technical skills, and soft skills

---

### 🤖 AI Career Copilot (Chat)

<img src="./screenshots/AI_copilot.png" alt="AI Copilot" width="100%"/>

A persistent **conversational AI assistant** powered by Google Gemini with streaming responses:
- Career advice, resume feedback, and salary negotiation tips
- Interview preparation: generates practice questions on demand
- Technical explanations: ask any coding or system design question
- Context-aware: knows your resume and job targets
- Real-time SSE streaming so responses appear word-by-word

---

### 🎭 Mock Interview Suite

<img src="./screenshots/mock_interview.png" alt="Mock Interview" width="100%"/>

The **AI Interview Engine** — practice with real interview questions for your target role:
- **Role-specific questions**: 10 roles × curated round types (e.g. "Software Engineer → Coding & DS/Algo")
- **360° scoring**: technical accuracy, clarity, completeness, relevance, conciseness, confidence
- **Real-time feedback** after each answer
- **3D animated interviewer avatar** reacts to your responses (idle → thinking → speaking)
- **Coaching report** with AI-generated tips and a full question-by-question breakdown
- **Static fallback**: 320+ curated questions ensure the feature works even when AI is rate-limited

---

### 🔴 Live Interview Room

<img src="./screenshots/live_room.png" alt="Live Interview Room" width="100%"/>

**Professional-grade video interview rooms** powered by Stream Video SDK:
- HD video/audio calls with real-time controls
- Integrated **Monaco Code Editor** (the same editor used in VS Code)
- **Live code execution** via Piston API — run any language in real-time during the interview
- Screen sharing and participant management
- Designed for both candidate practice and recruiter-led technical interviews

---

### ⏪ Interview Replay & Analysis

<img src="./screenshots/replay.png" alt="Interview Replay" width="100%"/>

After every mock interview, the **Replay Engine** gives you:
- A full timeline of every question, answer, and score delta
- Visual performance trajectory chart (score improvement across questions)
- Per-question dimension scores (spider chart view)
- AI coaching notes for each response
- Export and share the full session report

---

### 👥 Talent Groups & Community

<img src="./screenshots/group_chat.png" alt="Groups" width="100%"/>

A **community collaboration layer** within TalentIQ:
- Create or join study groups, project teams, and accountability circles
- Real-time group chat via Stream Chat SDK
- Share resources, job posts, and interview tips within the group
- Group-level analytics: member activity, contribution scores
- Invite system with role-based permissions

---

### 📋 Application Tracker

<img src="./screenshots/tracker.png" alt="Application Tracker" width="100%"/>

A **full Kanban application pipeline** manager:
- Drag-and-drop cards across stages: `Saved → Applied → Interview → Offer → Hired / Rejected`
- Rich job cards: company, role, salary range, application date, notes
- Filter and sort by status, date, or company
- Integration with Job Analysis: tag which resume you used and your match score
- Calendar view for interview scheduling

---

### 🗺️ AI Skill-Gap Roadmap

<img src="./screenshots/roadmap.png" alt="Roadmap" width="100%"/>

Select your **target role** and **experience level** and get a personalised 12-week learning roadmap:
- 10 roles: Software Engineer, Data Scientist, DevOps, ML Engineer, Product Manager, and more
- 3 levels: Beginner / Intermediate / Advanced
- Each week includes: topics, hands-on resources, and recommended courses
- AI-generated for fresh perspectives, with curated static plans as instant fallback
- Resource pills link to the best free learning materials for each topic

---

### 📊 Career Analytics

<img src="./screenshots/analytics.png" alt="Analytics" width="100%"/>

Visual intelligence layer for your job search:
- Application success rate by stage (funnel visualisation)
- Interview performance trends over time
- Skill coverage growth chart (tracked from resume uploads)
- Time-to-response analysis per company
- All charts built with Recharts and Framer Motion animations

---

### 🎓 StudyNotion (Integrated Ed-Tech)

<img src="./screenshots/studynotion.png" alt="StudyNotion" width="100%"/>

A **full Ed-Tech platform embedded within TalentIQ**:
- Browse and enrol in curated tech courses directly linked to your skill gaps
- Instructor dashboard: create, upload, and monetise courses
- Progress tracking with completion certificates
- Course content linked intelligently to your roadmap topics
- Designed to close the loop: identify gap → learn → re-analyse resume

---

## ✨ Feature Summary

| Module | Description | AI Powered |
|---|---|---|
| 🧠 Resume Analyzer | PDF parsing, ATS scoring, 3D viz | ✅ Gemini |
| 🔍 Job Matcher | Semantic + keyword gap analysis | ✅ Gemini |
| 🤖 AI Copilot | Streaming career chat assistant | ✅ Gemini |
| 🎭 Mock Interview | Role × round type, 360° scoring | ✅ Gemini + Static |
| 🔴 Live Room | Video + Monaco IDE + code execution | Stream SDK |
| ⏪ Replay Engine | Timeline, deltas, coaching notes | ✅ Gemini |
| 👥 Groups | Community chat, resources, activity | Stream Chat |
| 📋 Tracker | Kanban pipeline, notes, calendar | — |
| 🗺️ Roadmap | 12-week personalised learning plan | ✅ Gemini + Static |
| 📊 Analytics | Funnel, trends, skill growth charts | — |
| 🎓 StudyNotion | Full Ed-Tech with course creation | — |

---

## 🛠️ Technical Architecture

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** (App Router) | Full-stack React framework with SSR/SSG |
| **React 19 + TypeScript** | Type-safe component architecture |
| **Three.js / React Three Fiber** | 3D WebGL visualizations (Globe, Avatar, Orb) |
| **Framer Motion** | Fluid page transitions and scroll animations |
| **Stream SDK** (Video + Chat) | Real-time video rooms and group messaging |
| **Monaco Editor** | VS Code-grade code editor in the browser |
| **Recharts** | Career analytics data visualization |
| **Clerk** | Authentication and user management |
| **Axios** | HTTP client with interceptors |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async Python 3.11+ REST API |
| **SQLAlchemy** (async) | ORM with PostgreSQL + pgvector |
| **PostgreSQL 16** | Primary database with vector search |
| **Celery + Redis** | Background task queue (resume parsing) |
| **Google Gemini** (`google-genai`) | Primary LLM — all AI features |
| **PyMuPDF** | High-fidelity PDF text extraction |
| **Cloudinary** | Resume and media file storage |
| **Piston API** | Sandboxed multi-language code execution |

### AI / LLM Architecture
```
User Request
     │
     ▼
llm_create()  ──────────────────────────────────┐
     │                                          │
     ▼                                          │
Google Gemini (native SDK)                      │
  ├── gemini-1.5-flash  (primary)               │
  ├── gemini-1.5-flash-8b  (fallback 2)         │
  ├── gemini-1.5-pro  (fallback 3)              │
  └── gemini-2.0-flash  (fallback 4)            │
     │                                          │
     │ All fail (rate limit exhausted)?         │
     ▼                                          │
Static Data Fallback ◄──────────────────────────┘
  ├── Roadmap: 10 roles × 3 levels × 12 weeks
  └── Interview: 10 roles × round types × 320+ Qs
```

**Resilience features:**
- Exponential backoff retry (1s → 2s → 4s per model)
- 4-model automatic fallback chain
- Curated static data as final fallback (zero 503 errors to users)
- All AI features work offline from the LLM

---

## 📁 Project Structure

```
talent-IQ/
├── frontend/                    # Next.js 15 application
│   ├── src/app/                 # App Router pages
│   │   ├── dashboard/           # Main dashboard
│   │   ├── resume/              # AI Resume Analyzer
│   │   ├── job-analysis/        # Job Matcher
│   │   ├── copilot/             # AI Chat Copilot
│   │   ├── mock-interview/      # Interview Engine
│   │   ├── live-interview/      # Stream Video Room
│   │   ├── interview-replay/    # Session Replay
│   │   ├── groups/              # Community Groups
│   │   ├── tracker/             # Application Kanban
│   │   ├── roadmap/             # Career Roadmap
│   │   ├── analytics/           # Career Analytics
│   │   └── studynotion/         # Ed-Tech Platform
│   └── src/components/          # Shared UI components
│       └── 3d/                  # Three.js components
│
├── backend/                     # FastAPI async backend
│   ├── src/
│   │   ├── api/                 # Route handlers
│   │   │   ├── ai_router.py     # Copilot + Roadmap
│   │   │   ├── interview_router.py
│   │   │   ├── job_router.py
│   │   │   ├── resume_router.py
│   │   │   └── live_room_router.py
│   │   ├── core/
│   │   │   ├── openrouter_client.py  # LLM client (Gemini + fallback)
│   │   │   └── auth.py, db.py, feature_flags.py
│   │   ├── data/
│   │   │   ├── roadmap_data.py  # 10 roles × 3 levels static roadmaps
│   │   │   └── interview_data.py # 10 roles × round types × 320+ Qs
│   │   ├── models/              # SQLAlchemy ORM models
│   │   └── workers/             # Celery background tasks
│   └── requirements.txt
│
└── screenshots/                 # Platform screenshots (this README)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 16 (or Supabase)
- Redis (for Celery workers)

### Environment Variables

**`backend/.env`**
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
GOOGLE_API_KEY=your_google_ai_studio_key
CLERK_SECRET_KEY=your_clerk_secret
CLOUDINARY_URL=your_cloudinary_url
STREAM_API_KEY=your_stream_key
STREAM_API_SECRET=your_stream_secret
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pk
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_STREAM_API_KEY=your_stream_key
```

### Fast Launch

```bash
# Clone the repo
git clone https://github.com/yashu1412/TalentIQ.git
cd TaltRoom-AI

# Frontend
cd frontend && npm install && npm run dev

# Backend (new terminal)
cd backend
python -m venv venv && venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

The app will be available at **http://localhost:3000**

---

## 📱 Mobile App — Coming Soon

> [!IMPORTANT]
> **A native mobile application for TalentIQ is currently in active development.**

The TalentIQ mobile app is being built using **Flutter** to deliver a seamless, cross-platform experience on both **iOS and Android**.

**Planned mobile features:**
- 📱 Full interview practice on the go (voice + text modes)
- 🔔 Push notifications for application status updates and interview reminders
- 📄 Resume upload and on-device ATS score preview
- 🗺️ Roadmap progress tracking with daily learning nudges
- 📊 Career analytics dashboard with native charts
- 🎙️ Voice-first AI Copilot optimised for mobile UX
- 👥 Group chat with full Stream SDK mobile integration

**Tech stack (mobile):**
| Technology | Purpose |
|---|---|
| **Flutter** | Cross-platform iOS & Android |
| **Dart** | Primary language |
| **Riverpod** | State management |
| **Dio** | HTTP client connecting to the same FastAPI backend |
| **Stream Flutter SDK** | Chat and video for mobile |
| **Firebase** | Push notifications |

> The mobile app shares the **same FastAPI backend** as the web platform — no separate API. All AI features, interview data, and user accounts are fully synced.

---

## 🚧 Current Status

| Component | Status | Notes |
|---|---|---|
| 🌐 Web Frontend | ✅ Live | Next.js 15, all modules functional |
| ⚙️ Backend API | ✅ Live | FastAPI, full feature coverage |
| 🤖 AI Features | ✅ Live | Gemini with retry + static fallback |
| 🔴 Live Rooms | ✅ Live | Stream Video SDK integrated |
| 🎓 StudyNotion | ✅ Live | Ed-Tech module embedded |
| 📱 Flutter Mobile App | 🏗️ In Progress | Active development |
| 🐳 Docker Deployment | 🔄 In Progress | docker-compose.yml available |
| 📊 Advanced Analytics | 🔄 Refining | Additional chart types in progress |

---

## 🤝 Contributing

TalentIQ is currently a **private project under active development**. Contributions are by invitation only. If you are interested in collaborating, please reach out through the GitHub issues or contact the maintainer directly.

---

## ⚖️ License

**Proprietary © TalentIQ 2026. All rights reserved.**

Unauthorised copying, modification, distribution, or use of this software, in whole or in part, is strictly prohibited without explicit written permission from the author.

---

<div align="center">

Built with ❤️ by **Yashpalsingh Pawara** 

</div>
