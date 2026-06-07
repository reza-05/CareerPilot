from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator
from app.core.auth import get_request_user_id
from app.core.security import validate_text
from app.services.rag_service import CVVectorEngine
from app.services.llm_service import LLMService

router = APIRouter(prefix="/api", tags=["CV Query Engine"])
vector_engine = CVVectorEngine()
llm = LLMService()

class QueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    history: list = Field(default_factory=list)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        return validate_text(value, "Question", max_length=2000)

@router.post("/query-cv")
async def query_cv(request: QueryRequest, user_id: str = Depends(get_request_user_id)):
    context_chunks = vector_engine.retrieve_cv_context(request.question, num_results=5, user_id=user_id)
    context = "\n\n".join(context_chunks) if context_chunks else "No CV uploaded yet."
    safe_history = []
    for message in request.history[-6:]:
        if isinstance(message, dict):
            role = str(message.get("role", "user"))[:20]
            content = validate_text(str(message.get("content", "")), "History message", max_length=1200)
            safe_history.append(f"{role}: {content}")
    history_str = "\n".join(safe_history)

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
