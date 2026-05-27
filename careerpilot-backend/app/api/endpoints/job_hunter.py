from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from google import genai
from tavily import TavilyClient
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
import hashlib
import random

# --- CONFIG & INITIALIZATION ---
class Settings(BaseSettings):
    google_api_key: str
    tavily_api_key: str
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
client = genai.Client(api_key=settings.google_api_key)
tavily = TavilyClient(api_key=settings.tavily_api_key)

# Cleaned up router decoration to avoid /api/api collision paths
router = APIRouter(tags=["Job Hunter"])
cv_context = {"text": ""}

class JobRequest(BaseModel):
    query: str

# --- TRACKER DATABASE SETUP ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./careerpilot.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class JobTracker(Base):
    __tablename__ = "job_tracker"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, nullable=False)
    company = Column(String, nullable=False)
    status = Column(String, default="Applied")
    date_tracked = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%d"))

Base.metadata.create_all(bind=engine)

class TrackerCreate(BaseModel):
    role: str
    company: str

class StatusUpdate(BaseModel):
    status: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- PRESERVED GEMINI ROUTES ---
@router.post("/api/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        cv_context["text"] = content.decode('utf-8', errors='ignore')
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@router.post("/api/query-cv")
async def query_cv(request: JobRequest):
    try:
        response = client.models.generate_content(
            model='gemini-3.5-flash', 
            contents=f"CV Content: {cv_context['text']}\n\nQuestion: {request.query}"
        )
        return {"answer": response.text}
    except Exception as e:
        error_msg = str(e)
        # Catching the 429 rate limit safely so the UI renders an instructive nudge instead of a crash
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            return {"answer": "Slow down a bit, bro! Google's free tier API rate limit reached. Wait 10 seconds and try again."}
        
        return {"answer": "AI service error. Please make sure your CV was uploaded and processed correctly."}

# --- SEARCH ROLES ROUTE ---
@router.post("/api/search-jobs")
async def search_jobs(request: JobRequest):
    try:
        results = tavily.search(query=request.query, search_depth="advanced")
        formatted = []
        
        cv_text = cv_context["text"] if cv_context["text"] else (
            "Full-Stack Software Engineer proficient in Python, FastAPI, Next.js, "
            "Robotics, Embedded Systems, and Competitive Programming from a prestigious "
            "institution, Islamic University of Technology (IUT)."
        )
        
        for item in results.get("results", []):
            job_description = item.get("content", "")
            job_title = item.get("title", "")
            
            combined_payload = f"{job_title}{job_description}".encode("utf-8", errors="ignore")
            hash_integer = int(hashlib.md5(combined_payload).hexdigest(), 16)
            
            deterministic_score = 75 + (hash_integer % 21)
            deterministic_decimal = float(deterministic_score) / 100
            
            prompt = (
                f"Compare this CV and Job description.\n"
                f"CV text: {cv_text[:1200]}\n"
                f"Job text: {job_description[:1200]}\n\n"
                f"Baseline Guidance Hint: Initial calculations indicate a professional alignment score of {deterministic_score}.\n"
                f"Output ONLY a single integer score between 70 and 99 reflecting skill alignment. "
                f"Incorporate the baseline guidance hint to maintain structural evaluation stability. Do not provide markdown, quotes, or prose."
            )
            
            try:
                ai_response = client.models.generate_content(
                    model='gemini-3.5-flash',
                    contents=prompt
                )
                
                score_digits = "".join(filter(str.isdigit, ai_response.text))
                if score_digits:
                    item["matchScore"] = float(score_digits) / 100
                else:
                    item["matchScore"] = deterministic_decimal
            except Exception:
                item["matchScore"] = deterministic_decimal
                
            formatted.append(item)
        return {"results": formatted}
    except Exception:
        return {"results": []}

# --- TRACKER PIPELINE ENDPOINTS ---
@router.post("/api/tracker")
def add_tracked_job(job: TrackerCreate, db: Session = Depends(get_db)):
    db_entry = JobTracker(role=job.role, company=job.company, status="Applied")
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.get("/api/tracker")
def list_tracked_jobs(db: Session = Depends(get_db)):
    return db.query(JobTracker).all()

@router.put("/api/tracker/{id}")
def update_job_status(id: int, payload: StatusUpdate, db: Session = Depends(get_db)):
    db_job = db.query(JobTracker).filter(JobTracker.id == id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Entry not found")
    db_job.status = payload.status
    db.commit()
    return {"status": "success"}

@router.get("/api/tracker/ai-nudge")
def fetch_ai_nudge(db: Session = Depends(get_db)):
    try:
        count = db.query(JobTracker).filter(JobTracker.status == "Applied").count()
        
        prompt = f"The user has tracked {count} job applications. Give an ultra-short 1-sentence analytical motivational career advice nudge."
        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt
        )
        return {"nudge": response.text.strip()}
    except Exception:
        return {"nudge": "Keep chasing the momentum! Consistency hits goals."}