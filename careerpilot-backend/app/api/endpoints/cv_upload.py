import os
import io
import traceback
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
import chromadb
from google import genai

router = APIRouter(prefix="/api", tags=["CV Ingestion"])
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="user_resumes")

ai = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

class ManualFormPayload(BaseModel):
    userId: str
    text_chunk: str
    type: str

def get_gemini_embedding(text: str) -> list[float]:
    try:
        response = ai.models.embed_content(
            model="gemini-embedding-001",
            contents=text
        )
        # Correctly access the list of embeddings
        if response.embeddings and len(response.embeddings) > 0:
            return response.embeddings[0].values
        raise ValueError("API returned no embeddings.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cv-upload")
async def handle_cv_upload(file: UploadFile = File(...), userId: str = Form("anonymous_user"), type: str = Form("resume_parsed")):
    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))
    raw_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_text(raw_text)

    for i, chunk in enumerate(chunks):
        embedding_vector = get_gemini_embedding(chunk)
        collection.add(
            ids=[f"{userId}_{type}_{i}_{int(os.getpid())}"],
            embeddings=[embedding_vector],
            documents=[chunk],
            metadatas=[{"userId": userId, "type": type}]
        )
    return {"success": True, "chunks_processed": len(chunks)}

@router.post("/cv-manual")
async def manual_cv_ingest(payload: ManualFormPayload):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_text(payload.text_chunk)
    for i, chunk in enumerate(chunks):
        embedding_vector = get_gemini_embedding(chunk)
        collection.add(
            ids=[f"{payload.userId}_{payload.type}_{i}_{int(os.getpid())}"],
            embeddings=[embedding_vector],
            documents=[chunk],
            metadatas=[{"userId": payload.userId, "type": payload.type}]
        )
    return {"success": True, "chunks_processed": len(chunks)}