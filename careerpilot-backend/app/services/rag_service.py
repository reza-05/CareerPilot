import os
import hashlib
import re
import chromadb
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google import genai
from dotenv import load_dotenv
from fastapi import HTTPException  # <-- এই ইম্পোর্টটি মিসিং ছিল, এখন ফিক্সড!

load_dotenv()

class CVVectorEngine:
    FALLBACK_DIMENSIONS = 3072

    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.ai = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        self.collection = self.chroma_client.get_or_create_collection(
            name="resume_intelligence",
            metadata={"hnsw:space": "cosine"}
        )

    def _fallback_embedding(self, text: str) -> list[float]:
        vector = [0.0] * self.FALLBACK_DIMENSIONS
        tokens = re.findall(r"[a-zA-Z0-9+#.]+", text.lower())

        if not tokens:
            tokens = ["empty"]

        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            index = int.from_bytes(digest[:4], "big") % self.FALLBACK_DIMENSIONS
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vector[index] += sign

        magnitude = sum(value * value for value in vector) ** 0.5 or 1.0
        return [value / magnitude for value in vector]

    def _get_embedding(self, text: str) -> list[float]:
        try:
            response = self.ai.models.embed_content(
                model="gemini-embedding-001",
                contents=text
            )
            return response.embeddings[0].values
        except Exception as e:
            print(f"Embedding API unavailable, using local fallback: {e}")
            return self._fallback_embedding(text)

    def _extract_text(self, file_path: str, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        
        # --- PDF Extraction ---
        if ext == ".pdf":
            raw_text = ""
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    raw_text += page_text + "\n"
            return raw_text
            
        # --- DOCX Extraction ---
        elif ext in [".docx", ".doc"]:
            try:
                import docx
                doc = docx.Document(file_path)
                return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
            except ImportError:
                # venv এর ভেতরে ইনস্টল না থাকলে কোড ক্র্যাশ না করে ক্লিয়ার মেসেজ দেবে
                raise HTTPException( 
                    status_code=500, 
                    detail="Server path environment is missing python-docx. Please install it inside venv."
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Failed to read Word document: {str(e)}")
                
        # --- Text Files ---
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

    def ingest_cv(self, file_path: str, filename: str) -> int:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        raw_text = self._extract_text(file_path, filename)
        if not raw_text.strip():
            raise ValueError("CV appears to be empty or unreadable.")

        # Persist raw text to disk
        raw_text_path = f"./storage/temp_cvs/{filename}.txt"
        os.makedirs("./storage/temp_cvs", exist_ok=True)
        with open(raw_text_path, "w", encoding="utf-8") as f:
            f.write(raw_text)

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = text_splitter.split_text(raw_text)

        # Clear old CV chunks before re-ingesting
        try:
            existing = self.collection.get()
            if existing["ids"]:
                self.collection.delete(ids=existing["ids"])
        except Exception:
            pass

        documents_list, metadatas_list, ids_list, embeddings_list = [], [], [], []
        for index, chunk in enumerate(chunks):
            vector_embedding = self._get_embedding(chunk)
            documents_list.append(chunk)
            embeddings_list.append(vector_embedding)
            metadatas_list.append({"source_file": filename, "chunk_index": index})
            ids_list.append(f"{filename}_chunk_{index}")

        self.collection.upsert(
            ids=ids_list,
            embeddings=embeddings_list,
            metadatas=metadatas_list,
            documents=documents_list
        )
        return len(chunks)

    def retrieve_cv_context(self, query: str, num_results: int = 4) -> list:
        query_embedding = self._get_embedding(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=num_results
        )
        return results["documents"][0] if results and "documents" in results else []

    def get_full_cv_text(self) -> str:
        storage_dir = "./storage/temp_cvs"
        if not os.path.exists(storage_dir):
            return ""
        files = sorted(
            [f for f in os.listdir(storage_dir) if f.endswith(".txt")],
            key=lambda x: os.path.getmtime(os.path.join(storage_dir, x)),
            reverse=True
        )
        if not files:
            return ""
        with open(os.path.join(storage_dir, files[0]), "r", encoding="utf-8") as f:
            return f.read()

    def compute_fit_score(self, job_description: str) -> dict:
        import numpy as np
        jd_embedding = self._get_embedding(job_description[:1500])
        stored = self.collection.get(include=["embeddings", "documents"])
        stored_embeddings = stored.get("embeddings")
        if stored_embeddings is None or len(stored_embeddings) == 0:
            return {"score": 0.0, "percent": 0}

        embeddings = np.array(stored_embeddings)
        jd_vec = np.array(jd_embedding)
        norms = np.linalg.norm(embeddings, axis=1) * np.linalg.norm(jd_vec)
        norms = np.where(norms == 0, 1e-10, norms)
        similarities = np.dot(embeddings, jd_vec) / norms
        top_scores = sorted(similarities, reverse=True)[:3]
        raw_score = float(np.mean(top_scores))
        percent = int(max(0, min(100, (raw_score - 0.3) / 0.65 * 100)))
        return {"score": round(raw_score, 4), "percent": percent}
