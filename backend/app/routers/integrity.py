from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Evidence, EvidenceHash, User
from app.database.schemas import EvidenceVerificationOut
from app.core.dependencies import get_current_user, require_role
from app.services.hashing_service import hashing_service
from app.services.storage_service import storage_service
from app.services.custody_service import custody_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/evidence", tags=["Integrity Verification"])

@router.post("/{evidence_id}/verify", response_model=EvidenceVerificationOut)
def verify_evidence_integrity(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    file_path = storage_service.get_evidence_path(ev.stored_filename)

    # Real verification execution
    status_result, current_hash, recorded_hash = hashing_service.verify_file_integrity(
        file_path=file_path,
        reference_hash=ev.sha256_hash
    )

    now = datetime.now(timezone.utc)

    # Save to EvidenceHash record history
    new_hash_record = EvidenceHash(
        evidence_id=ev.id,
        recorded_hash=ev.sha256_hash,
        current_hash=current_hash,
        calculated_at=now,
        verification_status=status_result,
        last_verified_at=now,
        verified_by=current_user.username,
        notes=f"Integrity check executed by {current_user.username}. Outcome: {status_result}."
    )
    db.add(new_hash_record)
    db.commit()

    # Append to Chain of Custody
    custody_service.record_custody_action(
        db=db,
        evidence_id=ev.id,
        case_id=ev.case_id,
        action_type="INTEGRITY_VERIFIED",
        actor=current_user.username,
        description=f"Cryptographic integrity verification performed: {status_result}.",
        metadata_dict={
            "recorded_hash": ev.sha256_hash,
            "calculated_hash": current_hash,
            "outcome": status_result
        }
    )

    # Append to Audit Log
    outcome_audit = "SUCCESS" if status_result == "HASH MATCH" else "WARNING"
    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="INTEGRITY_VERIFICATION",
        resource_type="EVIDENCE",
        resource_id=ev.id,
        outcome=outcome_audit,
        details=f"Verification result: {status_result}. Reference: {ev.sha256_hash}, Calculated: {current_hash}"
    )

    disclaimer = (
        "FORENSIC NOTICE: A matching SHA-256 hash mathematically proves bitwise parity with the stored reference file. "
        "It does NOT independently prove that the video camera was authentic, that the recording was unmanipulated prior "
        "to acquisition, or that acquisition chain-of-custody was flawless."
    )

    return {
        "evidence_id": ev.id,
        "recorded_hash": ev.sha256_hash,
        "current_hash": current_hash,
        "verification_status": status_result,
        "verified_at": now,
        "verified_by": current_user.username,
        "forensic_disclaimer": disclaimer
    }
