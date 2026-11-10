import json
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.models import ChainOfCustody

class CustodyService:
    @staticmethod
    def record_custody_action(
        db: Session,
        evidence_id: str,
        action_type: str,
        actor: str,
        description: str,
        case_id: str | None = None,
        metadata_dict: dict | None = None
    ) -> ChainOfCustody:
        """
        Appends a chain-of-custody entry for an evidence item.
        Maintains reference to previous custody record for linkage.
        """
        # Find the latest custody record for this evidence to link previous_record_ref
        last_record = (
            db.query(ChainOfCustody)
            .filter(ChainOfCustody.evidence_id == evidence_id)
            .order_by(ChainOfCustody.timestamp.desc())
            .first()
        )
        prev_ref = last_record.id if last_record else None

        custody_id = f"TRX-COC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        record = ChainOfCustody(
            id=custody_id,
            evidence_id=evidence_id,
            case_id=case_id,
            action_type=action_type,
            actor=actor,
            timestamp=datetime.now(timezone.utc),
            description=description,
            metadata_json=json.dumps(metadata_dict) if metadata_dict else None,
            previous_record_ref=prev_ref
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

custody_service = CustodyService()
