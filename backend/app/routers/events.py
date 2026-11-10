from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import DetectedEvent, Evidence, User
from app.database.schemas import DetectedEventOut, DetectedEventReviewUpdate
from app.core.dependencies import get_current_user, require_role
from app.services.audit_service import audit_service

router = APIRouter(prefix="/events", tags=["Event Detection & Review"])

@router.get("", response_model=List[DetectedEventOut])
def list_detected_events(
    case_id: Optional[str] = Query(None),
    evidence_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    review_status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(DetectedEvent)
    if case_id:
        query = query.filter(DetectedEvent.case_id == case_id)
    if evidence_id:
        query = query.filter(DetectedEvent.evidence_id == evidence_id)
    if category and category != "All":
        query = query.filter(DetectedEvent.event_category == category)
    if review_status and review_status != "All":
        query = query.filter(DetectedEvent.investigator_review_status == review_status)

    events = query.order_by(DetectedEvent.start_timestamp.asc()).all()

    # Pre-fetch evidence records for display names
    ev_map = {ev.id: ev for ev in db.query(Evidence).all()}
    
    results = []
    for evt in events:
        ev = ev_map.get(evt.evidence_id)
        out = DetectedEventOut.from_orm(evt)
        out.evidence_filename = ev.original_filename if ev else None
        out.source_device = ev.source_device if ev else None
        results.append(out)

    return results

@router.get("/{event_id}", response_model=DetectedEventOut)
def get_event_detail(event_id: str, db: Session = Depends(get_db)):
    evt = db.query(DetectedEvent).filter(DetectedEvent.id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail=f"Event '{event_id}' not found")

    ev = db.query(Evidence).filter(Evidence.id == evt.evidence_id).first()
    out = DetectedEventOut.from_orm(evt)
    out.evidence_filename = ev.original_filename if ev else None
    out.source_device = ev.source_device if ev else None
    return out

@router.patch("/{event_id}/review", response_model=DetectedEventOut)
def review_detected_event(
    event_id: str,
    review_in: DetectedEventReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    evt = db.query(DetectedEvent).filter(DetectedEvent.id == event_id).first()
    if not evt:
        raise HTTPException(status_code=404, detail="Event not found")

    status_val = review_in.investigator_review_status
    if status_val not in ["Confirmed", "Rejected", "Pending Review"]:
        raise HTTPException(status_code=400, detail="Invalid review status. Must be 'Confirmed' or 'Rejected'")

    evt.investigator_review_status = status_val
    evt.detection_status = f"Investigator {status_val}"
    evt.reviewed_by = current_user.username
    evt.reviewed_at = datetime.now(timezone.utc)
    if review_in.review_notes:
        evt.review_notes = review_in.review_notes

    db.commit()
    db.refresh(evt)

    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="EVENT_REVIEW_UPDATED",
        resource_type="DETECTED_EVENT",
        resource_id=evt.id,
        outcome="SUCCESS",
        details=f"Event {evt.id} marked as {status_val} by {current_user.username}"
    )

    ev = db.query(Evidence).filter(Evidence.id == evt.evidence_id).first()
    out = DetectedEventOut.from_orm(evt)
    out.evidence_filename = ev.original_filename if ev else None
    out.source_device = ev.source_device if ev else None
    return out
