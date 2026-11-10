import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.connection import get_db
from app.database.models import Evidence, EvidenceHash, Case, User
from app.database.schemas import EvidenceOut
from app.core.dependencies import get_current_user, require_role
from app.services.storage_service import storage_service
from app.services.hashing_service import hashing_service
from app.services.custody_service import custody_service
from app.services.audit_service import audit_service
from app.services.processing_service import processing_service

router = APIRouter(prefix="/evidence", tags=["Evidence Management"])

@router.get("", response_model=List[EvidenceOut])
def list_evidence(
    case_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Evidence)
    if case_id:
        query = query.filter(Evidence.case_id == case_id)
    if status and status != "All":
        query = query.filter(Evidence.status == status)
    if search:
        query = query.filter(
            (Evidence.original_filename.ilike(f"%{search}%")) |
            (Evidence.source_device.ilike(f"%{search}%")) |
            (Evidence.id.ilike(f"%{search}%"))
        )

    ev_list = query.order_by(Evidence.created_at.desc()).all()

    # Attach last verification status
    results = []
    for ev in ev_list:
        latest_hash = (
            db.query(EvidenceHash)
            .filter(EvidenceHash.evidence_id == ev.id)
            .order_by(EvidenceHash.id.desc())
            .first()
        )
        out = EvidenceOut.from_orm(ev)
        out.last_verified_status = latest_hash.verification_status if latest_hash else "UNVERIFIED"
        results.append(out)

    return results

@router.post("/upload", response_model=EvidenceOut, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    file: UploadFile = File(...),
    case_id: Optional[str] = Form(None),
    source_device: str = Form("CCTV-NVR-01"),
    source_vendor: str = Form("Generic DVR"),
    recording_start: Optional[str] = Form(None),
    recording_end: Optional[str] = Form(None),
    acquisition_notes: Optional[str] = Form(None),
    auto_process: bool = Form(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    # Verify case exists if specified
    if case_id:
        c = db.query(Case).filter(Case.id == case_id).first()
        if not c:
            raise HTTPException(status_code=400, detail=f"Target Case '{case_id}' does not exist.")

    # 1. Secure stream save to storage
    stored_filename, file_path, file_size = await storage_service.save_uploaded_evidence(file)

    # 2. Calculate Real SHA-256 Hash
    sha256_digest = hashing_service.calculate_sha256(file_path)

    # Check for duplicate hash warning in DB
    existing_dup = db.query(Evidence).filter(Evidence.sha256_hash == sha256_digest).first()
    dup_warning = f"Notice: Evidence file matches identical bitwise hash of existing record {existing_dup.id}." if existing_dup else None

    # Parse timestamps if provided
    rec_start_dt = None
    rec_end_dt = None
    if recording_start:
        try:
            rec_start_dt = datetime.fromisoformat(recording_start)
        except Exception:
            pass
    if recording_end:
        try:
            rec_end_dt = datetime.fromisoformat(recording_end)
        except Exception:
            pass

    # 3. Create Evidence Record
    year = datetime.now(timezone.utc).strftime("%Y")
    rand_id = uuid.uuid4().hex[:5].upper()
    evidence_id = f"TRX-EVD-{year}-{rand_id}"

    new_evidence = Evidence(
        id=evidence_id,
        case_id=case_id,
        original_filename=file.filename or "unknown_video.mp4",
        stored_filename=stored_filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "video/mp4",
        sha256_hash=sha256_digest,
        source_device=source_device.strip(),
        source_vendor=source_vendor.strip(),
        recording_start=rec_start_dt,
        recording_end=rec_end_dt,
        acquisition_notes=acquisition_notes,
        status="Uploaded",
        uploaded_by=current_user.username,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_evidence)
    db.commit()
    db.refresh(new_evidence)

    # 4. Record Reference Hash in EvidenceHash table
    ev_hash = EvidenceHash(
        evidence_id=new_evidence.id,
        recorded_hash=sha256_digest,
        calculated_at=datetime.now(timezone.utc),
        verification_status="UNVERIFIED",
        verified_by=current_user.username,
        notes=dup_warning or "Initial acquisition reference hash calculated."
    )
    db.add(ev_hash)
    db.commit()

    # 5. Record Chain of Custody actions
    custody_service.record_custody_action(
        db=db,
        evidence_id=new_evidence.id,
        case_id=case_id,
        action_type="EVIDENCE_UPLOADED",
        actor=current_user.username,
        description=f"Original video ingested into forensic repository. Stored securely as {stored_filename}.",
        metadata_dict={
            "original_filename": new_evidence.original_filename,
            "file_size_bytes": file_size,
            "source_device": source_device
        }
    )

    custody_service.record_custody_action(
        db=db,
        evidence_id=new_evidence.id,
        case_id=case_id,
        action_type="HASH_CALCULATED",
        actor="System SHA-256 Engine",
        description=f"Reference SHA-256 calculated: {sha256_digest}.",
        metadata_dict={"sha256": sha256_digest}
    )

    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="EVIDENCE_UPLOAD",
        resource_type="EVIDENCE",
        resource_id=new_evidence.id,
        outcome="SUCCESS",
        details=f"File '{new_evidence.original_filename}' uploaded ({file_size} bytes). Hash: {sha256_digest}"
    )

    # 6. Auto-trigger processing if requested
    if auto_process:
        job = processing_service.create_job(db, new_evidence.id, "METADATA_AND_DETECTION")
        processing_service.process_evidence_sync(db, job.id, actor=current_user.username)
        db.refresh(new_evidence)

    out = EvidenceOut.from_orm(new_evidence)
    out.last_verified_status = "UNVERIFIED"
    return out

@router.get("/{evidence_id}", response_model=EvidenceOut)
def get_evidence_detail(evidence_id: str, db: Session = Depends(get_db)):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail=f"Evidence record '{evidence_id}' not found")

    latest_hash = (
        db.query(EvidenceHash)
        .filter(EvidenceHash.evidence_id == ev.id)
        .order_by(EvidenceHash.id.desc())
        .first()
    )
    out = EvidenceOut.from_orm(ev)
    out.last_verified_status = latest_hash.verification_status if latest_hash else "UNVERIFIED"
    return out

@router.get("/{evidence_id}/download")
def download_evidence_file(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    file_path = storage_service.get_evidence_path(ev.stored_filename)

    # Record custody export
    custody_service.record_custody_action(
        db=db,
        evidence_id=ev.id,
        case_id=ev.case_id,
        action_type="EVIDENCE_EXPORTED",
        actor=current_user.username,
        description=f"Evidence binary exported/downloaded for official analysis."
    )

    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="EVIDENCE_DOWNLOAD",
        resource_type="EVIDENCE",
        resource_id=ev.id,
        outcome="SUCCESS",
        details=f"Evidence binary downloaded by {current_user.username}"
    )

    return FileResponse(
        path=str(file_path),
        filename=ev.original_filename,
        media_type=ev.mime_type
    )

@router.get("/frames/{filename}")
def serve_extracted_frame(filename: str):
    clean_name = os.path.basename(filename)
    frame_path = settings.FRAMES_DIR / clean_name
    if not frame_path.exists():
        raise HTTPException(status_code=404, detail="Requested frame not found")
    return FileResponse(path=str(frame_path), media_type="image/jpeg")
