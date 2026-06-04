from fastapi import APIRouter
from pydantic import BaseModel
from app.services.rag_service import CVVectorEngine
from google import genai
import os

router = APIRouter(prefix="/api", tags=["CV Query Engine"])
vector_engine = CVVectorEngine()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

class QueryRequest(BaseModel):
    question: str
    history: list = []

@router.post("/query-cv")
async def query_cv(request: QueryRequest):
    context_chunks = vector_engine.retrieve_cv_context(request.question, num_results=5)
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
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return {"answer": response.text.strip()}
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            return {"answer": "Rate limit hit — wait ~10 seconds and retry."}
        return {"answer": f"Error: {err}"}