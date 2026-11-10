from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.database.models import Case, Evidence, ProcessingJob, DetectedEvent, ChainOfCustody, EvidenceHash
from app.database.schemas import DashboardStatsOut
from typing import Dict, Any, List

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_cases = db.query(Case).count()
    total_evidence = db.query(Evidence).count()
    files_hashed = db.query(Evidence).filter(Evidence.sha256_hash != "").count()
    jobs_in_progress = db.query(ProcessingJob).filter(ProcessingJob.status.in_(["QUEUED", "PROCESSING"])).count()
    total_events = db.query(DetectedEvent).count()
    evidence_requiring_review = db.query(DetectedEvent).filter(
        DetectedEvent.investigator_review_status == "Pending Review"
    ).count()

    # Event category breakdown
    cat_counts = (
        db.query(DetectedEvent.event_category, func.count(DetectedEvent.id))
        .group_by(DetectedEvent.event_category)
        .all()
    )
    event_category_distribution = {cat: count for cat, count in cat_counts} if cat_counts else {
        "Intrusion": 0,
        "Loitering": 0,
        "Abandoned object": 0,
        "Fight or physical altercation": 0,
        "Accident": 0,
        "Suspicious activity": 0
    }

    # Evidence status breakdown
    status_counts = (
        db.query(Evidence.status, func.count(Evidence.id))
        .group_by(Evidence.status)
        .all()
    )
    evidence_status_distribution = {st: count for st, count in status_counts} if status_counts else {
        "Uploaded": 0,
        "Preprocessing": 0,
        "Processed": 0,
        "Processing Failed": 0
    }

    return {
        "total_cases": total_cases,
        "total_evidence": total_evidence,
        "files_hashed": files_hashed,
        "jobs_in_progress": jobs_in_progress,
        "total_events": total_events,
        "evidence_requiring_review": evidence_requiring_review,
        "event_category_distribution": event_category_distribution,
        "evidence_status_distribution": evidence_status_distribution
    }

@router.get("/activity")
def get_dashboard_activity(db: Session = Depends(get_db)):
    # Fetch recent custody actions
    recent_custody = (
        db.query(ChainOfCustody)
        .order_by(ChainOfCustody.timestamp.desc())
        .limit(10)
        .all()
    )
    
    # Fetch recent evidence uploads
    recent_evidence = (
        db.query(Evidence)
        .order_by(Evidence.created_at.desc())
        .limit(6)
        .all()
    )

    # Fetch recent candidate events
    recent_events = (
        db.query(DetectedEvent)
        .order_by(DetectedEvent.created_at.desc())
        .limit(6)
        .all()
    )

    return {
        "recent_custody": recent_custody,
        "recent_evidence": recent_evidence,
        "recent_events": recent_events
    }
