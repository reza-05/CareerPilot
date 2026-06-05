import os
import re
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from app.services.rag_service import CVVectorEngine

router = APIRouter(prefix="/api", tags=["CV Ingestion"])
vector_engine = CVVectorEngine()
UPLOAD_DIR = "./storage/temp_cvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def sanitize_user_id(user_id: str) -> str:
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", user_id or "anonymous_user")
    return safe_id[:120] or "anonymous_user"

class ManualFormPayload(BaseModel):
    userId: str
    text_chunk: str
    type: str

@router.post("/cv-upload")
async def handle_cv_upload(file: UploadFile = File(...), userId: str = Form("anonymous_user"), type: str = Form("resume_parsed")):
    allowed_extensions = {".pdf", ".docx", ".doc", ".txt"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    safe_user_id = sanitize_user_id(userId)
    safe_filename = f"{safe_user_id}_{os.path.basename(file.filename)}"
    save_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        chunk_count = vector_engine.ingest_cv(save_path, safe_filename, user_id=safe_user_id)
        full_text = vector_engine.get_full_cv_text(user_id=safe_user_id)
        skills = vector_engine.extract_skills(full_text)
        return {"success": True, "chunks_processed": chunk_count, "skills": skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cv-manual")
async def manual_cv_ingest(payload: ManualFormPayload):
    if not payload.text_chunk.strip():
        raise HTTPException(status_code=400, detail="Manual CV text is empty.")

    safe_user_id = sanitize_user_id(payload.userId)
    safe_filename = f"{safe_user_id}_{payload.type}.txt"
    save_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(payload.text_chunk)
        chunk_count = vector_engine.ingest_cv(save_path, safe_filename, user_id=safe_user_id)
        skills = vector_engine.extract_skills(payload.text_chunk)
        return {"success": True, "chunks_processed": chunk_count, "skills": skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
