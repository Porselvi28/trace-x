import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import GeneratedReport, Case, User
from app.database.schemas import ReportGenerateRequest, ReportOut
from app.core.dependencies import get_current_user, require_role
from app.services.report_service import report_service
from app.services.audit_service import audit_service
from app.services.custody_service import custody_service

router = APIRouter(prefix="/reports", tags=["Forensic Reports"])

@router.get("", response_model=List[ReportOut])
def list_reports(case_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(GeneratedReport)
    if case_id:
        query = query.filter(GeneratedReport.case_id == case_id)
    return query.order_by(GeneratedReport.created_at.desc()).all()

@router.post("/generate", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def generate_report(
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    case = db.query(Case).filter(Case.id == req.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Target investigation case not found")

    try:
        report = report_service.generate_case_pdf_report(
            db=db,
            case_id=req.case_id,
            generated_by=current_user.full_name or current_user.username,
            report_title=req.report_title,
            summary_notes=req.summary_notes
        )

        audit_service.log_event(
            db=db,
            actor=current_user.username,
            action="REPORT_GENERATED",
            resource_type="REPORT",
            resource_id=report.id,
            outcome="SUCCESS",
            details=f"Forensic PDF report {report.id} generated for Case {case.id}"
        )

        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

@router.get("/{report_id}", response_model=ReportOut)
def get_report_detail(report_id: str, db: Session = Depends(get_db)):
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/{report_id}/download")
def download_pdf_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_path = report.file_path
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Report PDF file missing on server disk")

    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="REPORT_DOWNLOADED",
        resource_type="REPORT",
        resource_id=report.id,
        outcome="SUCCESS",
        details=f"PDF report {report.id} downloaded"
    )

    return FileResponse(
        path=pdf_path,
        filename=f"{report.id}.pdf",
        media_type="application/pdf"
    )
