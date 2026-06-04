import json
import os
from typing import Any, Optional

import requests
from google import genai
from google.genai import types


class LLMUnavailableError(Exception):
    pass


class LLMService:
    def __init__(self):
        google_api_key = os.getenv("GOOGLE_API_KEY")
        self.gemini = genai.Client(api_key=google_api_key) if google_api_key else None
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

    def generate_text(self, prompt: str, temperature: float = 0.35) -> str:
        errors: list[str] = []

        if self.gemini:
            try:
                response = self.gemini.models.generate_content(
                    model=self.gemini_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(temperature=temperature),
                )
                text = (response.text or "").strip()
                if text:
                    return text
                errors.append("Gemini returned an empty response.")
            except Exception as exc:
                errors.append(f"Gemini failed: {exc}")

        if self.groq_api_key:
            try:
                return self._generate_with_groq(prompt, temperature=temperature).strip()
            except Exception as exc:
                errors.append(f"Groq failed: {exc}")

        raise LLMUnavailableError(" | ".join(errors) or "No LLM provider is configured.")

    def generate_json(self, prompt: str, temperature: float = 0.1) -> dict[str, Any]:
        errors: list[str] = []

        if self.gemini:
            try:
                response = self.gemini.models.generate_content(
                    model=self.gemini_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=temperature,
                    ),
                )
                return self._parse_json(response.text or "")
            except Exception as exc:
                errors.append(f"Gemini JSON failed: {exc}")

        if self.groq_api_key:
            try:
                text = self._generate_with_groq(
                    prompt,
                    temperature=temperature,
                    response_format={"type": "json_object"},
                )
                return self._parse_json(text)
            except Exception as exc:
                errors.append(f"Groq JSON failed: {exc}")

        raise LLMUnavailableError(" | ".join(errors) or "No LLM provider is configured.")

    def _generate_with_groq(
        self,
        prompt: str,
        temperature: float,
        response_format: Optional[dict[str, str]] = None,
    ) -> str:
        if not self.groq_api_key:
            raise LLMUnavailableError("GROQ_API_KEY is not configured.")

        body: dict[str, Any] = {
            "model": self.groq_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
        }
        if response_format:
            body["response_format"] = response_format

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json",
                "User-Agent": "CareerPilot/1.0",
            },
            json=body,
            timeout=30,
        )

        if not response.ok:
            raise LLMUnavailableError(f"Groq HTTP {response.status_code}: {response.text}")

        payload = response.json()
        return payload["choices"][0]["message"]["content"]

    def _parse_json(self, text: str) -> dict[str, Any]:
        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
