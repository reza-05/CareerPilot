from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from google import genai

# 1. Securely load configuration for BOTH keys
class Settings(BaseSettings):
    google_api_key: str
    tavily_api_key: str
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        extra="ignore" # This allows extra keys without crashing
    )

# 2. Initialize settings and client
settings = Settings()
client = genai.Client(api_key=settings.google_api_key)

router = APIRouter(prefix="/api", tags=["Job Hunter"])

# Temporary memory storage
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
        # Using the stable model
        response = client.models.generate_content(
            model='gemini-3.5-flash', 
            contents=f"CV Content: {cv_context['text']}\n\nQuestion: {request.query}"
        )
        return {"answer": response.text}
    except Exception as e:
        print(f"--- Backend Error: {e} ---")
        return {"answer": "AI service error. Check your environment configuration."}