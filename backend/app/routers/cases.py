import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.connection import get_db
from app.database.models import Case, Evidence, DetectedEvent, User
from app.database.schemas import CaseCreate, CaseUpdate, CaseOut, EvidenceOut
from app.core.dependencies import get_current_user, require_role
from app.services.audit_service import audit_service

router = APIRouter(prefix="/cases", tags=["Investigation Cases"])

@router.get("", response_model=List[CaseOut])
def list_cases(
    search: Optional[str] = Query(None, description="Search cases by title or ID"),
    status: Optional[str] = Query(None, description="Filter by case status"),
    priority: Optional[str] = Query(None, description="Filter by case priority"),
    db: Session = Depends(get_db)
):
    query = db.query(Case)
    if search:
        query = query.filter(
            or_(
                Case.id.ilike(f"%{search}%"),
                Case.title.ilike(f"%{search}%"),
                Case.description.ilike(f"%{search}%")
            )
        )
    if status and status != "All":
        query = query.filter(Case.status == status)
    if priority and priority != "All":
        query = query.filter(Case.priority == priority)

    cases = query.order_by(Case.created_at.desc()).all()

    # Populate evidence and event counts dynamically
    results = []
    for c in cases:
        ev_count = db.query(Evidence).filter(Evidence.case_id == c.id).count()
        evts_count = db.query(DetectedEvent).filter(DetectedEvent.case_id == c.id).count()
        c_dict = CaseOut.from_orm(c)
        c_dict.evidence_count = ev_count
        c_dict.events_count = evts_count
        results.append(c_dict)

    return results

@router.post("", response_model=CaseOut, status_code=status.HTTP_201_CREATED)
def create_case(
    case_in: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    year = datetime.now(timezone.utc).strftime("%Y")
    random_suffix = uuid.uuid4().hex[:4].upper()
    case_id = f"TRX-CASE-{year}-{random_suffix}"

    new_case = Case(
        id=case_id,
        title=case_in.title.strip(),
        description=case_in.description,
        category=case_in.category,
        status=case_in.status,
        priority=case_in.priority,
        investigator_id=current_user.id,
        investigator_name=case_in.investigator_name or current_user.full_name,
        notes=case_in.notes,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="CASE_CREATED",
        resource_type="CASE",
        resource_id=new_case.id,
        outcome="SUCCESS",
        details=f"Case '{new_case.title}' created with priority {new_case.priority}"
    )

    out = CaseOut.from_orm(new_case)
    out.evidence_count = 0
    out.events_count = 0
    return out

@router.get("/{case_id}", response_model=CaseOut)
def get_case_detail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    ev_count = db.query(Evidence).filter(Evidence.case_id == case.id).count()
    evts_count = db.query(DetectedEvent).filter(DetectedEvent.case_id == case.id).count()
    out = CaseOut.from_orm(case)
    out.evidence_count = ev_count
    out.events_count = evts_count
    return out

@router.patch("/{case_id}", response_model=CaseOut)
def update_case(
    case_id: str,
    update_data: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["Administrator", "Investigator"]))
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    if update_data.title is not None:
        case.title = update_data.title.strip()
    if update_data.description is not None:
        case.description = update_data.description
    if update_data.category is not None:
        case.category = update_data.category
    if update_data.status is not None:
        case.status = update_data.status
    if update_data.priority is not None:
        case.priority = update_data.priority
    if update_data.investigator_name is not None:
        case.investigator_name = update_data.investigator_name
    if update_data.notes is not None:
        case.notes = update_data.notes

    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(case)

    audit_service.log_event(
        db=db,
        actor=current_user.username,
        action="CASE_UPDATED",
        resource_type="CASE",
        resource_id=case.id,
        outcome="SUCCESS",
        details=f"Case details updated (status={case.status}, priority={case.priority})"
    )

    ev_count = db.query(Evidence).filter(Evidence.case_id == case.id).count()
    evts_count = db.query(DetectedEvent).filter(DetectedEvent.case_id == case.id).count()
    out = CaseOut.from_orm(case)
    out.evidence_count = ev_count
    out.events_count = evts_count
    return out

@router.get("/{case_id}/evidence", response_model=List[EvidenceOut])
def get_case_evidence(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found")

    items = db.query(Evidence).filter(Evidence.case_id == case_id).order_by(Evidence.created_at.desc()).all()
    return items
