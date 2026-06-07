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
    SKILL_FAMILIES = {
        "backend": [
            "backend", "node.js", "nodejs", "express", "fastapi", "django", "flask",
            "rest api", "api", "graphql", "microservice", "grpc", "redis", "postgresql",
            "mysql", "mongodb", "sql", "database", "distributed systems"
        ],
        "frontend": [
            "frontend", "react", "next.js", "nextjs", "typescript", "javascript",
            "html", "css", "tailwind", "ui", "responsive", "web"
        ],
        "ai_ml": [
            "machine learning", "deep learning", "artificial intelligence", "ai", "nlp",
            "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "data science"
        ],
        "devops_cloud": [
            "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "linux",
            "deployment", "cloud", "nginx"
        ],
        "mobile": ["mobile", "android", "ios", "flutter", "react native", "kotlin", "swift"],
        "data": ["data analysis", "analytics", "sql", "excel", "power bi", "tableau", "etl"],
        "design": ["figma", "ui", "ux", "wireframe", "prototype", "visual design"],
        "marketing": ["marketing", "seo", "content", "campaign", "social media", "brand"],
    }
    GENERAL_TECH_TERMS = sorted({term for terms in SKILL_FAMILIES.values() for term in terms})
    EXPERIENCE_SIGNALS = [
        "intern", "software engineering intern", "backend engineering intern", "google",
        "deployed", "architected", "optimized", "distributed", "microservice",
        "production", "unit", "integration", "open source", "icpc", "cgpa",
    ]
    EVIDENCE_SIGNALS = [
        "built", "developed", "implemented", "designed", "deployed", "optimized",
        "integrated", "maintained", "led", "collaborated", "github", "open source",
        "project", "intern", "experience", "contributed", "production", "research",
        "published", "certification", "award", "competition", "icpc", "hackathon"
    ]
    GENERIC_SOFTWARE_TERMS = [
        "software", "developer", "engineer", "engineering", "programming",
        "web", "application", "backend", "frontend", "full stack", "full-stack"
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
        normalized_term = term.lower()
        escaped = re.escape(normalized_term)
        plural_suffix = ""
        if len(normalized_term) > 4 and normalized_term[-1].isalpha() and not normalized_term.endswith(("css", "sass", "less")):
            plural_suffix = r"(?:s|es)?"
        return bool(re.search(rf"(?<![a-z0-9+#.]){escaped}{plural_suffix}(?![a-z0-9+#.])", text.lower()))

    def _hit_count(self, text: str, terms: list[str]) -> int:
        return sum(1 for term in terms if self._contains_term(text, term))

    def _score_skill_overlap(self, job_text: str, cv_text: str) -> float:
        job_skills = set(self.extract_skills(job_text))
        cv_skills = set(self.extract_skills(cv_text))

        if not job_skills:
            if cv_skills and any(self._contains_term(job_text, term) for term in self.GENERIC_SOFTWARE_TERMS):
                return min(0.62, 0.34 + (min(len(cv_skills), 14) / 14) * 0.28)
            return 0.15 if cv_skills else 0.0

        overlap_count = len(job_skills.intersection(cv_skills))
        overlap_score = overlap_count / max(3, len(job_skills))
        if overlap_score == 0 and cv_skills and any(self._contains_term(job_text, term) for term in self.GENERIC_SOFTWARE_TERMS):
            return 0.30
        return min(1.0, overlap_score)

    def _score_required_skill_coverage(self, job_text: str, cv_text: str) -> float:
        normalized_job = job_text.lower()
        normalized_cv = cv_text.lower()
        family_scores = []

        for terms in self.SKILL_FAMILIES.values():
            job_hits = [term for term in terms if self._contains_term(normalized_job, term)]
            if not job_hits:
                continue
            cv_hits = [term for term in terms if self._contains_term(normalized_cv, term)]
            family_scores.append(min(1.0, len(cv_hits) / max(2, len(job_hits))))

        explicit_skill_score = self._score_skill_overlap(job_text, cv_text)
        if not family_scores:
            if any(self._contains_term(normalized_job, term) for term in self.GENERIC_SOFTWARE_TERMS):
                tech_depth = min(1.0, self._hit_count(normalized_cv, self.GENERAL_TECH_TERMS) / 12)
                evidence_depth = min(1.0, self._hit_count(normalized_cv, self.EVIDENCE_SIGNALS) / 8)
                return max(explicit_skill_score, 0.30 + tech_depth * 0.22 + evidence_depth * 0.16)
            return explicit_skill_score

        family_score = sum(family_scores) / len(family_scores)
        return min(1.0, family_score * 0.70 + explicit_skill_score * 0.30)

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

    def _score_cv_depth(self, cv_text: str) -> float:
        normalized_cv = cv_text.lower()
        tech_score = min(1.0, self._hit_count(normalized_cv, self.GENERAL_TECH_TERMS) / 12)
        evidence_score = min(1.0, self._hit_count(normalized_cv, self.EVIDENCE_SIGNALS) / 9)
        education_score = min(1.0, self._hit_count(normalized_cv, ["university", "college", "cgpa", "degree", "b.sc", "bachelor"]) / 3)
        contact_score = 1.0 if re.search(r"@|github\.com|linkedin\.com", normalized_cv) else 0.35
        return min(1.0, tech_score * 0.40 + evidence_score * 0.38 + education_score * 0.14 + contact_score * 0.08)

    def _detect_seniority(self, job_text: str) -> str:
        normalized_job = job_text.lower()
        if re.search(r"\b(intern|internship|trainee|apprentice)\b", normalized_job):
            return "intern"
        if re.search(r"\b(fresher|entry\s*level|graduate|junior|jr\.?)\b", normalized_job):
            return "junior"
        if re.search(r"\b(senior|sr\.?|lead|principal|staff|architect)\b", normalized_job):
            return "senior"
        years = [int(value) for value in re.findall(r"\b(\d+)\s*\+?\s*(?:years|yrs)\b", normalized_job)]
        if years and max(years) >= 5:
            return "senior"
        if years and max(years) >= 2:
            return "mid"
        return "general"

    def _score_seniority_fit(self, job_text: str, cv_text: str, cv_depth: float) -> float:
        seniority = self._detect_seniority(job_text)
        normalized_cv = cv_text.lower()
        work_hits = self._hit_count(normalized_cv, ["intern", "experience", "worked", "company", "client", "production", "maintained"])
        project_hits = self._hit_count(normalized_cv, ["project", "built", "developed", "implemented", "github", "deployed"])
        leadership_hits = self._hit_count(normalized_cv, ["lead", "led", "managed", "mentored", "architected", "ownership"])

        if seniority == "intern":
            return min(1.0, 0.58 + cv_depth * 0.38)
        if seniority == "junior":
            return min(1.0, 0.48 + cv_depth * 0.34 + min(project_hits, 3) * 0.05)
        if seniority == "mid":
            return min(1.0, 0.32 + cv_depth * 0.30 + min(work_hits, 5) * 0.06 + min(project_hits, 4) * 0.04)
        if seniority == "senior":
            return min(1.0, 0.20 + cv_depth * 0.20 + min(work_hits, 6) * 0.055 + min(leadership_hits, 4) * 0.07)
        return min(1.0, 0.40 + cv_depth * 0.42 + min(project_hits + work_hits, 6) * 0.03)

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
        skill_score = self._score_required_skill_coverage(job_description, cv_text)
        role_score = self._score_role_alignment(job_description, cv_text)
        experience_score = self._score_experience_strength(cv_text)
        cv_depth_score = self._score_cv_depth(cv_text)
        seniority_score = self._score_seniority_fit(job_description, cv_text, cv_depth_score)

        effective_experience_score = experience_score * max(skill_score, role_score)

        final_score = (
            semantic_score * 0.28
            + skill_score * 0.30
            + role_score * 0.18
            + seniority_score * 0.12
            + cv_depth_score * 0.08
            + effective_experience_score * 0.04
        )

        has_job_detail = len(re.findall(r"[a-zA-Z][a-zA-Z0-9+#.]{2,}", job_description or "")) >= 35
        if not has_job_detail:
            final_score *= 0.94
            if not any(self._contains_term(job_description, term) for term in self.GENERIC_SOFTWARE_TERMS):
                final_score = min(final_score, 0.58)
            else:
                final_score = min(final_score, 0.74)

        if skill_score >= 0.72 and role_score >= 0.70 and cv_depth_score >= 0.68:
            final_score += 0.045

        if skill_score < 0.22 and role_score < 0.25 and semantic_score < 0.55:
            final_score = min(final_score, 0.42)

        if cv_depth_score < 0.28:
            final_score = min(final_score, 0.50)

        seniority = self._detect_seniority(job_description)
        if seniority == "senior" and seniority_score < 0.58:
            final_score = min(final_score, 0.58)
        elif seniority == "mid" and seniority_score < 0.55:
            final_score = min(final_score, 0.64)

        percent = int(round(max(0, min(100, final_score * 100))))
        return {
            "score": round(raw_score, 4),
            "percent": percent,
            "components": {
                "semantic": round(semantic_score, 3),
                "skills": round(skill_score, 3),
                "role": round(role_score, 3),
                "seniority": round(seniority_score, 3),
                "cv_depth": round(cv_depth_score, 3),
                "experience": round(effective_experience_score, 3),
            },
        }
