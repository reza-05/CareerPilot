from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from tavily import TavilyClient
from sqlalchemy import Column, Integer, String, create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from typing import Optional
from app.core.auth import get_request_user_id
from app.core.security import (
    generic_server_error,
    safe_public_text,
    sanitize_filename,
    sanitize_user_id,
    validate_text,
    validate_upload_file,
)
from app.services.llm_service import LLMService, LLMUnavailableError
from app.services.rag_service import CVVectorEngine
import os, re

class Settings(BaseSettings):
    google_api_key: str
    tavily_api_key: str
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
tavily = TavilyClient(api_key=settings.tavily_api_key)
router = APIRouter(tags=["Job Hunter"])
vector_engine = CVVectorEngine()
llm = LLMService()

UPLOAD_DIR = "./storage/temp_cvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class JobRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    history: list = Field(default_factory=list)

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        return validate_text(value, "Query", max_length=2000)

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

def build_local_match_reason(job_description: str, cv_context: str, fit_percent: int, fit_data: Optional[dict] = None) -> str:
    if not cv_context or cv_context == "No CV data available.":
        return f"This role has a {fit_percent}% profile match, but the CV context is limited; upload a richer CV for stronger reasoning."

    job_keywords = set(extract_keywords(job_description, limit=40))
    cv_keywords = extract_keywords(cv_context, limit=40)
    overlaps = [word for word in cv_keywords if word in job_keywords][:6]
    components = (fit_data or {}).get("components", {})
    detected_skills = (fit_data or {}).get("detected_cv_skills", [])[:5]

    if detected_skills and components.get("skills", 0) >= 0.55:
        skills_text = ", ".join(detected_skills[:4])
        return (
            f"This role scores {fit_percent}% because your CV shows relevant strengths such as {skills_text}, "
            f"with solid alignment to the role requirements."
        )

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
async def upload_cv(file: UploadFile = File(...), user_id: str = Depends(get_request_user_id)):
    allowed_extensions = {".pdf", ".docx", ".txt"}
    safe_original_name, content = await validate_upload_file(file, allowed_extensions)
    safe_filename = f"{user_id}_{safe_original_name}"
    save_path = os.path.join(UPLOAD_DIR, safe_filename)
    try:
        with open(save_path, "wb") as buffer:
            buffer.write(content)
        chunk_count = vector_engine.ingest_cv(save_path, safe_filename, user_id=user_id)
        return {
            "status": "success",
            "filename": safe_public_text(safe_filename, 180),
            "chunks_indexed": chunk_count,
            "message": "Your CV is ready."
        }
    except Exception:
        raise generic_server_error()

@router.post("/api/search-jobs")
async def search_jobs(request: JobRequest, user_id: str = Depends(get_request_user_id)):
    try:
        results = tavily.search(query=request.query, search_depth="advanced", max_results=18)
        formatted = []

        for item in results.get("results", []):
            job_description = item.get("content", "")
            job_title = item.get("title", "")
            scoring_text = f"{job_title}\n\n{job_description}"

            fit_data = vector_engine.compute_fit_score(scoring_text, user_id=user_id)
            fit_score = fit_data["score"]
            fit_percent = fit_data["percent"]

            relevant_cv_chunks = vector_engine.retrieve_cv_context(scoring_text, num_results=3, user_id=user_id)
            cv_context_str = "\n".join(relevant_cv_chunks) if relevant_cv_chunks else "No CV data available."

            fallback_meta = extract_job_metadata(job_description, request.query)
            match_reason = build_local_match_reason(job_description, cv_context_str, fit_percent, fit_data)
            salary_range = fallback_meta["salaryRange"]
            deadline = fallback_meta["applicationDeadline"]
            location = fallback_meta["location"]

            if len(formatted) < 5 and fit_percent >= 25:
                explanation_prompt = (
                    f"Job Title: {job_title}\n\n"
                    f"Job Description:\n{job_description[:700]}\n\n"
                    f"Relevant CV sections:\n{cv_context_str[:900]}\n\n"
                    f"Fit score: {fit_percent}%.\n"
                    f"Score signals: {fit_data.get('components', {})}.\n\n"
                    f"Write ONE concise sentence explaining why this fit score makes sense. "
                    f"Reference only evidence visible in the CV context. Avoid backend or scoring terms."
                )

                try:
                    match_reason = llm.generate_text(explanation_prompt, temperature=0.2)
                except LLMUnavailableError as ai_err:
                    print(f"AI explanation skipped for job enrichment: {ai_err}")

            item["matchScore"] = round(fit_score, 4)
            item["matchPercent"] = fit_percent
            item["matchReason"] = match_reason
            item["salaryRange"] = salary_range
            item["applicationDeadline"] = deadline
            item["deadlineDate"] = normalize_deadline_date(deadline)
            item["location"] = location
            formatted.append(item)

        formatted.sort(key=lambda job: job.get("matchPercent", 0), reverse=True)
        return {"results": formatted}
    except Exception as e:
        print(f"Job search failed: {e}")
        return {
            "results": [],
            "error": "Job search is temporarily unavailable. Please check your connection and try again.",
        }

@router.post("/api/query-cv")
async def query_cv(request: JobRequest, user_id: str = Depends(get_request_user_id)):
    try:
        relevant_chunks = vector_engine.retrieve_cv_context(request.query, num_results=5, user_id=user_id)
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
        answer = llm.generate_text(prompt, temperature=0.35)
        return {"answer": answer}
    except Exception as e:
        print(f"All LLM providers failed during assistant query: {e}")
        return {"answer": "The assistant is temporarily unavailable. Please try again in a moment."}

# --- TRACKER ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./careerpilot.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class JobTracker(Base):
    __tablename__ = "job_tracker"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True, default="anonymous_user")
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
        "user_id": "VARCHAR",
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
    role: str = Field(min_length=1, max_length=180)
    company: str = Field(min_length=1, max_length=180)
    application_deadline: Optional[str] = Field(default=None, max_length=120)
    deadline_date: Optional[str] = Field(default=None, max_length=20)
    source_url: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("role", "company")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        return validate_text(value, "Job field", max_length=180)

    @field_validator("application_deadline", "deadline_date", "source_url")
    @classmethod
    def validate_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return safe_public_text(value, 1000)

class StatusUpdate(BaseModel):
    status: Optional[str] = Field(default=None, max_length=40)
    application_deadline: Optional[str] = Field(default=None, max_length=120)
    deadline_date: Optional[str] = Field(default=None, max_length=20)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        allowed = {"Applied", "Interviewing", "Offer", "Rejected"}
        if value not in allowed:
            raise ValueError("Unsupported tracker status.")
        return value

    @field_validator("application_deadline", "deadline_date")
    @classmethod
    def validate_deadline_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return safe_public_text(value, 120)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/api/tracker")
def add_tracked_job(job: TrackerCreate, db: Session = Depends(get_db), user_id: str = Depends(get_request_user_id)):
    db_entry = JobTracker(
        user_id=user_id,
        role=safe_public_text(job.role, 180),
        company=safe_public_text(job.company, 180),
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
def list_tracked_jobs(db: Session = Depends(get_db), user_id: str = Depends(get_request_user_id)):
    return db.query(JobTracker).filter(JobTracker.user_id == user_id).all()

@router.put("/api/tracker/{id}")
def update_job_status(id: int, payload: StatusUpdate, db: Session = Depends(get_db), user_id: str = Depends(get_request_user_id)):
    db_job = db.query(JobTracker).filter(JobTracker.id == id, JobTracker.user_id == user_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Entry not found")

    if payload.status:
        db_job.status = payload.status
    if payload.application_deadline is not None:
        db_job.application_deadline = payload.application_deadline
    if payload.deadline_date is not None:
        db_job.deadline_date = payload.deadline_date or normalize_deadline_date(payload.application_deadline or "")

    db.commit()
    db.refresh(db_job)
    return db_job

@router.delete("/api/tracker/{id}")
def delete_tracked_job(id: int, db: Session = Depends(get_db), user_id: str = Depends(get_request_user_id)):
    db_job = db.query(JobTracker).filter(JobTracker.id == id, JobTracker.user_id == user_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(db_job)
    db.commit()
    return {"status": "success"}

@router.get("/api/tracker/ai-nudge")
def fetch_ai_nudge(db: Session = Depends(get_db), user_id: str = Depends(get_request_user_id)):
    try:
        count = db.query(JobTracker).filter(JobTracker.user_id == user_id, JobTracker.status == "Applied").count()
        nudge = llm.generate_text(
            f"User has {count} active applications. Give a sharp 1-sentence career motivation nudge.",
            temperature=0.45,
        )
        return {"nudge": nudge}
    except Exception as exc:
        print(f"All LLM providers failed during tracker nudge: {exc}")
        return {"nudge": "Progress insight is temporarily unavailable."}
