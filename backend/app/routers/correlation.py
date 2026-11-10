from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Case
from app.services.correlation_service import correlation_service

router = APIRouter(prefix="/correlation", tags=["Event Correlation"])

@router.get("/{case_id}")
def get_case_correlation(
    case_id: str,
    proximity_seconds: int = Query(120, ge=10, le=1800),
    db: Session = Depends(get_db)
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return correlation_service.correlate_case_events(
        db=db,
        case_id=case_id,
        proximity_window_seconds=proximity_seconds
    )
