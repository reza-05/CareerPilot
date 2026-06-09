# CareerPilot — Complete Technical Documentation

> **Version:** 1.0.0 · **Status:** Production-Ready · **Classification:** Internal Engineering

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [System Design](#3-system-design)
4. [Stack Report & Justification](#4-stack-report--justification)
5. [Dependencies & Setup](#5-dependencies--setup)
6. [Security](#6-security)
7. [Deployment Guide](#7-deployment-guide)
8. [Evaluation Suite](#8-evaluation-suite)
9. [Submission Checklist](#9-submission-checklist)

---

## 1. Project Overview

CareerPilot is a full-stack, AI-powered career workspace for job seekers. It uses the user's CV as the single source of truth across job discovery, match scoring, AI assistant guidance, cover-letter drafting, application tracking, deadlines, goals, and weekly progress analytics.

The project is intentionally full-stack — combining a polished SaaS-grade frontend, secure per-user authentication, CV vector retrieval, external job search, multi-provider AI generation, and a productivity tracker.

---

## 2. System Architecture

### 2.1 High-Level Overview

CareerPilot is structured around three primary layers:

- **Frontend** — Next.js owns the user experience and all UI state.
- **Firebase** — owns identity (Auth) and user-scoped cloud state (Firestore).
- **FastAPI Backend** — owns CV processing, retrieval, job enrichment, tracker APIs, and AI provider orchestration.

```
flowchart LR
  U["User Browser"] --> FE["Next.js Frontend"]
  FE --> AUTH["Firebase Auth"]
  FE --> FS["Firestore: user-scoped profile state"]
  FE --> API["FastAPI Backend"]
  API --> CV["CV Parser + Sanitizer"]
  API --> VEC["ChromaDB CV Vector Index"]
  API --> DB["SQLite Tracker Store"]
  API --> SEARCH["Tavily Job Search"]
  API --> GEM["Gemini Primary LLM"]
  API --> GROQ["Groq Fallback LLM"]
```

### 2.2 Main Product Flow

1. User signs in with Firebase.
2. User uploads a CV or builds a manual profile.
3. Backend validates the file, extracts text, chunks it, and indexes CV content.
4. User searches for jobs in natural language.
5. Backend retrieves jobs, compares role requirements against the CV, generates fit scores, and returns ranked cards.
6. User can ask AI about a selected job. The assistant receives both selected-job context and saved CV context.
7. User tracks jobs into the tracker, adds deadlines/goals, and views progress analytics.

### 2.3 Data Isolation

CareerPilot is designed around strict user-scoped data isolation:

- Firebase `uid` identifies the signed-in user.
- Frontend profile, CV metadata, photo, and UI state are scoped by `uid`.
- Firestore rules restrict reads and writes to the authenticated user's own document tree.
- Backend endpoints verify Firebase ID tokens when `REQUIRE_FIREBASE_AUTH=true`.
- Tracker and CV operations receive user context so separate users do not overwrite each other's workspace.

**Recommended Firestore Rule:**

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /careerpilot_users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2.4 AI Provider Strategy

CareerPilot uses **Gemini** as the primary model for strong reasoning on CV/job comparison and career guidance. **Groq** is configured as a fallback so the demo continues when the primary provider is rate-limited or unavailable.

The backend avoids hardcoded responses. If AI enrichment fails, the app still returns useful job data and shows user-friendly messages instead of backend errors.

### 2.5 Deployment Shape

| Environment | Frontend | Backend | Services |
|---|---|---|---|
| Development | `localhost:3000` | `localhost:8000` | Firebase hosted |
| Docker | `frontend` service | `backend` service | Named volumes for uploads/vectors |
| Production | Vercel / Netlify | Render / Fly.io / Railway | Firestore + Managed Postgres + Managed Vector DB |

---

## 3. System Design

### 3.1 Product Goal

The main design principle: **the user's CV/profile becomes the source of truth for the entire job-search workflow.**

### 3.2 Core Data Flows

#### CV Flow

1. User signs in with Firebase.
2. User uploads a CV or creates a manual profile.
3. Frontend sends an authenticated request to the backend.
4. Backend validates file type, size, and filename.
5. Backend extracts text, sanitizes content, chunks the CV, and stores semantic chunks.
6. Frontend saves CV metadata and profile state under the authenticated user's workspace.
7. Job Hunter and Assistant use this saved profile context.

#### Job Matching Flow

1. User enters a natural-language search query.
2. Backend searches jobs through Tavily.
3. Results are normalized into consistent job cards.
4. CareerPilot compares each job against CV/profile context.
5. AI generates practical match explanations when provider capacity is available.
6. Frontend sorts by best match by default and supports additional sort modes.

#### Selected-Job Assistant Flow

1. User clicks `Ask AI` on a job card.
2. Assistant receives selected job context: title, company, location, deadline, salary, URL, match score, and fit reason.
3. Assistant also receives saved CV/profile context.
4. Response focuses on fit, gaps, next steps, and application strategy.
5. Chat persists until the user clears it.

#### Tracker Flow

1. User tracks a job from Job Hunter.
2. Job enters the application tracker.
3. If a deadline is available, it appears in the calendar.
4. If no deadline is found, user receives a short manual deadline prompt.
5. Dashboard updates applications, statuses, goals, streaks, and activity.

### 3.3 Storage Design

| Data | Current Storage | Reason |
|---|---|---|
| Identity | Firebase Auth | Managed secure authentication |
| User profile state | Firestore + local cache | Per-user persistence |
| CV metadata | Firestore + local cache | Prevent repeated uploads |
| CV chunks | ChromaDB | Semantic retrieval for CV-grounded AI |
| Tracker records | SQLite | Fast MVP persistence |
| Temporary CV files | Backend storage | Parsing pipeline |

### 3.4 Scaling to 10,000 Users

| Area | MVP | 10,000-user upgrade |
|---|---|---|
| Relational data | SQLite | Postgres with indexed user/application tables |
| Vector storage | Local ChromaDB | Managed vector DB or hosted Chroma with user namespaces |
| File storage | Local temp folder | Firebase Storage or S3 with authenticated rules |
| AI calls | Direct provider calls | Retry budget, caching, queueing, provider health checks |
| Job search | Live API call | Cached query results and pagination |
| CV processing | Request-time work | Background queue with status updates |
| Observability | Local logs | Structured logs, latency metrics, provider dashboards |
| Security | Local-friendly defaults | Strict CORS, HTTPS, token verification, rate limiting |

### 3.5 Estimated Cost Per User Per Month

**Assumptions:**
- 10,000 registered users · 2,000 monthly active users
- Each active user uploads/replaces one CV per month
- Each active user performs 10 job searches and sends 20 assistant messages per month

| Component | Driver | Cost Control |
|---|---|---|
| LLM | Explanations, chat, cover letters | Prompt limits, fallback model, caching |
| Search | Tavily job discovery | Query cache, debounce, result reuse |
| Vector DB | CV chunks | Delete replaced CV chunks, namespace by user |
| Backend | API traffic | Autoscaling container |
| Database | Tracker/profile reads/writes | Indexed queries |
| Storage | CV files and metadata | Store parsed text or encrypted files only when needed |

> Expected MVP cost is primarily driven by AI and search usage, not frontend hosting. Reusing CV embeddings and caching common searches keeps per-active-user cost low.

### 3.6 Key Bottlenecks

| Bottleneck | Risk | Mitigation |
|---|---|---|
| AI provider quota | Slow or missing AI responses | Gemini timeout budget + Groq fallback |
| Search latency | Job Hunter feels slow | Batch results, cache, loading states |
| PDF parsing quality | Bad extraction reduces match quality | Manual CV builder and DOCX support |
| SQLite concurrency | Not production scale | Move to Postgres |
| Local vector DB | Hard to horizontally scale | Managed vector DB |
| Long chat responses | Poor UI usability | Auto-scroll, copy action, response limits |
| Secrets | API key leakage | Environment variables and private `.env` files |

### 3.7 Production Roadmap

1. Move tracker data to Postgres.
2. Move uploaded files to Firebase Storage or S3.
3. Use managed vector storage.
4. Add background jobs for CV parsing and AI enrichment.
5. Add rate limiting per authenticated user.
6. Add monitoring for AI/search provider failures.
7. Add email reminders for application deadlines.

---

## 4. Stack Report & Justification

### 4.1 Frontend: Next.js · React · TypeScript

Next.js provides fast routing, production builds, API proxying, and a strong developer experience. React enables reusable UI components across the CV workspace, job cards, tracker board, and AI chat. TypeScript reduces runtime mistakes by validating data shape across the frontend.

**Why it fits:** Strong for hackathon demos and real products. Easy deployment to Vercel or Docker. Clean separation between pages, components, and shared libraries.

### 4.2 Styling: Tailwind CSS · Lucide Icons

Tailwind allows consistent spacing, color, responsive behavior, and fast UI iteration. Lucide icons keep the interface clean and professional without custom icon complexity.

**Why it fits:** Maintains the blue/white SaaS design system. Supports responsive layouts across laptop, desktop, tablet, and phone.

### 4.3 Identity & Cloud State: Firebase Auth · Firestore

Firebase Auth provides reliable Google sign-in and email/password authentication. Firestore stores user-scoped profile data, CV metadata, avatar, and workspace state.

**Why it fits:** Fast, production-grade authentication. User-specific data isolation through security rules. Avoids building custom auth under hackathon time pressure.

### 4.4 Backend: FastAPI · Python

FastAPI powers CV processing, job enrichment, tracker APIs, and AI orchestration. Python is a natural fit for document parsing, vector retrieval, and AI workflows.

**Why it fits:** High performance with simple API definitions. Strong ecosystem for AI, parsing, and backend validation. Easy local development with Uvicorn.

### 4.5 Database: SQLAlchemy · SQLite

SQLAlchemy avoids unsafe raw SQL and provides structured database access. SQLite is lightweight and appropriate for hackathon-scale tracker persistence.

**Why it fits:** Fast to run locally. No external database required for demo. Can migrate to Postgres later without changing the whole backend architecture.

### 4.6 Vector Store: ChromaDB

ChromaDB stores CV chunks and supports semantic retrieval for CV-grounded job matching and assistant responses.

**Why it fits:** Local vector search without additional cloud setup. Useful for explainable, CV-aware recommendations. Keeps the assistant grounded in the user's own profile.

### 4.7 AI Providers: Gemini · Groq

Gemini is the primary reasoning model for fit explanations and career guidance. Groq is the fallback when Gemini is rate-limited or unavailable.

**Why it fits:** Multi-provider resilience improves demo reliability. Avoids hardcoded AI responses. Keeps responses dynamic and contextual.

### 4.8 Job Search: Tavily

Tavily provides web search for real job discovery.

**Why it fits:** Enables live job search instead of static mock listings. Works well with natural-language queries. Keeps CareerPilot useful across different candidate backgrounds.

### 4.9 Summary

CareerPilot needs four things simultaneously: a polished product UI, authenticated user isolation, AI reasoning, and real job discovery. This stack balances speed, credibility, and extensibility — simple enough to demo reliably, structured enough to become a production product.

### 4.10 Known Production Upgrade Path

- Replace SQLite with Postgres.
- Move ChromaDB to a managed vector database.
- Store uploaded CV files in Firebase Storage or S3.
- Set `REQUIRE_FIREBASE_AUTH=true` for backend endpoints.
- Add observability, rate limiting, and queue-based AI jobs.
- Deploy frontend and backend separately with HTTPS.

---

## 5. Dependencies & Setup

### 5.1 Runtime Requirements

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 22+ | Required for frontend |
| Python | 3.11 | Recommended; 3.9 triggers end-of-life warnings in Google packages |
| Firebase | — | Authentication + Firestore enabled |
| Gemini API Key | — | Primary AI provider |
| Groq API Key | — | Fallback AI provider |
| Tavily API Key | — | Job search |

### 5.2 Frontend Dependencies

| Package | Purpose |
|---|---|
| `next` | Full-stack React framework and production server |
| `react`, `react-dom` | UI rendering |
| `typescript` | Type safety |
| `firebase` | Firebase Auth and Firestore client |
| `next-themes` | Dark/light mode |
| `lucide-react` | Professional icon set |
| `tailwindcss`, `@tailwindcss/postcss` | Styling system |
| `sonner` | Toast notifications |
| `radix-ui`, `shadcn` | UI primitives and component support |
| `clsx`, `tailwind-merge`, `class-variance-authority` | Class composition |
| `@google/generative-ai`, `chromadb` | AI/vector client support |

**Install:**

```bash
cd careerpilot-frontend
npm install
```

**Verify:**

```bash
npm run lint
npm exec tsc -- --noEmit --incremental false
npm run build
```

### 5.3 Backend Dependencies

| Package | Purpose |
|---|---|
| `fastapi` | Backend API framework |
| `uvicorn[standard]` | ASGI server |
| `python-multipart` | File uploads |
| `python-dotenv`, `pydantic-settings` | Environment configuration |
| `pydantic` | Request/response validation |
| `sqlalchemy` | Safe ORM database access |
| `chromadb` | Local vector database |
| `pypdf`, `python-docx` | CV text extraction |
| `langchain-text-splitters` | CV chunking |
| `google-genai` | Gemini API |
| `groq` / `requests` | Groq fallback calls |
| `tavily-python` | Job search |
| `numpy` | Similarity calculations |
| `firebase-admin` | Optional backend Firebase token verification |

**Install:**

```bash
cd careerpilot-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Verify:**

```bash
python3 -m compileall app main.py
```

### 5.4 Environment Configuration

**Frontend:**

```bash
cp careerpilot-frontend/.env.example careerpilot-frontend/.env.local
```

**Backend:**

```bash
cp careerpilot-backend/.env.example careerpilot-backend/.env
```

> ⚠️ Never commit real API keys or service account JSON files.

### 5.5 Docker Commands

```bash
docker compose up --build
docker compose down
```

Use Docker when the app is ready for submission or demo replay. It ensures a consistent run environment across machines.

---

## 6. Security

> This section maps CareerPilot security controls to common OWASP risks.

### 6.1 Authentication & Access Control

- Firebase Auth provides Google and email/password authentication.
- Firestore rules are user-scoped by Firebase UID.
- Backend verifies Firebase ID tokens when `REQUIRE_FIREBASE_AUTH=true`.
- Frontend sends Firebase Bearer tokens for all protected API requests.

**Recommended production setting:**

```env
REQUIRE_FIREBASE_AUTH=true
```

### 6.2 Injection Protection

- Backend database operations use SQLAlchemy ORM patterns.
- User input is validated and bounded before search, AI, and database operations.
- Direct SQL string concatenation with user input is strictly avoided.

### 6.3 XSS Protection

- React escapes all normal rendered text by default.
- User-submitted text is sanitized before backend processing.
- `dangerouslySetInnerHTML` is not used.
- Security headers include `X-Content-Type-Options`, `X-Frame-Options`, and a restrictive permissions policy.

### 6.4 Secret Management

- All API keys are loaded through environment variables.
- `.env` and `.env.local` are never committed.
- Firebase frontend public keys may be public; backend service credentials must never be committed.

### 6.5 Safe File Uploads

- Uploads are restricted to expected CV document types.
- File names are normalized on receipt.
- File size limits are enforced.
- Uploaded content is processed as data — never executed.

### 6.6 Error Handling

- Public API responses use generic user-facing error messages.
- Stack traces, local paths, raw provider errors, and database internals remain in server logs only.

### 6.7 Dependency Safety

- Frontend uses a PostCSS override for a patched, secure version.
- Run `npm audit` before submission.
- Python 3.11+ is required for deployment to avoid end-of-life warnings.

### 6.8 Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /careerpilot_users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6.9 Production Hardening Checklist

- [ ] Enable HTTPS everywhere.
- [ ] Rotate API keys after public demos.
- [ ] Set strict `ALLOWED_ORIGINS`.
- [ ] Enable Firebase backend verification.
- [ ] Move SQLite to Postgres for multi-user production scale.
- [ ] Store uploaded files in Firebase Storage/S3 with authenticated rules.
- [ ] Add rate limiting on AI and search endpoints.
- [ ] Add monitoring for provider failures and latency.

---

## 7. Deployment Guide

### 7.1 Recommended Architecture

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render / Railway / Fly.io |
| Auth & Database | Firebase Authentication + Firestore |

### 7.2 Step 1 — Deploy Backend First

The frontend depends on `BACKEND_SERVICE_URL`, so the backend must be deployed first.

**Start command:**

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

If `$PORT` is not provided by the host:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Backend environment variables:**

```env
GOOGLE_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
TAVILY_API_KEY=your_tavily_api_key
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
REQUIRE_FIREBASE_AUTH=true
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GEMINI_BUDGET_SECONDS=6
GROQ_TIMEOUT_SECONDS=8
```

> For first smoke test only, `REQUIRE_FIREBASE_AUTH=false` may be used temporarily. For final judging, use `true` if Firebase Admin credentials are configured.

### 7.3 Step 2 — Deploy Frontend on Vercel

```
Framework Preset:   Next.js
Root Directory:     careerpilot-frontend
Install Command:    npm install
Build Command:      npm run build
Output Directory:   .next
```

**Frontend environment variables:**

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
BACKEND_SERVICE_URL=https://your-backend-public-url
```

### 7.4 Step 3 — Firebase Configuration

**Enable Authentication providers:**
- Google
- Email/password

**Add authorized domains:**
- `localhost`
- Your Vercel domain

**Enable Firestore** with the rule from Section 6.8.

### 7.5 Step 4 — Smoke Test

After deployment, verify the following in order:

1. Open the Vercel URL.
2. Sign in with Google.
3. Upload a CV.
4. Search for jobs.
5. Open `Ask AI` on a selected job.
6. Track a job.
7. Open Tracker and verify dashboard/deadline data.

### 7.6 Step 5 — Submission

Submit the Vercel URL only if the hosted version is stable. If the backend is not stable before the deadline, submit the documented Docker/local setup instead of a broken deployment link.

---

## 8. Evaluation Suite

All 15 test cases passed.

| # | Test Case | Objective | Verdict |
|---|---|---|---|
| 1 | Authentication Gate | Protected pages require a signed-in user | ✅ Pass |
| 2 | Google Sign-In | Firebase Google login works correctly | ✅ Pass |
| 3 | Email Signup Validation | Weak passwords blocked; strong passwords accepted | ✅ Pass |
| 4 | Saved CV State | Uploaded CV persists after reload and server restart | ✅ Pass |
| 5 | CV Replacement Reset | New CV replaces old profile context completely | ✅ Pass |
| 6 | Job Search Results | Live search returns multiple structured, ranked results | ✅ Pass |
| 7 | Match Score Explanation | Scores reference CV skills, experience, and gaps | ✅ Pass |
| 8 | Selected-Job AI Chat | Job context and CV context both reach the assistant | ✅ Pass |
| 9 | Chat Auto Scroll | Newest messages remain visible automatically | ✅ Pass |
| 10 | Tracker Deadline Behavior | Calendar markers appear and disappear correctly | ✅ Pass |
| 11 | Missing Deadline Prompt | User is prompted to add a deadline manually | ✅ Pass |
| 12 | Progress Dashboard | Dashboard uses real tracker and profile data | ✅ Pass |
| 13 | Responsive UI | No awkward scrolling across mobile, tablet, laptop, desktop | ✅ Pass |
| 14 | AI Fallback | Groq fallback or friendly message when Gemini unavailable | ✅ Pass |
| 15 | User Data Separation | Two users never share CV, profile, or tracker data | ✅ Pass |

### Detailed Test Cases

---

**Test Case 1 — Authentication Gate**

| Field | Detail |
|---|---|
| Objective | Verify protected pages require a signed-in user |
| Input | Open `/cv-upload`, `/job-hunter`, `/assistant`, or `/tracker` while signed out |
| Expected Output | User is guided to login before accessing app features |
| Actual Output | Protected app flow requires authentication |
| Verdict | ✅ Pass |

---

**Test Case 2 — Google Sign-In**

| Field | Detail |
|---|---|
| Objective | Verify Firebase Google login |
| Input | Click login and continue with Google |
| Expected Output | User signs in and reaches CareerPilot workspace |
| Actual Output | Google login works and app navigation appears |
| Verdict | ✅ Pass |

---

**Test Case 3 — Email Signup Validation**

| Field | Detail |
|---|---|
| Objective | Verify secure email/password account creation |
| Input | Enter email, weak password, then strong matching passwords |
| Expected Output | Weak password is blocked; valid password enables account creation |
| Actual Output | Password and confirm-password validation control the signup button |
| Verdict | ✅ Pass |

---

**Test Case 4 — Saved CV State**

| Field | Detail |
|---|---|
| Objective | Verify uploaded CV remains available after reload |
| Input | Upload a PDF CV, reload the website, restart servers |
| Expected Output | Same user sees saved CV metadata and can continue without re-upload |
| Actual Output | Saved CV card appears for the authenticated user |
| Verdict | ✅ Pass |

---

**Test Case 5 — CV Replacement Reset**

| Field | Detail |
|---|---|
| Objective | Verify new CV replaces old profile context |
| Input | Upload CV A, use Job Hunter/Assistant, then upload CV B |
| Expected Output | Old job/chat context resets and app uses CV B |
| Actual Output | Workspace resets for the new CV context |
| Verdict | ✅ Pass |

---

**Test Case 6 — Job Search Results**

| Field | Detail |
|---|---|
| Objective | Verify live job search returns multiple structured results |
| Input | Search `Remote developer jobs open to Bangladesh` |
| Expected Output | Multiple job cards with title, company, location, deadline/salary fallback, match score, and explanation |
| Actual Output | Job Hunter returns structured fit-ranked cards |
| Verdict | ✅ Pass |

---

**Test Case 7 — Match Score Explanation**

| Field | Detail |
|---|---|
| Objective | Verify match score is explainable and CV-aware |
| Input | Compare a strong technical CV against software/internship jobs |
| Expected Output | Explanation references relevant CV skills, experience, and gaps |
| Actual Output | Explanation describes alignment and missing evidence |
| Verdict | ✅ Pass |

---

**Test Case 8 — Selected-Job AI Chat**

| Field | Detail |
|---|---|
| Objective | Verify job context reaches the assistant |
| Input | Click `Ask AI` on a job and ask for next steps |
| Expected Output | Assistant references selected role and CV/profile context |
| Actual Output | Assistant provides role-specific guidance |
| Verdict | ✅ Pass |

---

**Test Case 9 — Chat Auto Scroll**

| Field | Detail |
|---|---|
| Objective | Verify newest messages remain visible |
| Input | Send a message and wait for AI response |
| Expected Output | Chat scrolls to user message, loading state, and AI reply |
| Actual Output | Chat automatically scrolls to the latest content |
| Verdict | ✅ Pass |

---

**Test Case 10 — Tracker Deadline Behavior**

| Field | Detail |
|---|---|
| Objective | Verify tracked job deadlines appear and disappear correctly |
| Input | Track a job with deadline, then delete it |
| Expected Output | Calendar marker appears after tracking and disappears after deletion |
| Actual Output | Calendar reflects current tracked jobs |
| Verdict | ✅ Pass |

---

**Test Case 11 — Missing Deadline Prompt**

| Field | Detail |
|---|---|
| Objective | Verify user gets guidance when no deadline is detected |
| Input | Track a job without deadline information |
| Expected Output | App asks user to add a deadline manually |
| Actual Output | Short formal warning appears |
| Verdict | ✅ Pass |

---

**Test Case 12 — Progress Dashboard**

| Field | Detail |
|---|---|
| Objective | Verify dashboard uses real tracker/profile data |
| Input | Track, move, and delete applications |
| Expected Output | Status counts, weekly activity, and profile skills update from real state |
| Actual Output | Dashboard reflects tracked application data |
| Verdict | ✅ Pass |

---

**Test Case 13 — Responsive UI**

| Field | Detail |
|---|---|
| Objective | Verify pages work across mobile, laptop, and desktop |
| Input | Test at mobile, tablet, 13-inch laptop, and 22-inch desktop sizes |
| Expected Output | No core workflow requires awkward horizontal scrolling |
| Actual Output | Main pages are responsive and readable |
| Verdict | ✅ Pass |

---

**Test Case 14 — AI Fallback**

| Field | Detail |
|---|---|
| Objective | Verify app handles AI provider limits gracefully |
| Input | Trigger AI when Gemini is unavailable or rate-limited |
| Expected Output | Backend attempts Groq fallback or returns friendly unavailable response |
| Actual Output | Fallback path keeps app stable |
| Verdict | ✅ Pass |

---

**Test Case 15 — User Data Separation**

| Field | Detail |
|---|---|
| Objective | Verify two users do not share CV/profile/tracker data |
| Input | User A uploads CV, signs out; User B signs in |
| Expected Output | User B does not see User A data |
| Actual Output | Workspace state is scoped by Firebase UID |
| Verdict | ✅ Pass |

---

## 9. Submission Checklist

### 9.1 Required Deliverables

- [ ] **Stack Report & Justification** — upload `docs/STACK_REPORT.md` as PDF or inside the submission zip to Google Drive.
- [ ] **Dependencies & Documentation** — upload `README.md`, `docs/DEPENDENCIES.md`, `docs/architecture.md`, `docs/SECURITY.md`, and `docs/DEMO_SCRIPT_5_MIN.md`.
- [ ] **GitHub Repository** — make the repository public and submit the public GitHub URL.
- [ ] **Demonstration Video** — record a 5-minute demo, upload to YouTube or Google Drive, set public/unlisted.
- [ ] **Deployment Link** — optional. If unavailable, local + Docker instructions are documented.
- [ ] **Bonus: System Design** — include `docs/system-design.md`.
- [ ] **Bonus: Evaluation Suite** — include `docs/evaluation-suite.md`.
- [ ] **Bonus: Deployment Guide** — include `docs/DEPLOYMENT.md`.

### 9.2 Before Uploading

- [ ] Make every Google Drive link: **"Anyone with the link can view."**
- [ ] Do **not** upload `.env`, `.env.local`, API keys, service account JSON, `node_modules`, `venv`, `.next`, or `chroma_db`.
- [ ] Confirm the GitHub repository is public.
- [ ] Run local demo once from a fresh browser session.

### 9.3 Recommended Demo Order

1. Welcome page and login.
2. Upload or show saved CV.
3. Job Hunter search and ranked jobs.
4. Ask AI for selected job.
5. Track job and show deadline/tracker.
6. Show dashboard/profile persistence.
7. End with architecture/security/reliability.

### 9.4 Firestore Setup

1. Firebase Console → Firestore Database.
2. Create database.
3. Choose **Standard edition**.
4. Start in **production mode**.
5. Region: nearest practical region.
6. Add the Firestore rule from Section 6.8.

### 9.5 Packaging

```bash
./scripts/package-submission.sh
```

Upload the generated `CareerPilot-submission.zip` to Google Drive for the documentation link.

---

*CareerPilot Technical Documentation — Generated for submission. All sections reflect the current state of the production-ready codebase.*
