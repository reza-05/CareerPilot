import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# 1. Import dotenv to securely read your local config variables
from dotenv import load_dotenv
# 2. Trigger the load sequence immediately BEFORE importing your endpoint routers
load_dotenv()

# Now it is completely safe to import your routers!
from app.api.endpoints.job_hunter import router as job_hunter_router
from app.api.endpoints.cv_upload import router as cv_upload_router

app = FastAPI()


def get_allowed_origins() -> list[str]:
    configured = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.2:3000,http://192.168.1.5:3000",
    )
    return [origin.strip() for origin in configured.split(",") if origin.strip()]

# Core system middleware layer configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-User-Id"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    return response

# Preserve original application paths
app.include_router(job_hunter_router)

# Mount the CV Upload and Manual Processing operations router
app.include_router(cv_upload_router)

@app.get("/")
def read_root():
    return {"message": "CareerPilot Backend is running"}
