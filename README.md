# TRACE X — AI-Powered Digital Evidence Intelligence & Forensic Reconstruction

> **"Digital Evidence. Intelligent Analysis. Verifiable Findings."**

TRACE X is a secure, cyber-forensic digital evidence intelligence and timeline reconstruction platform engineered for authorized investigators analyzing surveillance video evidence collected from multi-camera CCTV DVR/NVR systems.

---

## 🏛️ System Architecture Overview

```
                          ┌───────────────────────────────────────┐
                          │   TRACE X Forensic Web Workstation   │
                          │   (React + TypeScript + Tailwind CSS) │
                          └──────────────────┬────────────────────┘
                                             │ HTTP / JWT Auth
                                             ▼
                          ┌───────────────────────────────────────┐
                          │       FastAPI REST Core Engine        │
                          │        (Python 3.12 + Uvicorn)        │
                          └──────────────────┬────────────────────┘
                                             │
      ┌─────────────────────────┬────────────┴─────────────┬──────────────────────────┐
      ▼                         ▼                          ▼                          ▼
┌──────────────┐       ┌─────────────────┐       ┌────────────────────┐     ┌─────────────────────┐
│ Cryptographic│       │ Video Extraction│       │  AI Event Detector │     │  Forensic Reporting │
│ SHA-256 Hash │       │  & Processing   │       │  Modular Interface │     │   ReportLab PDF     │
│   Engine     │       │ (OpenCV / cv2)  │       │ (MOG2 Sentinel CV) │     │     Generation      │
└──────────────┘       └─────────────────┘       └────────────────────┘     └─────────────────────┘
      │                         │                          │                          │
      └─────────────────────────┼──────────────────────────┴──────────────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │    Forensic SQLite Ledger DB    │
               │  - Evidence & Bitwise Hashes    │
               │  - Append-Only Chain of Custody │
               │  - Candidate & Confirmed Events │
               │  - Cases & System Audit Logs    │
               └─────────────────────────────────┘
```

---

## ⚡ Key Features & Forensic Admissibility Standards

1. **Cryptographic SHA-256 Ingestion & Verification**:
   - Streaming SHA-256 hashing directly on byte upload.
   - Live "Verify Integrity" recalculation that detects bit-rot, filesystem alterations, or tampering.
   - Admissibility notice: Confirms bitwise storage parity; does not independently authenticate analog camera provenance.
2. **Append-Only Chain of Custody**:
   - Sequential, tamper-evident audit records linking actor, timestamp (UTC), action type, target file, and previous record references.
3. **OpenCV Video Deconstruction & Motion Sentinel**:
   - Direct extraction of duration, resolution, frame rate, and FourCC video codec via `cv2.VideoCapture`.
   - Representative keyframe extraction saved to derived forensic directories.
   - Real OpenCV background subtractor (`createBackgroundSubtractorMOG2`) contour motion detection triggering candidate event timestamps.
4. **Candidate vs. Confirmed Finding Distinction**:
   - Automated CV detections are strictly labeled **Candidate** until an investigator formally marks them **Confirmed** or **Rejected** with case notes.
5. **Natural-Language Evidence Search**:
   - Rule-based & regex semantic query parser supporting time ranges (e.g., "events after 8 PM", "between 10:00 and 10:30"), case IDs, event categories (intrusion, loitering, altercation), and integrity statuses.
6. **Unified Forensic Timeline & Event Correlation**:
   - Visual chronological reconstruction showing ingestion times, candidate media offsets, and custody handoffs.
   - Cross-camera correlation clustering events within temporal proximity windows (e.g. ±120s) across different DVR feeds with explicit notices regarding uncalibrated camera clocks.
7. **Modular AI Video Authenticity Analysis**:
   - Pluggable interface for deepfake and temporal synthetic manipulation analysis.
   - Complies with forensic guidelines: Explicitly reports "Authenticity analysis model is not configured" rather than generating fabricated conclusions.
8. **Court-Ready PDF Forensic Reports**:
   - Downloadable PDF briefs compiled using ReportLab with official case summaries, inventory, SHA-256 signatures, verification outcomes, timeline, and mandatory legal disclaimers.

---

## 📁 Repository Directory Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint & startup lifecycle
│   │   ├── core/
│   │   │   ├── config.py            # Environment settings and storage directory setup
│   │   │   ├── security.py          # Bcrypt password hashing & PyJWT token utilities
│   │   │   ├── dependencies.py      # Auth & Role-Based Access Control (RBAC) dependencies
│   │   │   └── logging_config.py    # Structured forensic application logger
│   │   ├── database/
│   │   │   ├── connection.py        # SQLAlchemy engine, session maker, Base
│   │   │   ├── models.py            # SQLite schema models (Cases, Evidence, Custody, Events, Reports)
│   │   │   └── schemas.py           # Pydantic v2 input/output validation schemas
│   │   ├── models/
│   │   │   ├── event_detector.py    # Modular EventDetector ABC + real OpenCV MOG2 Motion Sentinel
│   │   │   └── authenticity_analyzer.py # Pluggable Deepfake/Manipulation interface
│   │   ├── routers/
│   │   │   ├── auth.py              # Login, Registration, Current Profile (/api/auth)
│   │   │   ├── dashboard.py         # Real database statistics & activity stream (/api/dashboard)
│   │   │   ├── cases.py             # Investigation cases CRUD & search (/api/cases)
│   │   │   ├── evidence.py          # Evidence upload, stream hashing & downloads (/api/evidence)
│   │   │   ├── integrity.py         # Dynamic SHA-256 integrity recalculation (/api/evidence/{id}/verify)
│   │   │   ├── custody.py           # Chain of Custody ledger endpoints (/api/custody)
│   │   │   ├── processing.py        # Background video preprocessing jobs (/api/jobs)
│   │   │   ├── events.py            # Candidate event list & investigator review (/api/events)
│   │   │   ├── search.py            # Natural-language evidence search (/api/search)
│   │   │   ├── timeline.py          # Chronological reconstruction (/api/timeline)
│   │   │   ├── correlation.py       # Multi-camera temporal correlation (/api/correlation)
│   │   │   ├── authenticity.py      # Video authenticity analysis status & queries (/api/authenticity)
│   │   │   ├── reports.py           # Forensic PDF generation & download (/api/reports)
│   │   │   ├── audit.py             # Security audit logs (/api/audit-logs)
│   │   │   ├── system.py            # Health check & hardware diagnostics (/api/system/status)
│   │   │   └── users.py             # User access management (/api/users)
│   │   └── services/
│   │       ├── storage_service.py   # Sanitized file paths & upload size validation
│   │       ├── hashing_service.py   # Streaming 64KB chunk SHA-256 calculation & comparison
│   │       ├── video_service.py     # OpenCV metadata & keyframe extraction
│   │       ├── processing_service.py# Video pipeline orchestration & candidate generation
│   │       ├── search_service.py    # Rule-based natural-language query parser
│   │       ├── correlation_service.py # Multi-feed proximity clustering
│   │       ├── report_service.py    # ReportLab PDF brief compilation
│   │       ├── custody_service.py   # Append-only chain of custody recording
│   │       └── audit_service.py     # Application audit logging
│   ├── data/
│   │   ├── evidence/                # Secure original video storage
│   │   ├── frames/                  # Extracted derived keyframes
│   │   ├── reports/                 # Compiled PDF reports
│   │   └── tracex.db                # SQLite database
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py              # Automated test suite
│   ├── run_tests.py                 # Direct test runner
│   ├── create_sample_evidence.py    # Synthetic CCTV video generator for live demonstrations
│   ├── sample_cctv_feed.mp4         # 10s synthetic surveillance clip with moving intruder
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/ (AppLayout, Sidebar, Topbar)
│   │   │   └── common/ (StatusBadge, HashDisplay, StatCard)
│   │   ├── contexts/ (AuthContext, NotificationContext)
│   │   ├── pages/ (Login, Register, Dashboard, CasesList, CreateCase, CaseDetail,
│   │   │           EvidenceRepository, UploadEvidence, EvidenceDetail,
│   │   │           IntegrityVerification, ChainOfCustody, VideoAnalysis, EventReview,
│   │   │           NaturalLanguageSearch, ForensicTimeline, EventCorrelation,
│   │   │           AuthenticityAnalysis, Reports, AuditLogs, UserManagement, Settings, NotFound)
│   │   ├── services/ (api.ts - Axios client)
│   │   ├── types/ (index.ts - TypeScript interfaces)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env
└── README.md
```

---

## 🚀 Installation and Setup Instructions

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12.6)
- **Node.js v18+** (Tested on Node.js v24.18.0 / npm 11.7.0)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python requirements
pip install -r requirements.txt

# (Optional) Generate the sample demonstration CCTV video clip
python create_sample_evidence.py

# Run automated tests to verify API and cryptographic hashing
python run_tests.py

# Start the FastAPI backend server on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The interactive Swagger API documentation will be available at:
`http://127.0.0.1:8000/docs`

### 2. Frontend Setup
In a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already installed during initial build)
npm install

# Start the Vite development server
npm run dev
```
The TRACE X workstation will be live at:
`http://localhost:5173`

---

## 🔑 Default Accounts (1-Click Fill on Login)

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `adminpassword123` | Full administrative control, user RBAC management, audit log inspection |
| **Lead Investigator** | `investigator` | `investigator123` | Case creation, evidence upload, hash verification, candidate review, PDF report generation |

---

## 🧪 Demonstration Workflow for Project Evaluation

1. **Login**: Navigate to `http://localhost:5173/login`. Click **Administrator** or **Investigator** on the 1-Click Demo Fill button, and click **Authenticate Investigator Session**.
2. **Dashboard**: Observe the real-time KPIs, Recharts category distributions, and sequential chain-of-custody ledger.
3. **Inspect Seeded Case**: Navigate to **Cases** (`/cases`) to view `TRX-CASE-2026-001` (*Operation Iron Perimeter*).
4. **Ingest Evidence**:
   - Go to **Upload Evidence** (`/evidence/upload`).
   - Associate with `TRX-CASE-2026-001`.
   - Select the generated file `backend/sample_cctv_feed.mp4` (or any `.mp4`/`.avi` clip).
   - Enter Camera ID: `CAM-04-NORTH-GATE`. Keep **Automated Pipeline** enabled.
   - Click **Confirm & Ingest Evidence**.
5. **Cryptographic SHA-256 Verification**:
   - Open the ingested evidence detail page.
   - Click **Verify Cryptographic Integrity**.
   - Notice the streaming hash recalculation returning **HASH MATCH** with the official forensic disclaimer.
6. **Video Analysis & Candidate Event Detection**:
   - Navigate to **Video Analysis** (`/analysis`).
   - Inspect the extracted OpenCV keyframe strip sampled at 5-second intervals.
   - Note that the real OpenCV MOG2 Motion Sentinel detected the moving intruder silhouette at `+00:02` without simulated values.
7. **Investigator Review**:
   - Go to **Event Review** (`/events`).
   - Click **Confirm** on the candidate event and record investigator notes (e.g., *"Confirmed unauthorized crossing across fence perimeter"*).
8. **Natural-Language Search**:
   - Go to **Forensic Search** (`/search`).
   - Click a suggestion chip: `Show candidate intrusion events` or type `Find events with suspicious activity`.
   - Observe the structured filter breakdown and matched evidence records.
9. **Event Correlation & Timeline**:
   - Open **Timeline** (`/timeline`) to review chronological events.
   - Open **Event Correlation** (`/correlation`) to view multi-camera clusters.
10. **Compile Forensic PDF Report**:
    - Navigate to **Reports** (`/reports`).
    - Click **Compile Forensic Report**, select the case, and click **Generate Official Report**.
    - Click **Download PDF** to inspect the official court-ready report with cryptographic hashes, candidate events, and custody logs.

---

## 🔍 AI Capabilities Matrix

| Module | Operational Status | Underlying Architecture |
| :--- | :--- | :--- |
| **Video Motion Sentinel** | **Operational** | OpenCV BackgroundSubtractorMOG2 + Contour Area Thresholding |
| **Metadata Extraction** | **Operational** | OpenCV `cv2.VideoCapture` properties (FPS, Codec, Dimensions) |
| **Keyframe Sampling** | **Operational** | OpenCV Frame Ingestion & JPEG Compression |
| **Natural-Language Search** | **Operational** | Structured Regex & Semantic Lexical Parser |
| **Event Correlation** | **Operational** | Cross-Feed Multi-Sensor Temporal Sliding Window |
| **Object Detection (YOLOv8)** | *Modular Interface* | Pluggable interface (`DeepLearningObjectDetectorStub`) declaring unconfigured status |
| **Video Authenticity (Deepfake)** | *Modular Interface* | Pluggable interface (`PluggableAuthenticityAnalyzer`) declaring unconfigured status |

---

## 🔒 Forensic Security & Privacy Notice
- Storage paths are strictly isolated outside the public static root.
- User input filenames are never used directly as filesystem paths (safe UUID keys prevent directory traversal).
- Original evidence files remain read-only; analysis keyframes are stored in dedicated derived directories.
- Password hashes utilize salted `bcrypt` with work factor 12.
