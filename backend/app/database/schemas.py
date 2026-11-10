from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# --- AUTH SCHEMAS ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = "Investigator"
    badge_number: Optional[str] = None
    agency: Optional[str] = "Digital Forensic Investigation Unit"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserUpdateRole(BaseModel):
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- CASE SCHEMAS ---
class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "Surveillance Audit"
    status: str = "Active"
    priority: str = "Medium"
    investigator_name: Optional[str] = "Lead Investigator"
    notes: Optional[str] = None

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    investigator_name: Optional[str] = None
    notes: Optional[str] = None

class CaseOut(CaseBase):
    id: str
    investigator_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    evidence_count: Optional[int] = 0
    events_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- EVIDENCE SCHEMAS ---
class EvidenceBase(BaseModel):
    case_id: Optional[str] = None
    source_device: str = "CCTV-NVR-01"
    source_vendor: str = "Generic DVR"
    recording_start: Optional[datetime] = None
    recording_end: Optional[datetime] = None
    acquisition_notes: Optional[str] = None

class EvidenceCreate(EvidenceBase):
    pass

class EvidenceOut(EvidenceBase):
    id: str
    original_filename: str
    stored_filename: str
    file_size: int
    mime_type: str
    sha256_hash: str
    duration_seconds: float = 0.0
    width: int = 0
    height: int = 0
    fps: float = 0.0
    codec: str = "unknown"
    status: str
    uploaded_by: str
    created_at: datetime
    updated_at: datetime
    last_verified_status: Optional[str] = "UNVERIFIED"

    class Config:
        from_attributes = True

class EvidenceVerificationOut(BaseModel):
    evidence_id: str
    recorded_hash: str
    current_hash: str
    verification_status: str  # HASH MATCH, HASH MISMATCH, VERIFICATION FAILED
    verified_at: datetime
    verified_by: str
    forensic_disclaimer: str

# --- CHAIN OF CUSTODY SCHEMAS ---
class ChainOfCustodyOut(BaseModel):
    id: str
    evidence_id: str
    case_id: Optional[str] = None
    action_type: str
    actor: str
    timestamp: datetime
    description: str
    metadata_json: Optional[str] = None
    previous_record_ref: Optional[str] = None

    class Config:
        from_attributes = True

# --- PROCESSING JOB SCHEMAS ---
class ProcessingJobOut(BaseModel):
    id: str
    evidence_id: str
    job_type: str
    status: str
    progress: int
    start_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    error_message: Optional[str] = None
    result_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- DETECTED EVENT SCHEMAS ---
class DetectedEventBase(BaseModel):
    event_category: str
    start_timestamp: float
    end_timestamp: Optional[float] = None
    formatted_time: str
    frame_reference: Optional[str] = None
    model_confidence: Optional[float] = None
    model_name: str
    model_version: str
    detection_status: str = "Candidate"
    investigator_review_status: str = "Pending Review"
    review_notes: Optional[str] = None

class DetectedEventReviewUpdate(BaseModel):
    investigator_review_status: str  # Confirmed, Rejected
    review_notes: Optional[str] = None

class DetectedEventOut(DetectedEventBase):
    id: str
    evidence_id: str
    case_id: Optional[str] = None
    evidence_filename: Optional[str] = None
    source_device: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    is_sample_data: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- SEARCH SCHEMAS ---
class SearchQueryRequest(BaseModel):
    query: str
    case_id: Optional[str] = None
    event_category: Optional[str] = None
    status: Optional[str] = None

class SearchResultOut(BaseModel):
    evidence_matches: List[EvidenceOut]
    event_matches: List[DetectedEventOut]
    matched_criteria: Dict[str, Any]
    query_text: str
    total_results: int

# --- REPORT SCHEMAS ---
class ReportGenerateRequest(BaseModel):
    case_id: str
    report_title: Optional[str] = None
    include_ai_findings: bool = True
    include_custody: bool = True
    summary_notes: Optional[str] = None

class ReportOut(BaseModel):
    id: str
    case_id: str
    report_title: str
    report_type: str
    generated_by: str
    file_path: str
    file_size: int
    status: str
    summary_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- AUDIT LOG SCHEMAS ---
class AuditLogOut(BaseModel):
    id: int
    actor: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    outcome: str
    timestamp: datetime
    ip_address: Optional[str] = None
    details: Optional[str] = None

    class Config:
        from_attributes = True

# --- DASHBOARD & SYSTEM SCHEMAS ---
class DashboardStatsOut(BaseModel):
    total_cases: int
    total_evidence: int
    files_hashed: int
    jobs_in_progress: int
    total_events: int
    evidence_requiring_review: int
    event_category_distribution: Dict[str, int]
    evidence_status_distribution: Dict[str, int]

class SystemStatusOut(BaseModel):
    api_operational: bool
    database_connected: bool
    opencv_available: bool
    opencv_version: Optional[str] = None
    ffmpeg_available: bool
    ai_event_detector_configured: bool
    authenticity_analyzer_configured: bool
    storage_writable: bool
    app_version: str
    environment: str
