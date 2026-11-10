from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Evidence, User
from app.core.dependencies import get_current_user, require_role
from app.models.authenticity_analyzer import authenticity_analyzer
from app.services.storage_service import storage_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/authenticity", tags=["Video Authenticity Analysis"])

@router.get("/status")
def get_authenticity_model_status():
    return {
        "model_name": authenticity_analyzer.model_name,
        "model_version": authenticity_analyzer.model_version,
        "is_configured": authenticity_analyzer.is_configured,
        "status_message": (
            "Authenticity analysis model is not configured. No authenticity conclusion has been generated."
            if not authenticity_analyzer.is_configured else "Active"
        ),
        "supported_inspections": [
            "Visual Inconsistencies & Edge Boundary Artifacts",
            "Compression Matrix Quantization Inconsistencies",
            "Frame-Level Blending Anomalies",
            "Temporal Optical Flow Jitter"
        ],
        "forensic_notice": (
            "Cryptographic SHA-256 hashes guarantee byte-level storage fidelity, but do not evaluate synthetic or "
            "deepfake manipulations. Advanced video authenticity analysis requires benchmarked neural architectures."
        )
    }

@router.post("/{evidence_id}/analyze")
def run_authenticity_scan(
    evidence_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    file_path = storage_service.get_evidence_path(ev.stored_filename)

    # Execute interface check
    result = authenticity_analyzer.analyze_video(str(file_path))

    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="AUTHENTICITY_SCAN_QUERY",
        resource_type="EVIDENCE",
        resource_id=ev.id,
        outcome="WARNING",
        details="Authenticity scan requested but neural detector is currently unconfigured."
    )

    return {
        "evidence_id": ev.id,
        "filename": ev.original_filename,
        "analysis_result": result.to_dict()
    }
