import os
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from google import genai
from dotenv import load_dotenv

load_dotenv()

class CVVectorEngine:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
        self.ai = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        self.collection = self.chroma_client.get_or_create_collection(
            name="resume_intelligence",
            metadata={"hnsw:space": "cosine"}
        )

    def _get_embedding(self, text: str) -> list[float]:
        # Use stable model gemini-embedding-001
        response = self.ai.models.embed_content(
            model="gemini-embedding-001",
            contents=text
        )
        # Fix: Access the embeddings list index 0
        return response.embeddings[0].values

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
            raise ValueError("The uploaded PDF appears to be empty.")

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = text_splitter.split_text(raw_text)

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
        return results['documents'][0] if results and 'documents' in results else []