# FluentEdge Academy — English Learning & Teacher Management Platform

A complete, production-grade web platform for English language education, teacher-led instruction, interactive multi-skill exercises, and verified CEFR accreditation, engineered strictly in accordance with the 7-Phase Master Specification.

---

## 🏛️ System Architecture

The platform strictly decouples frontend presentation from backend business logic and database persistence:

```text
Browser / Mobile Client
       │
       ▼
Next.js 14 Frontend (App Router, Tailwind CSS, TypeScript, shadcn UI)
       │
       │ HTTPS REST API Requests (via centralized api client)
       ▼
Node.js + Express Backend (TypeScript, Zod, JWT RBAC, Port 5000)
       │
       ▼
Authoritative Service Layer (Business rules, Course Lock, Payment Workflows)
       │
       ▼
Prisma ORM (Data Access & Type-Safe Queries)
       │
       ▼
PostgreSQL Database (28 Relational Models)
```

```text
english-learning-platform/
│
├── frontend/                     # Next.js 14 Presentation Client
│   ├── src/
│   │   ├── app/                 # App Router (Public, Auth, Superadmin, Teacher, Student, Tracks, Verify)
│   │   ├── components/          # Reusable UI, Layouts, Notifications & 16 Interactive Activity Types
│   │   ├── contexts/            # React AuthContext (JWT & RBAC State)
│   │   ├── lib/                 # Centralized API Client with Auto-Refresh Interceptors
│   │   └── types/               # TypeScript Interfaces
│   ├── tailwind.config.ts       # Design System & Semantic Color Tokens
│   └── package.json
│
└── backend/                      # Node.js + Express REST API Server
    ├── src/
    │   ├── config/              # Env config & OpenAPI/Swagger Specification
    │   ├── controllers/         # Thin HTTP Request Handlers
    │   ├── middleware/          # JWT Auth, RBAC, Validation, Security Headers, Error Handlers
    │   ├── routes/              # Express API Routes (/api/v1/* and /api/docs)
    │   ├── services/            # Authoritative Business, Payment & Notification Logic
    │   ├── utils/               # Response Formatters & Password Security
    │   ├── validators/          # Zod Request Schemas
    │   ├── app.ts               # Express Application Setup
    │   └── server.ts            # Server Entrypoint
    ├── prisma/
    │   ├── schema.prisma        # 28 Relational Database Models
    │   └── seed.ts              # Database Seeder (Admin, Teacher, Student, CEFR Courses, Exercises)
    └── package.json
```

---

## 👥 Three Core User Roles & RBAC Matrix

| Role | Core Capabilities | Protected Dashboard Route |
| :--- | :--- | :--- |
| **`SUPERADMIN`** | Platform oversight, teacher approvals/rejections, student directory, global course publishing, payment auditing, system security logs, configuration settings. | `/superadmin` |
| **`TEACHER`** | Cohort/class management, 7-skill curriculum & lesson builder, manual payment verification queue, assignment grading studio, attendance register, student progress analytics. | `/teacher` |
| **`STUDENT`** | CEFR diagnostic placement test, enrolled course syllabus, payment submission (MOMO/Bank Transfer), 16 interactive exercise types, quizzes, homework submissions, verified certificates. | `/student` |

---

## 🎯 7 CEFR English Levels & 7 Core Skills

* **CEFR Levels**: `Pre-A1 (Foundations)`, `A1 (Beginner)`, `A2 (Elementary)`, `B1 (Intermediate)`, `B2 (Upper Intermediate)`, `C1 (Advanced)`, `C2 (Mastery)`.
* **7 Core Learning Skills**: `Grammar`, `Vocabulary`, `Reading`, `Listening`, `Speaking`, `Writing`, `Pronunciation`.

---

## 💼 Specialized Vocational English Tracks (`/tracks`)

In accordance with Section 41 & 42 of the specification:
1. **Executive Business English & Negotiation** (Boardroom etiquette, tactful pushback, contract bargaining).
2. **English for IT & Software Engineers** (Agile standups, PR code reviews, system outage post-mortems).
3. **Medical English & Clinical Communication** (Empathetic patient intake, ISBAR clinical handovers, diagnosis explanation).
4. **Hospitality, Tourism & Guest Relations** (Concierge diplomacy, service de-escalation, VIP fine dining etiquette).
5. **Global Career & Job Interview Mastery** (STAR storytelling framework, elevator pitches, salary negotiation).
6. **English for Rwanda & East African Commerce** (Cross-border trade terminology, mobile money invoicing, ecotourism guiding).

---

## 🧩 16 Interactive Multi-Skill Activities Suite

Located under `frontend/src/components/activities/`:
* `flashcard-activity.tsx` — 3D card flip animation with Web Speech API text-to-speech pronunciation.
* `fill-blanks-activity.tsx` — Dynamic inline gap-filling with real-time accuracy scoring.
* `matching-activity.tsx` — Interactive two-column vocabulary/definition connector.
* `sentence-reorder-activity.tsx` — Word bank reordering with drag-and-drop feedback.
* `speaking-practice-activity.tsx` — Audio recorder with waveform feedback and self-evaluation.
* `reading-passage-activity.tsx` — Reading comprehension with multi-question assessments.
* `listening-quiz-activity.tsx` — Audio player with variable playback speeds (0.75x, 1.0x, 1.25x).
* `picture-description-activity.tsx` — Visual scene cues for speaking & descriptive writing drills.
* `word-scramble-activity.tsx` — Interactive spelling and vocabulary unscrambler.
* `activity-container.tsx` — Master orchestrator persisting scores to `POST /api/v1/activities/:id/submit`.

---

## 📜 Public Certificate Verification & Notifications

* **Public Verification Portal**: Accessible at `/verify/certificate/[code]` (e.g. `/verify/certificate/ENG-2026-X7Y9`). Safely verifies student credentials, CEFR grade, and instructor validation without authentication.
* **In-App Notification Engine**: Polling notification dropdown bell with unread counters and 1-click navigation across all 3 dashboards.
* **Transactional Email Layer**: Modular service (`backend/src/services/email.service.ts`) for payment confirmations, instructor approvals, and diploma issuances.

---

## 📖 OpenAPI / Swagger Documentation

The backend exposes an interactive OpenAPI 3.0 documentation playground:
* **Interactive UI**: `http://localhost:5000/api/docs`
* **Raw JSON Specification**: `http://localhost:5000/api/docs/openapi.json`

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
* **Node.js** >= 18.x
* **PostgreSQL** database running locally or via cloud (Supabase/Neon)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env

# Configure your PostgreSQL connection string in .env:
# DATABASE_URL="postgresql://user:password@localhost:5432/fluentedge?schema=public"

# Run migrations and generate Prisma Client
npm run prisma:migrate
npm run prisma:generate

# Seed sample users, courses, units, lessons & activities
npm run prisma:seed

# Start the Express API server (port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local

# Start Next.js development server (port 3000)
npm run dev
```

---

## 🔑 Default Seed Accounts

| Role | Email | Password | Access Route |
| :--- | :--- | :--- | :--- |
| **Superadmin** | `admin@platform.com` | `Password123!` | `http://localhost:3000/superadmin` |
| **Teacher** | `teacher@platform.com` | `Password123!` | `http://localhost:3000/teacher` |
| **Student** | `student@platform.com` | `Password123!` | `http://localhost:3000/student` |

---

## 🌐 Production Deployment Architecture

* **Frontend**: Deploy `frontend/` to **Vercel** with `NEXT_PUBLIC_API_URL=https://api.fluentedge.edu/api/v1`.
* **Backend**: Deploy `backend/` to **Render** / **Railway** with `PORT=5000`, `NODE_ENV=production`, and `FRONTEND_URL=https://fluentedge.edu`.
* **Database**: Hosted on **Supabase** or **Neon PostgreSQL**.
* **Storage**: Integrated with **Cloudinary** or S3-compatible object storage.
