from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.database.connection import get_db, SessionLocal
from app.database.models import ProcessingJob, Evidence, User
from app.database.schemas import ProcessingJobOut
from app.core.dependencies import get_current_user, require_role
from app.services.processing_service import processing_service

router = APIRouter(tags=["Video Processing"])

def run_job_in_background(job_id: str, actor: str):
    db = SessionLocal()
    try:
        processing_service.process_evidence_sync(db, job_id, actor=actor)
    finally:
        db.close()

@router.post("/evidence/{evidence_id}/process", response_model=ProcessingJobOut, status_code=status.HTTP_202_ACCEPTED)
def start_video_processing(
    evidence_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    job = processing_service.create_job(db, evidence_id=ev.id, job_type="METADATA_AND_DETECTION")
    background_tasks.add_task(run_job_in_background, job.id, current_user.username)

    return job

@router.get("/jobs", response_model=List[ProcessingJobOut])
def list_all_jobs(limit: int = 15, db: Session = Depends(get_db)):
    """List recent processing jobs across all evidence."""
    jobs = (
        db.query(ProcessingJob)
        .order_by(ProcessingJob.created_at.desc())
        .limit(limit)
        .all()
    )
    return jobs

@router.get("/jobs/{job_id}", response_model=ProcessingJobOut)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
    return job

@router.get("/evidence/{evidence_id}/jobs", response_model=List[ProcessingJobOut])
def get_evidence_jobs(evidence_id: str, db: Session = Depends(get_db)):
    jobs = (
        db.query(ProcessingJob)
        .filter(ProcessingJob.evidence_id == evidence_id)
        .order_by(ProcessingJob.created_at.desc())
        .all()
    )
    return jobs
