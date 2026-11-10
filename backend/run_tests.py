import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from tests.test_api import (
    test_health_check,
    test_system_status,
    test_auth_login,
    test_case_management,
    test_evidence_upload_and_sha256,
    test_natural_language_search
)

def run():
    print("=" * 60)
    print("TRACE X — AUTOMATED TEST SUITE EXECUTION")
    print("=" * 60)
    
    tests = [
        ("Health Check Endpoint", test_health_check),
        ("Forensic System Diagnostic Status", test_system_status),
        ("Administrator JWT Authentication", test_auth_login),
        ("Case Creation & Case Management", test_case_management),
        ("Evidence Ingestion, Streaming SHA-256 & Verification", test_evidence_upload_and_sha256),
        ("Structured Natural-Language Search Parsing", test_natural_language_search),
    ]
    
    passed = 0
    for name, func in tests:
        try:
            func()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name} -> {e}")
            raise e
            
    print("=" * 60)
    print(f"RESULTS: {passed}/{len(tests)} tests passed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run()
