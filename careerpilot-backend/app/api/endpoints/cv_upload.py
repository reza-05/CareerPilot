import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel, Field
from app.core.auth import get_request_user_id
from app.core.security import (
    generic_server_error,
    safe_public_text,
    sanitize_user_id,
    validate_text,
    validate_upload_file,
)
from app.services.rag_service import CVVectorEngine

router = APIRouter(prefix="/api", tags=["CV Ingestion"])
vector_engine = CVVectorEngine()
UPLOAD_DIR = "./storage/temp_cvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ManualFormPayload(BaseModel):
    userId: str = Field(default="anonymous_user", max_length=160)
    text_chunk: str = Field(min_length=1, max_length=60000)
    type: str = Field(default="resume_built", max_length=80)

def get_latest_cv_text_file(user_id: str) -> Optional[str]:
    if not os.path.exists(UPLOAD_DIR):
        return None

    matching_files = [
        filename
        for filename in os.listdir(UPLOAD_DIR)
        if filename.endswith(".txt") and filename.startswith(f"{user_id}_")
    ]

    if not matching_files:
        return None

    return max(
        matching_files,
        key=lambda filename: os.path.getmtime(os.path.join(UPLOAD_DIR, filename)),
    )

def format_saved_filename(user_id: str, stored_filename: str) -> str:
    display_name = stored_filename.removeprefix(f"{user_id}_")
    while display_name.endswith(".txt"):
        display_name = display_name[:-4]
    return display_name or "Saved CV"

@router.get("/cv-status")
async def get_cv_status(userId: str = "anonymous_user", request_user_id: str = Depends(get_request_user_id)):
    safe_user_id = request_user_id if request_user_id != "anonymous_user" else sanitize_user_id(userId)
    latest_file = get_latest_cv_text_file(safe_user_id)

    if not latest_file:
        return {"success": True, "uploaded": False, "fileName": "", "skills": [], "updatedAt": ""}

    file_path = os.path.join(UPLOAD_DIR, latest_file)
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            full_text = f.read()

        return {
            "success": True,
            "uploaded": bool(full_text.strip()),
            "fileName": safe_public_text(format_saved_filename(safe_user_id, latest_file), 180),
            "skills": vector_engine.extract_skills(full_text),
            "updatedAt": str(os.path.getmtime(file_path)),
        }
    except Exception:
        raise generic_server_error()

@router.post("/cv-upload")
async def handle_cv_upload(
    file: UploadFile = File(...),
    userId: str = Form("anonymous_user"),
    type: str = Form("resume_parsed"),
    request_user_id: str = Depends(get_request_user_id),
):
    allowed_extensions = {".pdf", ".docx", ".doc", ".txt"}
    safe_user_id = request_user_id if request_user_id != "anonymous_user" else sanitize_user_id(userId)
    safe_original_name, content = await validate_upload_file(file, allowed_extensions)
    safe_filename = f"{safe_user_id}_{safe_original_name}"
    save_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(save_path, "wb") as buffer:
            buffer.write(content)
        chunk_count = vector_engine.ingest_cv(save_path, safe_filename, user_id=safe_user_id)
        full_text = vector_engine.get_full_cv_text(user_id=safe_user_id)
        skills = vector_engine.extract_skills(full_text)
        return {"success": True, "chunks_processed": chunk_count, "skills": skills}
    except Exception:
        raise generic_server_error()

@router.post("/cv-manual")
async def manual_cv_ingest(payload: ManualFormPayload, request_user_id: str = Depends(get_request_user_id)):
    safe_user_id = request_user_id if request_user_id != "anonymous_user" else sanitize_user_id(payload.userId)
    safe_type = sanitize_user_id(payload.type)
    safe_filename = f"{safe_user_id}_{safe_type}.txt"
    save_path = os.path.join(UPLOAD_DIR, safe_filename)
    safe_text = validate_text(payload.text_chunk, "Manual CV text")

    try:
        with open(save_path, "w", encoding="utf-8") as f:
            f.write(safe_text)
        chunk_count = vector_engine.ingest_cv(save_path, safe_filename, user_id=safe_user_id)
        skills = vector_engine.extract_skills(safe_text)
        return {"success": True, "chunks_processed": chunk_count, "skills": skills}
    except Exception:
        raise generic_server_error()
