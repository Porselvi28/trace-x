from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import DetectedEvent, Evidence, ChainOfCustody

class CorrelationService:
    @staticmethod
    def correlate_case_events(db: Session, case_id: str, proximity_window_seconds: int = 120) -> Dict[str, Any]:
        """
        Groups and correlates events across different camera feeds / evidence sources.
        Highlights temporal proximity clusters while declaring timestamp uncertainty.
        """
        # Fetch all evidence belonging to case
        evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()
        evidence_map = {ev.id: ev for ev in evidence_list}

        # Fetch all events belonging to case
        events = db.query(DetectedEvent).filter(DetectedEvent.case_id == case_id).order_by(DetectedEvent.start_timestamp.asc()).all()

        event_items = []
        for e in events:
            ev = evidence_map.get(e.evidence_id)
            source_device = ev.source_device if ev else "Unknown Device"
            orig_filename = ev.original_filename if ev else "Unknown Evidence"
            
            # Source recording base time if known
            recording_time_str = "Unsynchronized / Unknown Base Time"
            if ev and ev.recording_start:
                # Add relative offset to base
                est_time = ev.recording_start.timestamp() + e.start_timestamp
                recording_time_str = datetime.fromtimestamp(est_time).strftime("%Y-%m-%d %H:%M:%S")

            event_items.append({
                "id": e.id,
                "evidence_id": e.evidence_id,
                "evidence_filename": orig_filename,
                "source_device": source_device,
                "event_category": e.event_category,
                "start_timestamp": e.start_timestamp,
                "formatted_time": e.formatted_time,
                "frame_reference": e.frame_reference,
                "model_confidence": e.model_confidence,
                "detection_status": e.detection_status,
                "investigator_review_status": e.investigator_review_status,
                "estimated_recording_time": recording_time_str,
                "notes": e.review_notes
            })

        # Multi-camera correlation clusters:
        # Identify events occurring across different devices within proximity_window_seconds
        clusters = []
        visited = set()

        for i, ev_a in enumerate(event_items):
            if ev_a["id"] in visited:
                continue
            
            cluster_events = [ev_a]
            visited.add(ev_a["id"])

            for j, ev_b in enumerate(event_items):
                if ev_b["id"] in visited:
                    continue
                
                # Check if from different device and within time window
                diff = abs(ev_a["start_timestamp"] - ev_b["start_timestamp"])
                if diff <= proximity_window_seconds and ev_a["source_device"] != ev_b["source_device"]:
                    cluster_events.append(ev_b)
                    visited.add(ev_b["id"])

            if len(cluster_events) > 1:
                clusters.append({
                    "cluster_id": f"CLUST-{len(clusters)+1:02d}",
                    "participating_devices": list({ev["source_device"] for ev in cluster_events}),
                    "event_count": len(cluster_events),
                    "time_span_seconds": round(max(ev["start_timestamp"] for ev in cluster_events) - min(ev["start_timestamp"] for ev in cluster_events), 1),
                    "events": cluster_events,
                    "correlation_caveat": (
                        "Temporal proximity correlation identified across distinct camera feeds. "
                        "Forensic Notice: DVR clocks may lack NTP synchronization; temporal proximity "
                        "does not establish causal linkage without physical verification."
                    )
                })

        return {
            "case_id": case_id,
            "total_events_analyzed": len(event_items),
            "camera_feeds_count": len(evidence_map),
            "events": event_items,
            "correlation_clusters": clusters,
            "methodology_disclaimer": (
                "TRACE X Multi-Feed Correlation isolates temporal overlap patterns across independent DVR/NVR sources. "
                "CCTV clock drift between uncalibrated recorders requires manual investigator verification."
            )
        }

correlation_service = CorrelationService()
