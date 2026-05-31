from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. Import dotenv to securely read your local config variables
from dotenv import load_dotenv
# 2. Trigger the load sequence immediately BEFORE importing your endpoint routers
load_dotenv()

# Now it is completely safe to import your routers!
from app.api.endpoints.job_hunter import router as job_hunter_router
from app.api.endpoints.cv_upload import router as cv_upload_router

app = FastAPI()

# Core system middleware layer configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Preserve original application paths
app.include_router(job_hunter_router)

# Mount the CV Upload and Manual Processing operations router
app.include_router(cv_upload_router)

@app.get("/")
def read_root():
    return {"message": "CareerPilot Backend is running"}