from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints.cv_upload import router as cv_router
from app.api.endpoints.query_engine import router as query_router
from app.api.endpoints.job_hunter import router as job_router # 1. Import added

app = FastAPI(title="CareerPilot Core Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cv_router)
app.include_router(query_router)
app.include_router(job_router) # 2. Router included here

@app.get("/")
def health_check():
    return {"status": "online"}