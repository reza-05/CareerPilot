# Dependencies and Documentation

## Runtime Requirements

- Node.js 22 or newer recommended
- Python 3.11 recommended
- Firebase project with Authentication and Firestore enabled
- API keys for Gemini, Groq, and Tavily

Python 3.9 may run locally, but it is past end-of-life warnings in some Google packages. Python 3.11 is recommended for the final demo/deployment.

## Frontend Dependencies

| Package | Purpose |
| --- | --- |
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
| `@google/generative-ai`, `chromadb` | AI/vector client support where needed |

Install:

```bash
cd careerpilot-frontend
npm install
```

Verify:

```bash
npm run lint
npm exec tsc -- --noEmit --incremental false
npm run build
```

## Backend Dependencies

| Package | Purpose |
| --- | --- |
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
| `groq`/`requests` | Groq fallback calls |
| `tavily-python` | Job search |
| `numpy` | Similarity calculations |
| `firebase-admin` | Optional backend Firebase token verification |

Install:

```bash
cd careerpilot-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Verify:

```bash
python3 -m compileall app main.py
```

## Environment Files

Frontend:

```bash
cp careerpilot-frontend/.env.example careerpilot-frontend/.env.local
```

Backend:

```bash
cp careerpilot-backend/.env.example careerpilot-backend/.env
```

Never commit real API keys or service account JSON.

## Docker Commands

```bash
docker compose up --build
docker compose down
```

Use Docker when the app is ready for submission or demo replay. It makes the run environment more consistent across machines.
