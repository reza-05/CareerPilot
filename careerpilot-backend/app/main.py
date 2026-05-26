from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints.job_hunter import router as job_hunter_router

app = FastAPI()

# Add this block to fix the CORS error
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(job_hunter_router)

@app.get("/")
def read_root():
    return {"message": "CareerPilot Backend is running"}