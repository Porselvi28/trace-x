import re
from datetime import datetime, time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database.models import Evidence, DetectedEvent, Case, EvidenceHash

class SearchService:
    @staticmethod
    def parse_natural_language_query(query: str) -> Dict[str, Any]:
        """
        Extract structured filters from ordinary language query using regex and semantics.
        """
        filters: Dict[str, Any] = {
            "case_id_pattern": None,
            "categories": [],
            "review_status": None,
            "verification_status": None,
            "time_range": None,
            "keywords": []
        }
        q_lower = query.lower()

        # 1. Match Case ID patterns (e.g., "case 101", "case 1", "trx-case-2026-001")
        case_match = re.search(r"case\s*[-#]?\s*([a-zA-Z0-9_\-]+)", q_lower)
        if case_match:
            filters["case_id_pattern"] = case_match.group(1).upper()

        # 2. Match Event Categories
        category_map = {
            "intrusion": "Intrusion",
            "loitering": "Loitering",
            "abandoned": "Abandoned object",
            "fight": "Fight or physical altercation",
            "altercation": "Fight or physical altercation",
            "accident": "Accident",
            "collision": "Accident",
            "suspicious": "Suspicious activity",
            "motion": "Suspicious activity"
        }
        for kw, cat in category_map.items():
            if kw in q_lower and cat not in filters["categories"]:
                filters["categories"].append(cat)

        # 3. Match Review Status
        if "confirmed" in q_lower:
            filters["review_status"] = "Confirmed"
        elif "candidate" in q_lower or "unreviewed" in q_lower:
            filters["review_status"] = "Pending Review"
        elif "rejected" in q_lower:
            filters["review_status"] = "Rejected"

        # 4. Match Integrity / Hash Status
        if "failed" in q_lower or "mismatch" in q_lower:
            filters["verification_status"] = "HASH MISMATCH"
        elif "match" in q_lower or "verified" in q_lower:
            filters["verification_status"] = "HASH MATCH"

        # 5. Match Time Filters (e.g. "after 8 pm", "between 10:00 and 10:30")
        between_match = re.search(r"between\s+(\d{1,2}(?::\d{2})?)\s*(?:and|to)\s*(\d{1,2}(?::\d{2})?)", q_lower)
        if between_match:
            filters["time_range"] = {
                "type": "between",
                "start": between_match.group(1),
                "end": between_match.group(2)
            }
        else:
            after_match = re.search(r"after\s+(\d{1,2}(?::\d{2})?)\s*(am|pm)?", q_lower)
            if after_match:
                filters["time_range"] = {
                    "type": "after",
                    "time": after_match.group(1),
                    "meridiem": after_match.group(2) or "pm" if "pm" in q_lower else None
                }

        # 6. Extract remaining text tokens as general keywords
        tokens = re.findall(r"\b\w{3,}\b", q_lower)
        stopwords = {"show", "find", "evidence", "events", "associated", "with", "between", "after", "before", "from", "that"}
        filters["keywords"] = [t for t in tokens if t not in stopwords]

        return filters

    @staticmethod
    def execute_search(db: Session, query_str: str, explicit_case_id: str | None = None) -> Dict[str, Any]:
        """
        Executes query against Evidence and DetectedEvent tables.
        Returns matched records and matching criteria breakdown.
        """
        parsed = SearchService.parse_natural_language_query(query_str)
        matched_criteria = {
            "parsed_filters": parsed,
            "applied_conditions": []
        }

        # Evidence Query
        ev_query = db.query(Evidence)
        
        # Filter by Case
        target_case = explicit_case_id or parsed["case_id_pattern"]
        if target_case:
            ev_query = ev_query.filter(
                or_(
                    Evidence.case_id.ilike(f"%{target_case}%"),
                    Evidence.case_id == target_case
                )
            )
            matched_criteria["applied_conditions"].append(f"Case filter: {target_case}")

        # Filter by Hash verification status
        if parsed["verification_status"]:
            mismatched_evidence_ids = [
                h.evidence_id for h in db.query(EvidenceHash).filter(
                    EvidenceHash.verification_status == parsed["verification_status"]
                ).all()
            ]
            ev_query = ev_query.filter(Evidence.id.in_(mismatched_evidence_ids))
            matched_criteria["applied_conditions"].append(f"Integrity status: {parsed['verification_status']}")

        # Keyword filtering on evidence
        for kw in parsed["keywords"]:
            ev_query = ev_query.filter(
                or_(
                    Evidence.original_filename.ilike(f"%{kw}%"),
                    Evidence.source_device.ilike(f"%{kw}%"),
                    Evidence.source_vendor.ilike(f"%{kw}%"),
                    Evidence.acquisition_notes.ilike(f"%{kw}%")
                )
            )

        matched_evidence = ev_query.all()

        # Detected Events Query
        evt_query = db.query(DetectedEvent)
        
        if target_case:
            evt_query = evt_query.filter(
                or_(
                    DetectedEvent.case_id.ilike(f"%{target_case}%"),
                    DetectedEvent.case_id == target_case
                )
            )

        if parsed["categories"]:
            evt_query = evt_query.filter(DetectedEvent.event_category.in_(parsed["categories"]))
            matched_criteria["applied_conditions"].append(f"Categories: {', '.join(parsed['categories'])}")

        if parsed["review_status"]:
            evt_query = evt_query.filter(DetectedEvent.investigator_review_status == parsed["review_status"])
            matched_criteria["applied_conditions"].append(f"Review status: {parsed['review_status']}")

        matched_events = evt_query.all()

        # Format outputs
        return {
            "evidence_matches": matched_evidence,
            "event_matches": matched_events,
            "matched_criteria": matched_criteria,
            "query_text": query_str,
            "total_results": len(matched_evidence) + len(matched_events)
        }

search_service = SearchService()
