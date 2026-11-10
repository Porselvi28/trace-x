import os
import shutil
import cv2
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.database.connection import get_db
from app.database.schemas import SystemStatusOut
from app.models.authenticity_analyzer import authenticity_analyzer

router = APIRouter(tags=["System Health & Diagnostics"])

@router.get("/health")
def get_health_check(db: Session = Depends(get_db)):
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected" if db_ok else "disconnected"
    }

@router.get("/system/status", response_model=SystemStatusOut)
def get_system_status(db: Session = Depends(get_db)):
    # 1. Check DB
    db_connected = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_connected = False

    # 2. Check OpenCV
    opencv_available = hasattr(cv2, "__version__")
    cv_version = cv2.__version__ if opencv_available else None

    # 3. Check FFmpeg on system
    ffmpeg_available = shutil.which("ffmpeg") is not None

    # 4. Check Storage
    storage_writable = os.access(settings.STORAGE_DIR, os.W_OK)

    return {
        "api_operational": True,
        "database_connected": db_connected,
        "opencv_available": opencv_available,
        "opencv_version": cv_version,
        "ffmpeg_available": ffmpeg_available,
        "ai_event_detector_configured": True,  # OpenCV MOG2 Motion Sentinel is active
        "authenticity_analyzer_configured": authenticity_analyzer.is_configured,  # Unconfigured by design
        "storage_writable": storage_writable,
        "app_version": settings.VERSION,
        "environment": "Development / Forensic Workstation"
    }
