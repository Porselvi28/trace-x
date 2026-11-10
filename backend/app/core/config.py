import os
from pathlib import Path
from typing import List

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "TRACE X — Digital Evidence Intelligence")
    VERSION: str = os.getenv("VERSION", "1.0.0")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tracex-forensic-dev-super-secure-jwt-secret-key-replace-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'tracex.db'}")
    
    STORAGE_DIR: Path = BASE_DIR / "data"
    EVIDENCE_DIR: Path = BASE_DIR / "data" / "evidence"
    FRAMES_DIR: Path = BASE_DIR / "data" / "frames"
    REPORTS_DIR: Path = BASE_DIR / "data" / "reports"
    
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "500"))
    MAX_UPLOAD_SIZE_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    
    ALLOWED_EXTENSIONS: set = {".mp4", ".avi", ".mov", ".mkv", ".webm"}
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
settings.FRAMES_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
