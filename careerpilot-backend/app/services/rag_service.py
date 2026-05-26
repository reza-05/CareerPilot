import os
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
import requests
from dotenv import load_dotenv

load_dotenv()

class CVVectorEngine:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.collection = self.chroma_client.get_or_create_collection(
            name="resume_intelligence",
            metadata={"hnsw:space": "cosine"}
        )

    def _get_embedding(self, text: str) -> list:
        # EXACT MODEL NAME FROM YOUR LOGS
        model_name = "gemini-embedding-001"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:embedContent?key={self.api_key}"
        
        payload = {
            "model": f"models/{model_name}",
            "content": {"parts": [{"text": text}]}
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code != 200:
            raise RuntimeError(f"Google API Error: {response.text}")
        
        return response.json()["embedding"]["values"]

    def ingest_pdf_cv(self, file_path: str, filename: str) -> int:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Target document not found at: {file_path}")

        raw_text = ""
        reader = PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                raw_text += page_text + "\n"
        
        if not raw_text.strip():
            raise ValueError("The uploaded PDF appears to be empty or non-scannable.")

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = text_splitter.split_text(raw_text)

        documents_list = []
        metadatas_list = []
        ids_list = []
        embeddings_list = []

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
        return results['documents'][0] if results and 'documents' in results and results['documents'] else []