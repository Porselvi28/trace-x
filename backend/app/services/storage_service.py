import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageService:
    @staticmethod
    def validate_file_extension(filename: str) -> str:
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        return ext

    @staticmethod
    def get_safe_storage_name(original_filename: str) -> str:
        ext = StorageService.validate_file_extension(original_filename)
        safe_id = uuid.uuid4().hex[:16]
        return f"trx_evd_{safe_id}{ext}"

    @staticmethod
    async def save_uploaded_evidence(upload_file: UploadFile) -> tuple[str, str, int]:
        """
        Saves uploaded file securely into storage directory without trusting user input path.
        Returns: (stored_filename, absolute_file_path, file_size)
        """
        original_name = upload_file.filename or "unknown_evidence.mp4"
        safe_filename = StorageService.get_safe_storage_name(original_name)
        target_path = settings.EVIDENCE_DIR / safe_filename

        # Stream save and count bytes
        file_size = 0
        with open(target_path, "wb") as buffer:
            while chunk := await upload_file.read(1024 * 64):  # 64KB chunk
                file_size += len(chunk)
                if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
                    # Clean up file and abort
                    buffer.close()
                    if target_path.exists():
                        target_path.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail=f"Evidence file exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB"
                    )
                buffer.write(chunk)

        return safe_filename, str(target_path), file_size

    @staticmethod
    def get_evidence_path(stored_filename: str) -> Path:
        # Prevent path traversal
        clean_name = os.path.basename(stored_filename)
        path = settings.EVIDENCE_DIR / clean_name
        if not path.exists():
            raise HTTPException(status_code=404, detail="Evidence media file not found on disk")
        return path

storage_service = StorageService()
