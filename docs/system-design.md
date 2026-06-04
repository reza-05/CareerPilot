# System Design Notes

## Current MVP Architecture

CareerPilot runs as a Next.js frontend and FastAPI backend. The backend handles CV ingestion, retrieval, job matching, assistant prompts, and tracker APIs. ChromaDB stores semantic CV chunks. SQLite stores application tracker data.

## Scaling to 10,000 Users

The MVP should be changed in these areas before serving many users:

1. User identity and data isolation
   - Add authentication.
   - Store each user's CV chunks separately.
   - Scope tracker data by user ID.

2. Database
   - Replace local SQLite with PostgreSQL.
   - Add tables for users, profiles, applications, goals, and job search history.

3. Vector storage
   - Use a hosted vector database or managed Chroma deployment.
   - Namespace collections by user ID or tenant ID.

4. Background processing
   - Move CV parsing and embedding into a background job queue.
   - Show upload progress and retry failed processing.

5. Job search reliability
   - Cache search results.
   - Add rate limits per user.
   - Normalize job cards into a consistent schema.

6. Observability
   - Log API latency and failure rates.
   - Track AI provider errors and quota usage.
   - Add structured events for upload, search, assistant, and tracker actions.

## Estimated Cost Drivers

Primary cost drivers:

- Embedding generation per CV
- Assistant generation calls
- Job search API calls
- Vector database storage
- Hosting for frontend, backend, and database

For a small student-focused MVP, the largest variable costs are AI generation and live search. Costs can be controlled by caching job results, limiting assistant message length, and reusing CV embeddings instead of recomputing them.

## Key Bottlenecks

| Bottleneck | Risk | Mitigation |
| --- | --- | --- |
| AI provider rate limits | Job explanations or assistant responses may fail | Use provider failover from Gemini to Groq, then return a controlled unavailable message if both fail |
| Single shared vector collection | User data can mix in multi-user mode | Namespace chunks per user |
| Local SQLite | Not suitable for concurrent production traffic | Move to PostgreSQL |
| Live search latency | Job search can feel slow | Cache common searches and show incremental results |
| CV parsing quality | Some PDFs may extract poor text | Support DOCX/manual profile and show parsed preview |

## Security and Privacy Notes

- CVs contain sensitive personal data.
- Production should encrypt uploaded files or avoid storing raw files after parsing.
- API keys must stay in environment variables.
- User-specific tracker and CV data must never be shared across sessions.
