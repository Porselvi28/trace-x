import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_system_status():
    response = client.get("/api/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data["api_operational"] is True
    assert data["opencv_available"] is True
    assert data["ai_event_detector_configured"] is True
    assert data["authenticity_analyzer_configured"] is False  # unconfigured by forensic policy

def test_auth_login():
    response = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "adminpassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"

def test_case_management():
    # 1. Login to get token
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "adminpassword123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create case
    case_res = client.post("/api/cases", json={
        "title": "Automated Unit Test Investigation Case",
        "description": "Perimeter breach test suite",
        "category": "Physical Intrusion",
        "priority": "High"
    }, headers=headers)
    assert case_res.status_code == 201
    case_data = case_res.json()
    assert "TRX-CASE-" in case_data["id"]

    # 3. List cases
    list_res = client.get("/api/cases", headers=headers)
    assert list_res.status_code == 200
    assert any(c["id"] == case_data["id"] for c in list_res.json())

def test_evidence_upload_and_sha256():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "adminpassword123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create dummy video bytes
    dummy_video_bytes = b"TRACEX_FORENSIC_EVIDENCE_DUMMY_STREAM_BYTES_1234567890"
    file_payload = {
        "file": ("test_cctv_feed.mp4", io.BytesIO(dummy_video_bytes), "video/mp4")
    }
    data_payload = {
        "source_device": "CAM-01-ENTRY",
        "source_vendor": "Test DVR 4K",
        "auto_process": "false"
    }

    upload_res = client.post("/api/evidence/upload", files=file_payload, data=data_payload, headers=headers)
    assert upload_res.status_code == 201
    ev_data = upload_res.json()
    assert "sha256_hash" in ev_data
    assert len(ev_data["sha256_hash"]) == 64
    evidence_id = ev_data["id"]

    # Test integrity verification
    verify_res = client.post(f"/api/evidence/{evidence_id}/verify", headers=headers)
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["verification_status"] == "HASH MATCH"
    assert verify_data["current_hash"] == ev_data["sha256_hash"]

    # Test chain of custody records
    custody_res = client.get(f"/api/evidence/{evidence_id}/custody")
    assert custody_res.status_code == 200
    custody_data = custody_res.json()
    assert len(custody_data) >= 3  # UPLOADED, HASH_CALCULATED, INTEGRITY_VERIFIED

def test_natural_language_search():
    login_res = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "adminpassword123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    search_res = client.post("/api/search", json={
        "query": "Show events detected with intrusion or loitering"
    }, headers=headers)
    assert search_res.status_code == 200
    data = search_res.json()
    assert "matched_criteria" in data
    assert "Intrusion" in data["matched_criteria"]["parsed_filters"]["categories"]
