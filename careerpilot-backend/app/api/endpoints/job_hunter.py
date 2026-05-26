from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from google import genai
from tavily import TavilyClient  # 1. Import Tavily

# 1. Securely load configuration
class Settings(BaseSettings):
    google_api_key: str
    tavily_api_key: str
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="ignore"
    )

settings = Settings()
client = genai.Client(api_key=settings.google_api_key)
tavily = TavilyClient(api_key=settings.tavily_api_key) # 2. Initialize Tavily

router = APIRouter(prefix="/api", tags=["Job Hunter"])

cv_context = {"text": ""}

class JobRequest(BaseModel):
    query: str

@router.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    content = await file.read()
    cv_context["text"] = content.decode('utf-8', errors='ignore')
    return {"status": "success", "filename": file.filename}

@router.post("/query-cv")
async def query_cv(request: JobRequest):
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash', 
            contents=f"CV Content: {cv_context['text']}\n\nQuestion: {request.query}"
        )
        return {"answer": response.text}
    except Exception as e:
        print(f"--- Backend Error: {e} ---")
        return {"answer": "AI service error."}

# 3. Add the Search Route
@router.post("/search-jobs")
async def search_jobs(request: JobRequest):
    try:
        # Search using Tavily
        search_result = tavily.search(query=request.query, search_depth="advanced")
        # Ensure 'results' is returned to match your frontend expectation
        return {"results": search_result.get("results", [])}
    except Exception as e:
        print(f"--- Search Error: {e} ---")
        return {"results": []}