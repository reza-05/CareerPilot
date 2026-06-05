import re
from fastapi import APIRouter, Header
from pydantic import BaseModel
from app.services.rag_service import CVVectorEngine
from app.services.llm_service import LLMService

router = APIRouter(prefix="/api", tags=["CV Query Engine"])
vector_engine = CVVectorEngine()
llm = LLMService()

class QueryRequest(BaseModel):
    question: str
    history: list = []

def sanitize_user_id(user_id: str) -> str:
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", user_id or "anonymous_user")
    return safe_id[:120] or "anonymous_user"

@router.post("/query-cv")
async def query_cv(request: QueryRequest, x_user_id: str = Header("anonymous_user")):
    user_id = sanitize_user_id(x_user_id)
    context_chunks = vector_engine.retrieve_cv_context(request.question, num_results=5, user_id=user_id)
    context = "\n\n".join(context_chunks) if context_chunks else "No CV uploaded yet."
    history_str = "\n".join([f"{m['role']}: {m['content']}" for m in request.history[-6:]])

    prompt = (
        f"You are CareerPilot, an expert AI career co-pilot.\n"
        f"Never invent experience not present in the CV.\n\n"
        f"--- CV CONTEXT ---\n{context}\n\n"
        f"--- HISTORY ---\n{history_str}\n\n"
        f"--- QUESTION ---\n{request.question}"
    )

    try:
        return {"answer": llm.generate_text(prompt, temperature=0.35)}
    except Exception as e:
        print(f"All LLM providers failed during CV query: {e}")
        return {"answer": "The assistant is temporarily unavailable. Please try again in a moment."}
