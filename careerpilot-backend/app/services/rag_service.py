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
    SKILL_ALIASES = {
        "python": "Python",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "java": "Java",
        "c++": "C++",
        "c#": "C#",
        "react": "React",
        "next.js": "Next.js",
        "nextjs": "Next.js",
        "node.js": "Node.js",
        "nodejs": "Node.js",
        "express": "Express",
        "fastapi": "FastAPI",
        "django": "Django",
        "flask": "Flask",
        "html": "HTML",
        "css": "CSS",
        "tailwind": "Tailwind CSS",
        "sql": "SQL",
        "mysql": "MySQL",
        "postgresql": "PostgreSQL",
        "mongodb": "MongoDB",
        "firebase": "Firebase",
        "docker": "Docker",
        "git": "Git",
        "github": "GitHub",
        "aws": "AWS",
        "azure": "Azure",
        "gcp": "GCP",
        "machine learning": "Machine Learning",
        "deep learning": "Deep Learning",
        "data analysis": "Data Analysis",
        "data science": "Data Science",
        "pandas": "Pandas",
        "numpy": "NumPy",
        "tensorflow": "TensorFlow",
        "pytorch": "PyTorch",
        "scikit-learn": "Scikit-learn",
        "nlp": "NLP",
        "api": "API",
        "rest api": "REST API",
        "graphql": "GraphQL",
        "linux": "Linux",
        "figma": "Figma",
        "communication": "Communication",
        "leadership": "Leadership",
        "teamwork": "Teamwork",
        "problem solving": "Problem Solving",
    }
    ROLE_KEYWORDS = {
        "backend": ["backend", "api", "microservice", "distributed", "grpc", "node.js", "express", "django", "fastapi", "redis", "postgresql", "mongodb", "kubernetes", "docker"],
        "frontend": ["frontend", "react", "next.js", "typescript", "javascript", "html", "css", "tailwind", "ui", "web"],
        "ai_ml": ["machine learning", "deep learning", "ai", "artificial intelligence", "nlp", "tensorflow", "pytorch", "scikit-learn", "data science"],
        "cloud": ["aws", "gcp", "azure", "docker", "kubernetes", "ci/cd", "lambda", "cloud"],
        "data": ["sql", "postgresql", "mongodb", "redis", "kafka", "elasticsearch", "database", "data"],
    }
    EXPERIENCE_SIGNALS = [
        "intern", "software engineering intern", "backend engineering intern", "google",
        "deployed", "architected", "optimized", "distributed", "microservice",
        "production", "unit", "integration", "open source", "icpc", "cgpa",
    ]

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

    def extract_skills(self, text: str) -> list[str]:
        normalized = re.sub(r"\s+", " ", text.lower())
        detected = []

        for alias, display_name in self.SKILL_ALIASES.items():
            escaped = re.escape(alias)
            if re.search(rf"(?<![a-z0-9+#.]){escaped}(?![a-z0-9+#.])", normalized):
                detected.append(display_name)

        detected.extend(self._extract_skills_from_sections(text))
        return sorted(set(detected), key=lambda skill: skill.lower())

    def _contains_term(self, text: str, term: str) -> bool:
        escaped = re.escape(term.lower())
        return bool(re.search(rf"(?<![a-z0-9+#.]){escaped}(?![a-z0-9+#.])", text.lower()))

    def _score_skill_overlap(self, job_text: str, cv_text: str) -> float:
        job_skills = set(self.extract_skills(job_text))
        cv_skills = set(self.extract_skills(cv_text))
        generic_software_terms = [
            "software", "developer", "programming", "web", "database", "api", "application"
        ]

        if not job_skills:
            if cv_skills and any(self._contains_term(job_text, term) for term in generic_software_terms):
                return 0.35
            return 0.15 if cv_skills else 0.0

        overlap_count = len(job_skills.intersection(cv_skills))
        overlap_score = overlap_count / max(3, len(job_skills))
        if overlap_score == 0 and cv_skills and any(self._contains_term(job_text, term) for term in generic_software_terms):
            return 0.30
        return min(1.0, overlap_score)

    def _score_role_alignment(self, job_text: str, cv_text: str) -> float:
        normalized_job = job_text.lower()
        normalized_cv = cv_text.lower()
        relevant_scores = []

        for terms in self.ROLE_KEYWORDS.values():
            job_hits = [term for term in terms if self._contains_term(normalized_job, term)]
            if not job_hits:
                continue

            cv_hits = [term for term in terms if self._contains_term(normalized_cv, term)]
            relevant_scores.append(min(1.0, len(cv_hits) / max(2, len(job_hits))))

        if not relevant_scores:
            return 0.25

        return min(1.0, sum(relevant_scores) / len(relevant_scores))

    def _score_experience_strength(self, cv_text: str) -> float:
        normalized_cv = cv_text.lower()
        hits = sum(1 for signal in self.EXPERIENCE_SIGNALS if self._contains_term(normalized_cv, signal))
        return min(1.0, hits / 7)

    def _extract_skills_from_sections(self, text: str) -> list[str]:
        section_pattern = re.compile(
            r"(?is)(?:^|\n)\s*(?:technical\s+skills|technical\s+competencies|core\s+skills|skills|tools\s*(?:&|and)\s*technologies)\s*:?\s*(.*?)(?=\n\s*(?:experience|education|projects|certifications|languages|summary|objective|work\s+history|achievements|$))"
        )
        detected = []

        for match in section_pattern.finditer(text):
            section = match.group(1)
            candidates = re.split(r"[,;|•\n\t]+", section)

            for candidate in candidates:
                cleaned = re.sub(r"^[\-\u2022*]+\s*", "", candidate).strip()
                cleaned = re.sub(r"\s+", " ", cleaned)
                if not cleaned or len(cleaned) > 40:
                    continue
                if re.search(r"\d{4}|@|https?://", cleaned):
                    continue
                if len(cleaned.split()) > 4:
                    continue
                detected.append(cleaned)

        return detected

    def ingest_cv(self, file_path: str, filename: str, user_id: str = "anonymous_user") -> int:
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

        # Clear only this user's old CV chunks before re-ingesting.
        try:
            existing = self.collection.get(where={"user_id": user_id})
            if existing["ids"]:
                self.collection.delete(ids=existing["ids"])
        except Exception:
            pass

        documents_list, metadatas_list, ids_list, embeddings_list = [], [], [], []
        for index, chunk in enumerate(chunks):
            vector_embedding = self._get_embedding(chunk)
            documents_list.append(chunk)
            embeddings_list.append(vector_embedding)
            metadatas_list.append({"source_file": filename, "chunk_index": index, "user_id": user_id})
            ids_list.append(f"{user_id}_{filename}_chunk_{index}")

        self.collection.upsert(
            ids=ids_list,
            embeddings=embeddings_list,
            metadatas=metadatas_list,
            documents=documents_list
        )
        return len(chunks)

    def retrieve_cv_context(self, query: str, num_results: int = 4, user_id: str = "anonymous_user") -> list:
        query_embedding = self._get_embedding(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=num_results,
            where={"user_id": user_id}
        )
        return results["documents"][0] if results and "documents" in results else []

    def get_full_cv_text(self, user_id: str = "anonymous_user") -> str:
        storage_dir = "./storage/temp_cvs"
        if not os.path.exists(storage_dir):
            return ""
        files = sorted(
            [f for f in os.listdir(storage_dir) if f.endswith(".txt") and f.startswith(f"{user_id}_")],
            key=lambda x: os.path.getmtime(os.path.join(storage_dir, x)),
            reverse=True
        )
        if not files:
            return ""
        with open(os.path.join(storage_dir, files[0]), "r", encoding="utf-8") as f:
            return f.read()

    def compute_fit_score(self, job_description: str, user_id: str = "anonymous_user") -> dict:
        import numpy as np
        jd_embedding = self._get_embedding(job_description[:1500])
        stored = self.collection.get(where={"user_id": user_id}, include=["embeddings", "documents"])
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
        semantic_score = max(0.0, min(1.0, (raw_score - 0.25) / 0.55))
        cv_text = "\n".join(stored.get("documents") or [])
        skill_score = self._score_skill_overlap(job_description, cv_text)
        role_score = self._score_role_alignment(job_description, cv_text)
        experience_score = self._score_experience_strength(cv_text)

        effective_experience_score = experience_score * max(skill_score, role_score)

        final_score = (
            semantic_score * 0.42
            + skill_score * 0.28
            + role_score * 0.20
            + effective_experience_score * 0.10
        )

        has_job_detail = len(re.findall(r"[a-zA-Z][a-zA-Z0-9+#.]{2,}", job_description or "")) >= 35
        if not has_job_detail:
            final_score *= 0.88

        percent = int(round(max(0, min(100, final_score * 100))))
        return {
            "score": round(raw_score, 4),
            "percent": percent,
            "components": {
                "semantic": round(semantic_score, 3),
                "skills": round(skill_score, 3),
                "role": round(role_score, 3),
                "experience": round(effective_experience_score, 3),
            },
        }
