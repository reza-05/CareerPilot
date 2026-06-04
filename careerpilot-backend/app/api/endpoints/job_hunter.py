from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from google import genai
from google.genai import types
from tavily import TavilyClient
from sqlalchemy import Column, Integer, String, create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import Optional
from app.services.rag_service import CVVectorEngine
import shutil, os, json, re

class Settings(BaseSettings):
    google_api_key: str
    tavily_api_key: str
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
client = genai.Client(api_key=settings.google_api_key)
tavily = TavilyClient(api_key=settings.tavily_api_key)
router = APIRouter(tags=["Job Hunter"])
vector_engine = CVVectorEngine()

UPLOAD_DIR = "./storage/temp_cvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class JobRequest(BaseModel):
    query: str
    history: list = []

STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "you", "your", "are",
    "will", "have", "has", "job", "role", "work", "team", "about", "apply",
    "internship", "software", "engineer", "engineering", "developer"
}

def extract_keywords(text: str, limit: int = 8) -> list[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.]{2,}", text.lower())
    seen = []
    for token in tokens:
        if token not in STOPWORDS and token not in seen:
            seen.append(token)
    return seen[:limit]

def build_local_match_reason(job_description: str, cv_context: str, fit_percent: int) -> str:
    if not cv_context or cv_context == "No CV data available.":
        return f"This role has a {fit_percent}% programmatic match, but the CV context is limited; upload a richer CV for stronger reasoning."

    job_keywords = set(extract_keywords(job_description, limit=40))
    cv_keywords = extract_keywords(cv_context, limit=40)
    overlaps = [word for word in cv_keywords if word in job_keywords][:6]

    if overlaps:
        return (
            f"This role scores {fit_percent}% because the job description overlaps with CV evidence around "
            f"{', '.join(overlaps)}."
        )
    return (
        f"This role scores {fit_percent}% based on semantic similarity between the job description and the uploaded CV sections."
    )

def extract_job_metadata(job_description: str, query: str) -> dict:
    text = job_description or ""
    salary_match = re.search(
        r"((?:৳|tk\.?|bdt|\$)\s?\d[\d,]*(?:\s?[-–]\s?(?:৳|tk\.?|bdt|\$)?\s?\d[\d,]*)?(?:\s?(?:per month|monthly|/month|k|lakh))?)",
        text,
        flags=re.IGNORECASE,
    )
    deadline_match = re.search(
        r"((?:deadline|apply by|last date)[:\s-]*[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|(?:deadline|apply by|last date)[:\s-]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
        text,
        flags=re.IGNORECASE,
    )

    known_locations = [
        "Dhaka", "Bangladesh", "Remote", "Hybrid", "On-Site", "Mirpur", "Uttara",
        "Gulshan", "Banani", "Dhanmondi", "Chittagong", "Sylhet"
    ]
    found_locations = [location for location in known_locations if re.search(rf"\b{re.escape(location)}\b", text, flags=re.IGNORECASE)]
    if not found_locations and "dhaka" in query.lower():
        found_locations = ["Dhaka"]

    return {
        "salaryRange": salary_match.group(1).strip() if salary_match else "Not Specified",
        "applicationDeadline": deadline_match.group(1).strip() if deadline_match else "Open until filled",
        "location": ", ".join(dict.fromkeys(found_locations[:3])) if found_locations else "Not Specified",
    }

def normalize_deadline_date(deadline_text: str) -> Optional[str]:
    if not deadline_text:
        return None

    cleaned = re.sub(
        r"(?i)\b(deadline|apply by|last date)\b[:\s-]*",
        "",
        deadline_text,
    ).strip()
    if not cleaned or re.search(r"(?i)open until filled|not specified|n/a", cleaned):
        return None

    current_year = datetime.utcnow().year
    date_patterns = [
        "%B %d, %Y", "%b %d, %Y", "%B %d %Y", "%b %d %Y",
        "%d %B %Y", "%d %b %Y", "%d/%m/%Y", "%d-%m-%Y",
        "%Y-%m-%d", "%m/%d/%Y", "%m-%d-%Y",
    ]

    for pattern in date_patterns:
        try:
            return datetime.strptime(cleaned, pattern).strftime("%Y-%m-%d")
        except ValueError:
            continue

    for pattern in ["%B %d", "%b %d", "%d %B", "%d %b"]:
        try:
            parsed = datetime.strptime(cleaned, pattern)
            return parsed.replace(year=current_year).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None

@router.post("/api/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    allowed_extensions = {".pdf", ".docx", ".txt"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    save_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        chunk_count = vector_engine.ingest_cv(save_path, file.filename)
        return {
            "status": "success",
            "filename": file.filename,
            "chunks_indexed": chunk_count,
            "message": f"CV indexed into {chunk_count} chunks."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/search-jobs")
async def search_jobs(request: JobRequest):
    try:
        results = tavily.search(query=request.query, search_depth="advanced")
        formatted = []

        for item in results.get("results", []):
            job_description = item.get("content", "")
            job_title = item.get("title", "")

            fit_data = vector_engine.compute_fit_score(job_description)
            fit_score = fit_data["score"]
            fit_percent = fit_data["percent"]

            relevant_cv_chunks = vector_engine.retrieve_cv_context(job_description, num_results=3)
            cv_context_str = "\n".join(relevant_cv_chunks) if relevant_cv_chunks else "No CV data available."

            explanation_prompt = (
                f"Job Title: {job_title}\n\n"
                f"Job Description:\n{job_description[:800]}\n\n"
                f"Relevant CV sections:\n{cv_context_str}\n\n"
                f"Fit score: {fit_percent}%.\n\n"
                f"Write ONE sentence explaining why this fit score makes sense, referencing the candidate's actual CV experience."
            )

            salary_location_prompt = (
                f"From this job posting extract:\n{job_description[:1000]}\n\n"
                f"Return JSON with keys: salaryRange, applicationDeadline, location. "
                f"Use 'Not Specified' / 'Open until filled' as fallbacks. Return ONLY valid JSON."
            )

            match_reason = "Alignment based on CV profile."
            salary_range = "Not Specified"
            deadline = "Open until filled"
            location = "Not Specified"

            try:
                exp_resp = client.models.generate_content(
                    model="gemini-2.0-flash", contents=explanation_prompt
                )
                match_reason = exp_resp.text.strip()

                meta_resp = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=salary_location_prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json", temperature=0.1)
                )
                meta = json.loads(meta_resp.text.strip())
                salary_range = meta.get("salaryRange", "Not Specified")
                deadline = meta.get("applicationDeadline", "Open until filled")
                location = meta.get("location", "Not Specified")

            except Exception as ai_err:
                if "429" in str(ai_err) or "RESOURCE_EXHAUSTED" in str(ai_err):
                    fallback_meta = extract_job_metadata(job_description, request.query)
                    match_reason = (
                        f"Programmatic fit score computed from CV/job similarity: {fit_percent}%. "
                        "AI explanation is unavailable because the provider quota is exhausted."
                    )
                    salary_range = fallback_meta["salaryRange"]
                    deadline = fallback_meta["applicationDeadline"]
                    location = fallback_meta["location"]

            item["matchScore"] = round(fit_score, 4)
            item["matchPercent"] = fit_percent
            item["matchReason"] = match_reason
            item["salaryRange"] = salary_range
            item["applicationDeadline"] = deadline
            item["deadlineDate"] = normalize_deadline_date(deadline)
            item["location"] = location
            formatted.append(item)

        return {"results": formatted}
    except Exception as e:
        return {"results": [], "error": str(e)}

@router.post("/api/query-cv")
async def query_cv(request: JobRequest):
    try:
        relevant_chunks = vector_engine.retrieve_cv_context(request.query, num_results=5)
        cv_context = "\n\n".join(relevant_chunks) if relevant_chunks else "No CV uploaded yet."
        history_str = "\n".join([
            f"{message.get('role', 'user')}: {message.get('content', '')}"
            for message in request.history[-6:]
            if isinstance(message, dict)
        ])
        prompt = (
            f"You are CareerPilot, an expert AI career co-pilot. "
            f"Use ONLY the candidate's actual CV below — never hallucinate.\n\n"
            f"--- CV CONTEXT ---\n{cv_context}\n\n"
            f"--- RECENT CHAT HISTORY ---\n{history_str}\n\n"
            f"--- QUESTION ---\n{request.query}"
        )
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return {"answer": response.text.strip()}
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            return {"answer": "Rate limit hit — wait ~10 seconds and retry."}
        return {"answer": f"Error: {err}"}

# --- TRACKER ---
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
    application_deadline = Column(String, nullable=True)
    deadline_date = Column(String, nullable=True)
    source_url = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

def ensure_tracker_columns():
    inspector = inspect(engine)
    existing_columns = {column["name"] for column in inspector.get_columns("job_tracker")}
    columns_to_add = {
        "application_deadline": "VARCHAR",
        "deadline_date": "VARCHAR",
        "source_url": "VARCHAR",
    }
    with engine.begin() as connection:
        for column_name, column_type in columns_to_add.items():
            if column_name not in existing_columns:
                connection.exec_driver_sql(
                    f"ALTER TABLE job_tracker ADD COLUMN {column_name} {column_type}"
                )

ensure_tracker_columns()

class TrackerCreate(BaseModel):
    role: str
    company: str
    application_deadline: Optional[str] = None
    deadline_date: Optional[str] = None
    source_url: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/api/tracker")
def add_tracked_job(job: TrackerCreate, db: Session = Depends(get_db)):
    db_entry = JobTracker(
        role=job.role,
        company=job.company,
        status="Applied",
        application_deadline=job.application_deadline,
        deadline_date=job.deadline_date or normalize_deadline_date(job.application_deadline or ""),
        source_url=job.source_url,
    )
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

@router.delete("/api/tracker/{id}")
def delete_tracked_job(id: int, db: Session = Depends(get_db)):
    db_job = db.query(JobTracker).filter(JobTracker.id == id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_job)
    db.commit()
    return {"status": "success"}

@router.get("/api/tracker/ai-nudge")
def fetch_ai_nudge(db: Session = Depends(get_db)):
    try:
        count = db.query(JobTracker).filter(JobTracker.status == "Applied").count()
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"User has {count} active applications. Give a sharp 1-sentence career motivation nudge."
        )
        return {"nudge": response.text.strip()}
    except Exception:
        return {"nudge": "Keep pushing — consistency compounds."}
