import cv2
import os
from pathlib import Path
from typing import Dict, Any, List
from app.core.config import settings
from app.core.logging_config import logger

class VideoService:
    @staticmethod
    def extract_metadata(file_path: Path | str) -> Dict[str, Any]:
        """
        Extract video duration, resolution, fps, frame count, and codec using OpenCV.
        """
        path_str = str(file_path)
        cap = cv2.VideoCapture(path_str)
        
        if not cap.isOpened():
            logger.warning(f"Failed to open video file for metadata: {path_str}")
            return {
                "duration_seconds": 0.0,
                "width": 0,
                "height": 0,
                "fps": 0.0,
                "total_frames": 0,
                "codec": "unknown",
                "valid": False
            }

        fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        
        fourcc_int = int(cap.get(cv2.CAP_PROP_FOURCC) or 0)
        codec = "".join([chr((fourcc_int >> 8 * i) & 0xFF) for i in range(4)]).strip()
        if not codec:
            codec = "H264/AVC"

        duration = (total_frames / fps) if fps > 0 else 0.0
        cap.release()

        return {
            "duration_seconds": round(duration, 2),
            "width": width,
            "height": height,
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "codec": codec,
            "valid": True
        }

    @staticmethod
    def extract_representative_frames(
        file_path: Path | str,
        evidence_id: str,
        interval_seconds: int = 5,
        max_frames: int = 12
    ) -> List[Dict[str, Any]]:
        """
        Extract representative keyframes at regular intervals.
        Saves frames under settings.FRAMES_DIR.
        Returns list of metadata for extracted frames.
        """
        path_str = str(file_path)
        cap = cv2.VideoCapture(path_str)
        if not cap.isOpened():
            return []

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration = (total_frames / fps) if fps > 0 else 0.0

        extracted = []
        target_timestamps = []

        if duration <= 0:
            target_timestamps = [0.0]
        else:
            current_t = 0.0
            step = max(float(interval_seconds), duration / max_frames if duration > 0 else 5.0)
            while current_t < duration and len(target_timestamps) < max_frames:
                target_timestamps.append(current_t)
                current_t += step

        for t_sec in target_timestamps:
            target_frame_num = int(t_sec * fps)
            cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame_num)
            success, frame = cap.read()
            if success and frame is not None:
                # Resize if large to optimize storage and web preview
                h, w = frame.shape[:2]
                if w > 1280:
                    scale = 1280 / w
                    frame = cv2.resize(frame, (1280, int(h * scale)))

                frame_filename = f"{evidence_id}_sec_{int(t_sec):04d}.jpg"
                save_dest = settings.FRAMES_DIR / frame_filename
                cv2.imwrite(str(save_dest), frame, [cv2.IMWRITE_JPEG_QUALITY, 85])

                mins = int(t_sec // 60)
                secs = int(t_sec % 60)
                formatted_time = f"{mins:02d}:{secs:02d}"

                extracted.append({
                    "timestamp": round(t_sec, 2),
                    "formatted_time": formatted_time,
                    "frame_filename": frame_filename,
                    "frame_url": f"/api/evidence/frames/{frame_filename}"
                })

        cap.release()
        return extracted

video_service = VideoService()
