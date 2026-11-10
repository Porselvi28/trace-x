from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Case, Evidence, DetectedEvent, ChainOfCustody

router = APIRouter(prefix="/timeline", tags=["Forensic Timeline"])

@router.get("")
def get_forensic_timeline(
    case_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Constructs unified forensic chronological timeline.
    Distinguishes:
    - Evidence Upload time
    - Cryptographic verification events
    - Extracted media candidate events
    - Investigator confirmed findings
    - Chain of custody handoffs
    """
    timeline_items = []

    # 1. Fetch custody actions
    custody_q = db.query(ChainOfCustody)
    if case_id:
        custody_q = custody_q.filter(ChainOfCustody.case_id == case_id)
    for c in custody_q.all():
        timeline_items.append({
            "id": c.id,
            "timestamp": c.timestamp.isoformat(),
            "time_type": "SYSTEM_AUDIT_TIME",
            "entry_type": "CUSTODY_ACTION",
            "title": f"Custody: {c.action_type.replace('_', ' ')}",
            "description": c.description,
            "actor": c.actor,
            "case_id": c.case_id,
            "evidence_id": c.evidence_id,
            "category": "Custody & Integrity",
            "severity": "info"
        })

    # 2. Fetch Evidence Upload records
    ev_q = db.query(Evidence)
    if case_id:
        ev_q = ev_q.filter(Evidence.case_id == case_id)
    for ev in ev_q.all():
        timeline_items.append({
            "id": f"UPLOAD-{ev.id}",
            "timestamp": ev.created_at.isoformat(),
            "time_type": "INGESTION_TIMESTAMP",
            "entry_type": "EVIDENCE_INGESTION",
            "title": f"Evidence Ingested: {ev.original_filename}",
            "description": f"Source: {ev.source_device} ({ev.source_vendor}). Hash: {ev.sha256_hash[:16]}...",
            "actor": ev.uploaded_by,
            "case_id": ev.case_id,
            "evidence_id": ev.id,
            "category": "Evidence Acquisition",
            "severity": "highlight"
        })

    # 3. Fetch Detected Events
    evt_q = db.query(DetectedEvent)
    if case_id:
        evt_q = evt_q.filter(DetectedEvent.case_id == case_id)
    if category and category != "All":
        evt_q = evt_q.filter(DetectedEvent.event_category == category)

    for evt in evt_q.all():
        ev = db.query(Evidence).filter(Evidence.id == evt.evidence_id).first()
        time_label = f"Offset +{evt.formatted_time}"
        timeline_items.append({
            "id": evt.id,
            "timestamp": evt.created_at.isoformat(),
            "video_offset_seconds": evt.start_timestamp,
            "video_formatted_time": evt.formatted_time,
            "time_type": "MEDIA_EVENT_OFFSET",
            "entry_type": "DETECTED_EVENT",
            "title": f"{evt.event_category} ({evt.investigator_review_status})",
            "description": f"Flagged by {evt.model_name}. {evt.review_notes or ''}",
            "actor": evt.reviewed_by or "Automated Sentinel",
            "case_id": evt.case_id,
            "evidence_id": evt.evidence_id,
            "source_device": ev.source_device if ev else "Unknown",
            "frame_reference": evt.frame_reference,
            "category": evt.event_category,
            "severity": "warning" if evt.investigator_review_status == "Confirmed" else "candidate"
        })

    # Sort chronologically by timestamp
    timeline_items.sort(key=lambda x: x["timestamp"], reverse=True)
    return timeline_items
