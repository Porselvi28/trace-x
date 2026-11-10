from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import SearchHistory, Evidence, User
from app.database.schemas import SearchQueryRequest, SearchResultOut, EvidenceOut, DetectedEventOut
from app.core.dependencies import get_current_user
from app.services.search_service import search_service

router = APIRouter(prefix="/search", tags=["Natural-Language Search"])

@router.post("", response_model=SearchResultOut)
def execute_natural_language_search(
    search_req: SearchQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = search_service.execute_search(
        db=db,
        query_str=search_req.query,
        explicit_case_id=search_req.case_id
    )

    # Save to SearchHistory
    history_entry = SearchHistory(
        user_id=current_user.id if current_user else None,
        query_text=search_req.query,
        parsed_filters=str(results["matched_criteria"]["parsed_filters"]),
        result_count=results["total_results"],
        created_at=datetime.now(timezone.utc)
    )
    db.add(history_entry)
    db.commit()

    ev_map = {ev.id: ev for ev in db.query(Evidence).all()}
    formatted_events = []
    for evt in results["event_matches"]:
        ev = ev_map.get(evt.evidence_id)
        out = DetectedEventOut.from_orm(evt)
        out.evidence_filename = ev.original_filename if ev else None
        out.source_device = ev.source_device if ev else None
        formatted_events.append(out)

    return {
        "evidence_matches": results["evidence_matches"],
        "event_matches": formatted_events,
        "matched_criteria": results["matched_criteria"],
        "query_text": results["query_text"],
        "total_results": results["total_results"]
    }

@router.get("/history")
def get_search_history(db: Session = Depends(get_db)):
    history = db.query(SearchHistory).order_by(SearchHistory.created_at.desc()).limit(15).all()
    return history
