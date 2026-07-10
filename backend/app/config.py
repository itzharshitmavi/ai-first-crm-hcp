from __future__ import annotations

import os

from dotenv import load_dotenv


load_dotenv()


APP_TITLE = "AI-First CRM HCP Module"
APP_VERSION = "1.0.0"
DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")  #The model `gemma2-9b-it` has been decommissioned and is no longer supported.
FALLBACK_CHAT_MODEL = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.3-70b-versatile")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
ALLOW_MOCK_LLM = os.getenv("ALLOW_MOCK_LLM", "1") == "1"
