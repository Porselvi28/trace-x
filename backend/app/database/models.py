from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database.connection import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="Investigator")  # Administrator, Investigator, Viewer
    badge_number = Column(String(50), nullable=True)
    agency = Column(String(100), default="Digital Forensic Investigation Unit")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    cases = relationship("Case", back_populates="investigator_rel")


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(30), primary_key=True, index=True)  # TRX-CASE-YYYY-XXXX
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="Surveillance Audit")
    status = Column(String(30), default="Active")  # Active, Under Review, Archived, Closed
    priority = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    investigator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    investigator_name = Column(String(100), default="Lead Investigator")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    investigator_rel = relationship("User", back_populates="cases")
    evidence_items = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    events = relationship("DetectedEvent", back_populates="case")
    reports = relationship("GeneratedReport", back_populates="case")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(30), primary_key=True, index=True)  # TRX-EVD-YYYY-XXXX
    case_id = Column(String(30), ForeignKey("cases.id"), nullable=True, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), default="video/mp4")
    sha256_hash = Column(String(64), index=True, nullable=False)
    source_device = Column(String(100), default="CCTV-NVR-01")
    source_vendor = Column(String(100), default="Generic DVR")
    recording_start = Column(DateTime, nullable=True)
    recording_end = Column(DateTime, nullable=True)
    acquisition_notes = Column(Text, nullable=True)
    duration_seconds = Column(Float, default=0.0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    fps = Column(Float, default=0.0)
    codec = Column(String(50), default="unknown")
    status = Column(String(30), default="Uploaded")  # Uploaded, Preprocessing, Processed, Processing Failed
    uploaded_by = Column(String(100), default="System")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    case = relationship("Case", back_populates="evidence_items")
    hashes = relationship("EvidenceHash", back_populates="evidence", cascade="all, delete-orphan")
    jobs = relationship("ProcessingJob", back_populates="evidence", cascade="all, delete-orphan")
    events = relationship("DetectedEvent", back_populates="evidence", cascade="all, delete-orphan")
    custody_records = relationship("ChainOfCustody", back_populates="evidence", cascade="all, delete-orphan")


class EvidenceHash(Base):
    __tablename__ = "evidence_hashes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    evidence_id = Column(String(30), ForeignKey("evidence.id"), index=True, nullable=False)
    recorded_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=True)
    calculated_at = Column(DateTime, default=utcnow)
    verification_status = Column(String(30), default="UNVERIFIED")  # UNVERIFIED, HASH MATCH, HASH MISMATCH, VERIFICATION FAILED
    last_verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    evidence = relationship("Evidence", back_populates="hashes")


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(30), primary_key=True, index=True)  # TRX-JOB-YYYY-XXXX
    evidence_id = Column(String(30), ForeignKey("evidence.id"), index=True, nullable=False)
    job_type = Column(String(50), nullable=False)  # METADATA_EXTRACTION, FRAME_SAMPLING, AI_EVENT_DETECTION, AUTHENTICITY_SCAN
    status = Column(String(30), default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED
    progress = Column(Integer, default=0)
    start_time = Column(DateTime, nullable=True)
    completion_time = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    result_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    evidence = relationship("Evidence", back_populates="jobs")


class DetectedEvent(Base):
    __tablename__ = "detected_events"

    id = Column(String(30), primary_key=True, index=True)  # TRX-EVT-YYYY-XXXX
    evidence_id = Column(String(30), ForeignKey("evidence.id"), index=True, nullable=False)
    case_id = Column(String(30), ForeignKey("cases.id"), nullable=True, index=True)
    event_category = Column(String(50), nullable=False)  # Intrusion, Loitering, Abandoned object, Fight or physical altercation, Accident, Suspicious activity
    start_timestamp = Column(Float, nullable=False)  # Seconds in video
    end_timestamp = Column(Float, nullable=True)
    formatted_time = Column(String(30), default="00:00:00")
    frame_reference = Column(String(500), nullable=True)  # relative URL/path to keyframe
    model_confidence = Column(Float, nullable=True)
    model_name = Column(String(100), default="OpenCV Motion Sentinel")
    model_version = Column(String(50), default="1.0.0")
    detection_status = Column(String(30), default="Candidate")  # Candidate, Investigator Confirmed, Investigator Rejected
    investigator_review_status = Column(String(30), default="Pending Review")  # Pending Review, Confirmed, Rejected
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    is_sample_data = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    evidence = relationship("Evidence", back_populates="events")
    case = relationship("Case", back_populates="events")


class ChainOfCustody(Base):
    __tablename__ = "chain_of_custody"

    id = Column(String(30), primary_key=True, index=True)  # TRX-COC-YYYY-XXXX
    evidence_id = Column(String(30), ForeignKey("evidence.id"), index=True, nullable=False)
    case_id = Column(String(30), ForeignKey("cases.id"), nullable=True, index=True)
    action_type = Column(String(50), nullable=False)
    actor = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=utcnow)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    previous_record_ref = Column(String(30), nullable=True)

    evidence = relationship("Evidence", back_populates="custody_records")


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    query_text = Column(String(255), nullable=False)
    parsed_filters = Column(Text, nullable=True)
    result_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(String(30), primary_key=True, index=True)  # TRX-RPT-YYYY-XXXX
    case_id = Column(String(30), ForeignKey("cases.id"), index=True, nullable=False)
    report_title = Column(String(200), nullable=False)
    report_type = Column(String(50), default="FORENSIC_SUMMARY")
    generated_by = Column(String(100), default="Forensic Investigator")
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    status = Column(String(30), default="COMPLETED")
    summary_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    case = relationship("Case", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    actor = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    outcome = Column(String(20), default="SUCCESS")  # SUCCESS, FAILURE, WARNING
    timestamp = Column(DateTime, default=utcnow)
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
