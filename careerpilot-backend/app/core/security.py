import os
import re
from html import escape
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile

MAX_TEXT_LENGTH = int(os.getenv("MAX_TEXT_LENGTH", "60000"))
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
SAFE_TEXT_PATTERN = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_user_id(user_id: Optional[str]) -> str:
    safe_id = re.sub(r"[^a-zA-Z0-9_-]", "_", user_id or "anonymous_user")
    return safe_id[:120] or "anonymous_user"


def sanitize_filename(filename: Optional[str]) -> str:
    safe_name = Path(filename or "uploaded_cv").name
    safe_name = re.sub(r"[^a-zA-Z0-9._ -]", "_", safe_name).strip(" .")
    return safe_name[:160] or "uploaded_cv"


def validate_text(value: str, field_name: str, *, max_length: int = MAX_TEXT_LENGTH) -> str:
    cleaned = SAFE_TEXT_PATTERN.sub("", value or "").strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail=f"{field_name} is required.")
    if len(cleaned) > max_length:
        raise HTTPException(status_code=413, detail=f"{field_name} is too large.")
    return cleaned


def safe_public_text(value: Optional[str], max_length: int = 2000) -> str:
    cleaned = SAFE_TEXT_PATTERN.sub("", value or "").strip()
    return escape(cleaned[:max_length], quote=False)


async def validate_upload_file(
    file: UploadFile,
    allowed_extensions: set[str],
    *,
    max_bytes: int = MAX_UPLOAD_BYTES,
) -> tuple[str, bytes]:
    safe_name = sanitize_filename(file.filename)
    ext = Path(safe_name).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail="Uploaded file is too large.")
    return safe_name, content


def generic_server_error() -> HTTPException:
    return HTTPException(status_code=500, detail="We could not complete the request right now. Please try again.")
