from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import cv2
import numpy as np
from pathlib import Path
from app.core.config import settings
from app.core.logging_config import logger

class CandidateEvent:
    def __init__(
        self,
        event_category: str,
        start_timestamp: float,
        end_timestamp: Optional[float],
        formatted_time: str,
        frame_reference: Optional[str],
        model_confidence: Optional[float],
        model_name: str,
        model_version: str,
        notes: str
    ):
        self.event_category = event_category
        self.start_timestamp = start_timestamp
        self.end_timestamp = end_timestamp
        self.formatted_time = formatted_time
        self.frame_reference = frame_reference
        self.model_confidence = model_confidence
        self.model_name = model_name
        self.model_version = model_version
        self.notes = notes

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_category": self.event_category,
            "start_timestamp": round(self.start_timestamp, 2),
            "end_timestamp": round(self.end_timestamp, 2) if self.end_timestamp else None,
            "formatted_time": self.formatted_time,
            "frame_reference": self.frame_reference,
            "model_confidence": round(self.model_confidence, 3) if self.model_confidence else None,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "notes": self.notes
        }


class BaseEventDetector(ABC):
    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        pass

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    def detect_video(self, video_path: str, evidence_id: str) -> List[CandidateEvent]:
        pass


class OpenCVMotionSentinelDetector(BaseEventDetector):
    """
    Real OpenCV computer-vision inference engine using background subtraction (MOG2)
    and contour area analysis to detect suspicious motion and perimeter activity.
    Produces real candidate events based on actual video frame contents.
    """
    @property
    def model_name(self) -> str:
        return "OpenCV Background Subtractor MOG2"

    @property
    def model_version(self) -> str:
        return f"cv2-{cv2.__version__}-mog2-sentinel"

    @property
    def is_configured(self) -> bool:
        return True

    def detect_video(self, video_path: str, evidence_id: str) -> List[CandidateEvent]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Cannot open video for detection: {video_path}")
            return []

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        
        # MOG2 background subtractor
        fgbg = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=36, detectShadows=True)
        
        candidates: List[CandidateEvent] = []
        frame_idx = 0
        min_contour_area = 400  # Minimum pixel area for surveillance motion trigger
        
        # Track intervals of significant activity
        in_activity = False
        activity_start_time = 0.0
        peak_confidence = 0.0
        best_frame_ref = None
        
        # Sample every few frames for computational efficiency
        sample_stride = max(1, int(fps // 5))  # ~5 checks per second
        
        while cap.isOpened() and frame_idx < total_frames:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            current_time_sec = frame_idx / fps
            
            # Preprocessing: resize for detection & grayscale blur
            h, w = frame.shape[:2]
            small_w = 640
            scale = small_w / w
            small_frame = cv2.resize(frame, (small_w, int(h * scale)))
            
            fgmask = fgbg.apply(small_frame)
            # Remove shadows (value 127 in MOG2)
            _, thresh = cv2.threshold(fgmask, 200, 255, cv2.THRESH_BINARY)
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_DILATE, kernel)

            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            max_area = 0
            for c in contours:
                area = cv2.contourArea(c)
                if area > max_area:
                    max_area = area

            # Activity threshold condition
            has_activity = max_area > min_contour_area
            activity_ratio = min(1.0, max_area / (small_w * int(h * scale) * 0.25))

            if has_activity:
                if not in_activity:
                    in_activity = True
                    activity_start_time = current_time_sec
                    peak_confidence = 0.5 + (0.45 * activity_ratio)
                    
                    # Save annotated detection keyframe
                    annotated = frame.copy()
                    for c in contours:
                        if cv2.contourArea(c) > min_contour_area:
                            x, y, cw, ch = cv2.boundingRect(c)
                            # Rescale back to original resolution
                            x_orig = int(x / scale)
                            y_orig = int(y / scale)
                            cw_orig = int(cw / scale)
                            ch_orig = int(ch / scale)
                            cv2.rectangle(annotated, (x_orig, y_orig), (x_orig + cw_orig, y_orig + ch_orig), (0, 230, 255), 2)
                            cv2.putText(
                                annotated,
                                "CANDIDATE EVENT (CV2 MOG2)",
                                (x_orig, max(20, y_orig - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.6,
                                (0, 230, 255),
                                2
                            )
                    
                    frame_filename = f"{evidence_id}_evt_{int(current_time_sec):04d}.jpg"
                    save_path = settings.FRAMES_DIR / frame_filename
                    cv2.imwrite(str(save_path), annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
                    best_frame_ref = f"/api/evidence/frames/{frame_filename}"
                else:
                    if activity_ratio > peak_confidence:
                        peak_confidence = min(0.95, 0.5 + (0.45 * activity_ratio))
            else:
                if in_activity:
                    # Activity ended, close candidate window
                    duration = current_time_sec - activity_start_time
                    if duration >= 0.5:  # filter momentary noise
                        mins = int(activity_start_time // 60)
                        secs = int(activity_start_time % 60)
                        
                        # Categorize based on duration & activity characteristics
                        if duration > 8.0:
                            category = "Loitering"
                            note = f"Sustained motion pattern observed for {duration:.1f}s in monitored field of view."
                        else:
                            category = "Suspicious activity"
                            note = f"Dynamic displacement detected exceeding area threshold ({int(max_area)} px)."

                        candidates.append(CandidateEvent(
                            event_category=category,
                            start_timestamp=activity_start_time,
                            end_timestamp=current_time_sec,
                            formatted_time=f"{mins:02d}:{secs:02d}",
                            frame_reference=best_frame_ref,
                            model_confidence=peak_confidence,
                            model_name=self.model_name,
                            model_version=self.model_version,
                            notes=note
                        ))
                    in_activity = False

            frame_idx += sample_stride

        # Close any active event at end of video
        if in_activity:
            duration = (total_frames / fps) - activity_start_time
            mins = int(activity_start_time // 60)
            secs = int(activity_start_time % 60)
            candidates.append(CandidateEvent(
                event_category="Suspicious activity",
                start_timestamp=activity_start_time,
                end_timestamp=total_frames / fps,
                formatted_time=f"{mins:02d}:{secs:02d}",
                frame_reference=best_frame_ref,
                model_confidence=peak_confidence,
                model_name=self.model_name,
                model_version=self.model_version,
                notes=f"Active movement detected until end of sequence ({duration:.1f}s)."
            ))

        cap.release()
        return candidates


class DeepLearningObjectDetectorStub(BaseEventDetector):
    """
    Pluggable integration adapter for advanced deep learning models
    (e.g., YOLOv8, Faster R-CNN, SlowFast altercation detector).
    Explicitly reports that it is not configured if weights are unavailable.
    """
    @property
    def model_name(self) -> str:
        return "YOLOv8-Forensic-Perimeter"

    @property
    def model_version(self) -> str:
        return "v8.1.0-unconfigured"

    @property
    def is_configured(self) -> bool:
        return False

    def detect_video(self, video_path: str, evidence_id: str) -> List[CandidateEvent]:
        # Respect requirement: Do not invent detections if model is unavailable
        logger.info("Deep learning model interface called but weights are not configured.")
        return []
