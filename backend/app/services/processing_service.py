import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.models import ProcessingJob, Evidence, DetectedEvent
from app.services.video_service import video_service
from app.services.custody_service import custody_service
from app.services.audit_service import audit_service
from app.models.event_detector import OpenCVMotionSentinelDetector
from app.core.logging_config import logger

class ProcessingService:
    @staticmethod
    def create_job(db: Session, evidence_id: str, job_type: str = "METADATA_AND_DETECTION") -> ProcessingJob:
        job_id = f"TRX-JOB-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        job = ProcessingJob(
            id=job_id,
            evidence_id=evidence_id,
            job_type=job_type,
            status="QUEUED",
            progress=0,
            start_time=datetime.now(timezone.utc)
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def process_evidence_sync(db: Session, job_id: str, actor: str = "System Pipeline"):
        """
        Executes video preprocessing and AI event detection pipeline.
        Designed to be called synchronously or via background tasks.
        """
        job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if not job:
            return

        evidence = db.query(Evidence).filter(Evidence.id == job.evidence_id).first()
        if not evidence:
            job.status = "FAILED"
            job.error_message = "Associated evidence record not found"
            db.commit()
            return

        try:
            job.status = "PROCESSING"
            job.progress = 15
            evidence.status = "Preprocessing"
            db.commit()

            # Record custody action
            custody_service.record_custody_action(
                db=db,
                evidence_id=evidence.id,
                case_id=evidence.case_id,
                action_type="PREPROCESSING_STARTED",
                actor=actor,
                description=f"Automated video preprocessing and metadata extraction initiated (Job: {job.id})."
            )

            # Step 1: Extract Video Metadata via OpenCV
            meta = video_service.extract_metadata(evidence.file_path)
            evidence.duration_seconds = meta.get("duration_seconds", 0.0)
            evidence.width = meta.get("width", 0)
            evidence.height = meta.get("height", 0)
            evidence.fps = meta.get("fps", 0.0)
            evidence.codec = meta.get("codec", "unknown")
            
            job.progress = 40
            db.commit()

            # Step 2: Extract Representative Keyframes
            extracted_frames = video_service.extract_representative_frames(
                file_path=evidence.file_path,
                evidence_id=evidence.id,
                interval_seconds=5,
                max_frames=10
            )

            job.progress = 65
            db.commit()

            # Step 3: Run OpenCV Motion Sentinel AI Candidate Event Detection
            detector = OpenCVMotionSentinelDetector()
            candidate_events = detector.detect_video(evidence.file_path, evidence.id)

            added_count = 0
            for cand in candidate_events:
                evt_id = f"TRX-EVT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                evt_record = DetectedEvent(
                    id=evt_id,
                    evidence_id=evidence.id,
                    case_id=evidence.case_id,
                    event_category=cand.event_category,
                    start_timestamp=cand.start_timestamp,
                    end_timestamp=cand.end_timestamp,
                    formatted_time=cand.formatted_time,
                    frame_reference=cand.frame_reference or (extracted_frames[0]["frame_url"] if extracted_frames else None),
                    model_confidence=cand.model_confidence,
                    model_name=cand.model_name,
                    model_version=cand.model_version,
                    detection_status="Candidate",
                    investigator_review_status="Pending Review",
                    review_notes=cand.notes,
                    is_sample_data=False
                )
                db.add(evt_record)
                added_count += 1

            job.progress = 100
            job.status = "COMPLETED"
            job.completion_time = datetime.now(timezone.utc)
            job.result_summary = (
                f"Metadata extracted successfully. {len(extracted_frames)} keyframes captured. "
                f"{added_count} candidate events flagged by {detector.model_name}."
            )
            evidence.status = "Processed"
            db.commit()

            # Record custody and audit
            custody_service.record_custody_action(
                db=db,
                evidence_id=evidence.id,
                case_id=evidence.case_id,
                action_type="ANALYSIS_COMPLETED",
                actor=actor,
                description=f"Video preprocessing and automated event candidate analysis completed. Flagged {added_count} candidate events.",
                metadata_dict={
                    "duration": evidence.duration_seconds,
                    "resolution": f"{evidence.width}x{evidence.height}",
                    "frames_extracted": len(extracted_frames),
                    "candidates_flagged": added_count
                }
            )

            audit_service.log_event(
                db=db,
                actor=actor,
                action="VIDEO_PROCESSING_COMPLETED",
                resource_type="PROCESSING_JOB",
                resource_id=job.id,
                outcome="SUCCESS",
                details=job.result_summary
            )

        except Exception as e:
            logger.exception(f"Processing error in job {job_id}")
            job.status = "FAILED"
            job.completion_time = datetime.now(timezone.utc)
            job.error_message = str(e)
            evidence.status = "Processing Failed"
            db.commit()

            audit_service.log_event(
                db=db,
                actor=actor,
                action="VIDEO_PROCESSING_FAILED",
                resource_type="PROCESSING_JOB",
                resource_id=job.id,
                outcome="FAILURE",
                details=f"Processing failed: {str(e)}"
            )

processing_service = ProcessingService()
