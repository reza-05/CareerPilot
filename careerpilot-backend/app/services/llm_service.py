import json
import os
import time
from typing import Any, Optional, Union

import requests
from google import genai
from google.genai import types


class LLMUnavailableError(Exception):
    pass


class LLMService:
    _gemini_disabled_until = 0.0

    def __init__(self):
        google_api_keys = self._load_gemini_keys()
        self.gemini_timeout_ms = int(os.getenv("GEMINI_TIMEOUT_MS", "2500"))
        self.gemini_max_attempts = int(os.getenv("GEMINI_MAX_ATTEMPTS", "3"))
        self.gemini_cooldown_seconds = int(os.getenv("GEMINI_COOLDOWN_SECONDS", "300"))
        self.gemini_clients = [
            genai.Client(
                api_key=api_key,
                http_options=types.HttpOptions(timeout=self.gemini_timeout_ms),
            )
            for api_key in google_api_keys
        ]
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.groq_timeout_seconds = int(os.getenv("GROQ_TIMEOUT_SECONDS", "24"))

    def _load_gemini_keys(self) -> list[str]:
        raw_keys = [os.getenv("GOOGLE_API_KEYS", ""), os.getenv("GOOGLE_API_KEY", "")]
        keys: list[str] = []

        for raw_value in raw_keys:
            for key in raw_value.split(","):
                cleaned = key.strip()
                if cleaned and cleaned not in keys:
                    keys.append(cleaned)

        return keys

    def _can_use_gemini(self) -> bool:
        return bool(self.gemini_clients) and time.monotonic() >= self.__class__._gemini_disabled_until

    def _cool_down_gemini(self, reason: Union[Exception, str]) -> None:
        reason_text = str(reason).lower()
        should_cool_down = any(
            marker in reason_text
            for marker in ["429", "quota", "rate", "exhausted", "timeout", "deadline", "unavailable", "503", "500"]
        )
        if should_cool_down:
            self.__class__._gemini_disabled_until = time.monotonic() + self.gemini_cooldown_seconds

    def _generate_with_gemini(
        self,
        prompt: str,
        temperature: float,
        response_mime_type: Optional[str] = None,
    ) -> str:
        if not self._can_use_gemini():
            raise LLMUnavailableError("Gemini is cooling down after a recent failure.")

        errors: list[str] = []
        attempt_count = max(1, self.gemini_max_attempts)

        for attempt in range(attempt_count):
            client = self.gemini_clients[attempt % len(self.gemini_clients)]
            try:
                config_kwargs: dict[str, Any] = {"temperature": temperature}
                if response_mime_type:
                    config_kwargs["response_mime_type"] = response_mime_type

                response = client.models.generate_content(
                    model=self.gemini_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(**config_kwargs),
                )
                text = (response.text or "").strip()
                if text:
                    return text
                errors.append(f"Gemini attempt {attempt + 1} returned an empty response.")
            except Exception as exc:
                errors.append(f"Gemini attempt {attempt + 1} failed: {exc}")

        self._cool_down_gemini(" | ".join(errors))
        raise LLMUnavailableError(" | ".join(errors) or "Gemini failed.")

    def generate_text(self, prompt: str, temperature: float = 0.35) -> str:
        errors: list[str] = []

        if self._can_use_gemini():
            try:
                return self._generate_with_gemini(prompt, temperature=temperature)
            except Exception as exc:
                errors.append(f"Gemini failed: {exc}")
        elif self.gemini_clients:
            errors.append("Gemini is cooling down after a recent failure.")

        if self.groq_api_key:
            try:
                return self._generate_with_groq(prompt, temperature=temperature).strip()
            except Exception as exc:
                errors.append(f"Groq failed: {exc}")

        raise LLMUnavailableError(" | ".join(errors) or "No LLM provider is configured.")

    def generate_json(self, prompt: str, temperature: float = 0.1) -> dict[str, Any]:
        errors: list[str] = []

        if self._can_use_gemini():
            try:
                text = self._generate_with_gemini(
                    prompt,
                    temperature=temperature,
                    response_mime_type="application/json",
                )
                return self._parse_json(text)
            except Exception as exc:
                errors.append(f"Gemini JSON failed: {exc}")
        elif self.gemini_clients:
            errors.append("Gemini is cooling down after a recent failure.")

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
            timeout=self.groq_timeout_seconds,
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
