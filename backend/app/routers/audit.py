from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import AuditLog
from app.database.schemas import AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_logs(
    resource_type: Optional[str] = Query(None),
    outcome: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if resource_type and resource_type != "All":
        query = query.filter(AuditLog.resource_type == resource_type)
    if outcome and outcome != "All":
        query = query.filter(AuditLog.outcome == outcome)

    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
