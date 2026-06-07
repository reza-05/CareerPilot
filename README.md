# CareerPilot

CareerPilot is an AI-powered career workspace that turns a user's CV into the source of truth for job discovery, fit analysis, assistant guidance, cover-letter drafting, application tracking, goals, deadlines, and progress insights.

The goal is simple: reduce blind job searching and help candidates make better application decisions with personalized, CV-grounded signals.

## Core Value

- Upload or build a CV once, then reuse that profile across the whole app.
- Search jobs in natural language and receive fit-ranked results.
- Understand every match score through CV-aware explanations.
- Ask the assistant about a selected role, skill gaps, application strategy, or next steps.
- Track applications, deadlines, goals, and weekly progress from one workspace.

## Main Features

- Firebase authentication with Google sign-in and email/password accounts
- Per-user profile, CV data, tracker data, and dashboard state
- CV upload, saved CV metadata, and manual CV builder
- CV parsing, chunking, embeddings, and local vector retrieval
- Job Hunter with external search, fit scoring, sorting, and AI explanations
- Selected-job AI chat with job context and saved CV context
- Draft cover-letter action for selected jobs
- Application tracker with Applied, Interviewing, Offer, and Rejected states
- Deadline calendar, goal setting, progress analytics, and AI nudges
- Dark/light mode, responsive SaaS UI, and profile photo support
- Gemini-first AI generation with Groq fallback for resilience
- Security hardening: input validation, file validation, generic errors, security headers, and optional Firebase ID-token verification on the backend

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| UI | Lucide icons, custom responsive components, next-themes |
| Auth & user state | Firebase Authentication, Firestore |
| Backend | FastAPI, Python, Pydantic, SQLAlchemy |
| Storage | SQLite for tracker data, ChromaDB for CV vector retrieval, Firestore for user-scoped frontend profile state |
| AI | Google Gemini primary, Groq fallback |
| Search | Tavily API |
| Parsing | pypdf, python-docx |

## Project Structure

```text
CareerPilot/
  careerpilot-backend/
    app/
      api/endpoints/       FastAPI routes
      core/                settings, auth, security helpers
      services/            RAG, LLM, tracker, job logic
    main.py
    requirements.txt
    Dockerfile

  careerpilot-frontend/
    src/app/               Next.js pages and API routes
    src/components/        App shell, auth, chat, CV, job components
    src/lib/               Auth headers, profile data, helpers
    package.json
    Dockerfile

  docs/
    architecture.md
    STACK_REPORT.md
    DEPENDENCIES.md
    SECURITY.md
    DEMO_SCRIPT_5_MIN.md
    SUBMISSION_CHECKLIST.md

  scripts/
    package-submission.sh
```

## Local Setup

### Backend

```bash
cd careerpilot-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd careerpilot-frontend
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Backend `.env`:

```env
GOOGLE_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=llama-3.1-8b-instant
TAVILY_API_KEY=your_tavily_key
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
REQUIRE_FIREBASE_AUTH=false
FIREBASE_SERVICE_ACCOUNT_JSON=
GEMINI_BUDGET_SECONDS=6
GROQ_TIMEOUT_SECONDS=8
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
BACKEND_SERVICE_URL=http://127.0.0.1:8000
```

For production, set `REQUIRE_FIREBASE_AUTH=true` and provide Firebase Admin credentials through `FIREBASE_SERVICE_ACCOUNT_JSON`.

## Docker

From the project root:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:3000
```

Docker is best added after the local demo is stable, because it freezes the final run environment and makes setup easier for reviewers.

## Firebase Firestore Rules

Use authenticated, user-scoped rules:

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

## Verification

```bash
cd careerpilot-frontend
npm run lint
npm exec tsc -- --noEmit --incremental false

cd ../careerpilot-backend
python3 -m compileall app main.py
```

## Submission Materials

The docs folder contains ready-to-upload files:

- `docs/STACK_REPORT.md`
- `docs/DEPENDENCIES.md`
- `docs/architecture.md`
- `docs/SECURITY.md`
- `docs/DEMO_SCRIPT_5_MIN.md`
- `docs/SUBMISSION_CHECKLIST.md`

Run this to package them:

```bash
./scripts/package-submission.sh
```

Upload the generated zip to Google Drive and set sharing to "Anyone with the link can view."
