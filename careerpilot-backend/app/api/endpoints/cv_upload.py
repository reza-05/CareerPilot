from fastapi import APIRouter, UploadFile, File, HTTPException, status
import shutil
import os
import traceback
from app.services.rag_service import CVVectorEngine

router = APIRouter(prefix="/api", tags=["CV Ingestion"])
ALLOWED_EXTENSIONS = {".pdf"}

# REMOVED: vector_engine = CVVectorEngine() (Don't init here)

@router.post("/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    try:
        # Initialize INSIDE the function so it doesn't hang the server startup
        vector_engine = CVVectorEngine() 
        
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Only PDF allowed")
        
        upload_dir = "storage/temp_cvs"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        total_chunks = vector_engine.ingest_pdf_cv(file_path, file.filename)
        return {"status": "success", "chunks_processed": total_chunks}
        
    except Exception as e:
        print("CRASHED!")
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=str(e))