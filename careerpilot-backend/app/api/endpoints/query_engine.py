from fastapi import APIRouter
from pydantic import BaseModel
from app.services.rag_service import CVVectorEngine
import google.generativeai as genai
import os

router = APIRouter(prefix="/api", tags=["CV Query Engine"])
vector_engine = CVVectorEngine()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class QueryRequest(BaseModel):
    question: str
    history: list = [] 

@router.post("/query-cv")
async def query_cv(request: QueryRequest):
    # 1. Retrieve relevant info from your CV
    context = "\n\n".join(vector_engine.retrieve_cv_context(request.question))
    
    # 2. Build history string so the AI remembers past turns
    history_str = "\n".join([f"{m['role']}: {m['content']}" for m in request.history])
    
    # 3. Ask Gemini with context
    prompt = f"CV Info: {context}\n\nHistory: {history_str}\n\nQuestion: {request.question}"
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(prompt)
    
    return {"answer": response.text}