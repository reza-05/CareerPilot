# CareerPilot

CareerPilot is an agentic career co-pilot for job seekers. It uses the user's CV as the source of truth, searches for relevant jobs, computes fit scores, drafts personalized application content, and tracks applications, goals, and deadlines.

## Core Demo Flow

1. Upload a CV or build a profile manually.
2. CareerPilot extracts the profile and prepares it for retrieval.
3. Search for jobs using natural language.
4. Review job cards with fit scores and CV-grounded explanations.
5. Ask the assistant for skill gaps, readiness, roadmaps, or cover letters.
6. Track jobs into the application board.
7. Manage deadlines, goals, and application progress from the tracker.

## Features

- CV upload and manual profile builder
- CV text extraction, chunking, embeddings, and vector search
- Live job search using an external search tool
- Programmatic fit score against the user's CV
- CV-grounded assistant with session memory
- Cover letter generation from selected jobs
- Application kanban board: Applied, Interviewing, Offer, Rejected
- Deadline calendar, goal setting, dashboard stats, and progress nudges
- Profile-required gates for job search and assistant access
- Responsive web UI for desktop, laptop, tablet, and phone screens

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: FastAPI, Python, SQLite
- AI: Gemini API with Groq backup for text generation
- Search: Tavily API
- RAG: CV parsing, text chunking, embeddings, ChromaDB

## Project Structure

```text
CareerPilot/
  careerpilot-backend/
    main.py
    app/
      api/endpoints/
      services/rag_service.py
    requirements.txt
  careerpilot-frontend/
    src/app/
    src/components/
    package.json
  docs/
    architecture.md
    demo-script.md
    evaluation-suite.md
    system-design.md
```

## Environment Variables

Create `careerpilot-backend/.env`:

```env
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
TAVILY_API_KEY=your_tavily_api_key
```

Create `careerpilot-frontend/.env.local` if frontend-side AI routes are used:

```env
GOOGLE_API_KEY=your_google_api_key
```

## Run Locally

### 1. Backend

```bash
cd careerpilot-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend health check:

```text
http://localhost:8000
```

Expected response:

```json
{ "message": "CareerPilot Backend is running" }
```

### 2. Frontend

Open a second terminal:

```bash
cd careerpilot-frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Important Demo Notes

- Start from a fresh browser session for the clearest demo.
- Upload a CV first or build a manual profile.
- Job Hunter and Assistant intentionally require a prepared profile.
- If Gemini reaches its rate limit, CareerPilot can continue with Groq when `GROQ_API_KEY` is configured.
- Use specific job queries such as `Find me ML internships in Dhaka open this month`.

## Documentation

- [Architecture](docs/architecture.md)
- [Demo Script](docs/demo-script.md)
- [Evaluation Suite](docs/evaluation-suite.md)
- [System Design Notes](docs/system-design.md)

## Build Verification

Frontend production build:

```bash
cd careerpilot-frontend
npm run build
```

## Submission Checklist

- [ ] Public GitHub repository
- [ ] Backend and frontend run from source
- [ ] Required environment variables documented
- [ ] Architecture diagram included
- [ ] 5-minute demo video recorded
- [ ] Evaluation suite included
- [ ] Optional deployment URL added if available

**Team CLI** — Codesprint '26'

| Name | GitHub | Email |
|------|--------|-------|
| Md. Shifat Reza | @reza-05 | shifatreza5@gmail.com |
| Muntakim Fuad Mahi | @sugar6169 | muntakimfm@gmail.com |
