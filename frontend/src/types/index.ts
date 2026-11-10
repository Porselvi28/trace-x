export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'Administrator' | 'Investigator' | 'Viewer';
  badge_number?: string;
  agency?: string;
  is_active: boolean;
  created_at: string;
}

export interface Case {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'Active' | 'Under Review' | 'Archived' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  investigator_id?: number;
  investigator_name: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  evidence_count?: number;
  events_count?: number;
}

export interface Evidence {
  id: string;
  case_id?: string;
  original_filename: string;
  stored_filename: string;
  file_size: number;
  mime_type: string;
  sha256_hash: string;
  source_device: string;
  source_vendor: string;
  recording_start?: string;
  recording_end?: string;
  acquisition_notes?: string;
  duration_seconds: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  status: 'Uploaded' | 'Preprocessing' | 'Processed' | 'Processing Failed';
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  last_verified_status?: 'UNVERIFIED' | 'HASH MATCH' | 'HASH MISMATCH' | 'VERIFICATION FAILED';
}

export interface VerificationResult {
  evidence_id: string;
  recorded_hash: string;
  current_hash: string;
  verification_status: 'HASH MATCH' | 'HASH MISMATCH' | 'VERIFICATION FAILED';
  verified_at: string;
  verified_by: string;
  forensic_disclaimer: string;
}

export interface DetectedEvent {
  id: string;
  evidence_id: string;
  case_id?: string;
  evidence_filename?: string;
  source_device?: string;
  event_category: string;
  start_timestamp: number;
  end_timestamp?: number;
  formatted_time: string;
  frame_reference?: string;
  model_confidence?: number;
  model_name: string;
  model_version: string;
  detection_status: string;
  investigator_review_status: 'Pending Review' | 'Confirmed' | 'Rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  is_sample_data: boolean;
  created_at: string;
}

export interface ChainOfCustody {
  id: string;
  evidence_id: string;
  case_id?: string;
  action_type: string;
  actor: string;
  timestamp: string;
  description: string;
  metadata_json?: string;
  previous_record_ref?: string;
}

export interface ProcessingJob {
  id: string;
  evidence_id: string;
  job_type: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  start_time?: string;
  completion_time?: string;
  error_message?: string;
  result_summary?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'WARNING';
  timestamp: string;
  ip_address?: string;
  details?: string;
}

export interface GeneratedReport {
  id: string;
  case_id: string;
  report_title: string;
  report_type: string;
  generated_by: string;
  file_path: string;
  file_size: number;
  status: string;
  summary_notes?: string;
  created_at: string;
}

export interface DashboardStats {
  total_cases: number;
  total_evidence: number;
  files_hashed: number;
  jobs_in_progress: number;
  total_events: number;
  evidence_requiring_review: number;
  event_category_distribution: Record<string, number>;
  evidence_status_distribution: Record<string, number>;
}

export interface SystemStatus {
  api_operational: boolean;
  database_connected: boolean;
  opencv_available: boolean;
  opencv_version?: string;
  ffmpeg_available: boolean;
  ai_event_detector_configured: boolean;
  authenticity_analyzer_configured: boolean;
  storage_writable: boolean;
  app_version: string;
  environment: string;
}

export interface SearchResult {
  evidence_matches: Evidence[];
  event_matches: DetectedEvent[];
  matched_criteria: {
    parsed_filters: {
      case_id_pattern?: string;
      categories: string[];
      review_status?: string;
      verification_status?: string;
      time_range?: any;
      keywords: string[];
    };
    applied_conditions: string[];
  };
  query_text: string;
  total_results: number;
}
