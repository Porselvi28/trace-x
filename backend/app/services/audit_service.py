from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.models import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        actor: str,
        action: str,
        resource_type: str,
        resource_id: str | None = None,
        outcome: str = "SUCCESS",
        details: str | None = None,
        ip_address: str | None = None
    ) -> AuditLog:
        """
        Record application-level audit log entry.
        Note: Documented limitation: This is an application-level operational audit log.
        """
        log_entry = AuditLog(
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            outcome=outcome,
            timestamp=datetime.now(timezone.utc),
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

audit_service = AuditService()
