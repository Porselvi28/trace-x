from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import ChainOfCustody
from app.database.schemas import ChainOfCustodyOut

router = APIRouter(tags=["Chain of Custody"])

@router.get("/evidence/{evidence_id}/custody", response_model=List[ChainOfCustodyOut])
def get_evidence_custody_trail(evidence_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(ChainOfCustody)
        .filter(ChainOfCustody.evidence_id == evidence_id)
        .order_by(ChainOfCustody.timestamp.asc())
        .all()
    )
    return records

@router.get("/cases/{case_id}/custody", response_model=List[ChainOfCustodyOut])
def get_case_custody_trail(case_id: str, db: Session = Depends(get_db)):
    records = (
        db.query(ChainOfCustody)
        .filter(ChainOfCustody.case_id == case_id)
        .order_by(ChainOfCustody.timestamp.asc())
        .all()
    )
    return records

@router.get("/custody", response_model=List[ChainOfCustodyOut])
def list_all_custody_records(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ChainOfCustody)
        .order_by(ChainOfCustody.timestamp.desc())
        .limit(limit)
        .all()
    )
    return records
