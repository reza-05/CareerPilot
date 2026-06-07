# Stack Report and Justification

## Project Summary

CareerPilot is an AI-powered career workspace for job seekers. It uses the user's CV as the foundation for job discovery, match scoring, assistant guidance, cover-letter drafting, application tracking, deadlines, goals, and progress analytics.

The project is intentionally full-stack: it combines a polished SaaS frontend, secure authentication, CV retrieval, external job search, multi-provider AI generation, and a productivity tracker.

## Technology Choices

### Next.js, React, TypeScript

Next.js provides fast routing, production builds, API proxying, and a strong developer experience for a modern web app. React enables reusable UI components for the CV workspace, job cards, tracker board, and AI chat. TypeScript reduces runtime mistakes by validating data shape across the frontend.

Why it fits:

- Strong for hackathon demos and real products.
- Easy deployment to Vercel or Docker.
- Good separation between pages, components, and shared libraries.

### Tailwind CSS and Lucide Icons

Tailwind allows consistent spacing, color, responsive behavior, and fast UI iteration. Lucide icons keep the interface clean and professional without custom icon complexity.

Why it fits:

- Maintains the blue/white SaaS design system.
- Supports responsive layouts across laptop, desktop, tablet, and phone.
- Enables micro-interactions without heavy animation.

### Firebase Authentication and Firestore

Firebase Auth gives reliable Google sign-in and email/password authentication. Firestore stores user-scoped profile data, CV metadata, avatar, and workspace state.

Why it fits:

- Fast, production-grade authentication.
- User-specific data isolation through security rules.
- Avoids building custom auth under hackathon time pressure.

### FastAPI and Python

FastAPI powers the CV processing, job enrichment, tracker APIs, and AI orchestration. Python is a natural fit for document parsing, vector retrieval, and AI workflows.

Why it fits:

- High performance and simple API definitions.
- Strong ecosystem for AI, parsing, and backend validation.
- Easy local development with Uvicorn.

### SQLAlchemy and SQLite

SQLAlchemy avoids unsafe raw SQL and provides structured database access. SQLite is lightweight and appropriate for hackathon-scale tracker persistence.

Why it fits:

- Fast to run locally.
- No external database required for demo.
- Can migrate to Postgres later without changing the whole backend architecture.

### ChromaDB

ChromaDB stores CV chunks and supports retrieval for CV-grounded job matching and assistant responses.

Why it fits:

- Local vector search without additional cloud setup.
- Useful for explainable, CV-aware recommendations.
- Keeps the assistant grounded in the user's own profile.

### Gemini and Groq

Gemini is the primary reasoning model for fit explanations and career guidance. Groq is used as fallback when Gemini is rate-limited or unavailable.

Why it fits:

- Multi-provider resilience improves demo reliability.
- Avoids hardcoded AI responses.
- Keeps responses dynamic and contextual.

### Tavily

Tavily provides web search for job discovery.

Why it fits:

- Enables real job search instead of static mock listings.
- Works well with natural-language search queries.
- Keeps CareerPilot useful across different candidate backgrounds.

## Why This Stack Is Suitable

CareerPilot needs four things at once: a polished product UI, authenticated user isolation, AI reasoning, and real job discovery. This stack balances speed, credibility, and extensibility. It is simple enough to demo reliably, but structured enough to become a production product.

## Known Production Upgrade Path

- Replace SQLite with Postgres.
- Move ChromaDB to a managed vector database.
- Store uploaded CV files in Firebase Storage or S3.
- Set `REQUIRE_FIREBASE_AUTH=true` for backend endpoints.
- Add observability, rate limiting, and queue-based AI jobs.
- Deploy frontend and backend separately with HTTPS.
