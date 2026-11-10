import cv2
import numpy as np
from pathlib import Path
from datetime import datetime

def generate_sample_cctv_clip(output_path: str = "sample_cctv_feed.mp4", duration_sec: int = 10, fps: int = 25):
    """
    Generates a realistic test surveillance CCTV video clip using OpenCV.
    Includes timecode overlay, camera ID, and an animated moving intruder silhouette
    to demonstrate real OpenCV background subtraction (MOG2) candidate event detection.
    """
    width, height = 640, 360
    total_frames = duration_sec * fps
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # Base background: Dim courtyard / industrial perimeter
    base_bg = np.full((height, width, 3), (35, 40, 45), dtype=np.uint8)
    
    # Add static background features (fence grid lines, wall, ground)
    cv2.rectangle(base_bg, (0, 240), (width, height), (50, 55, 60), -1)  # ground
    cv2.rectangle(base_bg, (0, 100), (width, 240), (40, 45, 50), -1)   # wall
    # Fence lines
    for x in range(0, width, 40):
        cv2.line(base_bg, (x, 100), (x, 240), (70, 75, 80), 1)
    
    # Moving object parameters (intruder moving across screen between sec 2 and sec 8)
    for frame_idx in range(total_frames):
        frame = base_bg.copy()
        time_sec = frame_idx / fps
        
        # Subtle sensor noise simulation
        noise = np.random.normal(0, 3, (height, width, 3)).astype(np.int16)
        frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        
        # Simulated intruder appears between second 2.5 and 7.5
        if 2.5 <= time_sec <= 7.5:
            progress = (time_sec - 2.5) / 5.0
            obj_x = int(80 + progress * (width - 160))
            obj_y = 210
            
            # Draw moving silhouette figure
            cv2.ellipse(frame, (obj_x, obj_y - 25), (10, 15), 0, 0, 360, (200, 210, 220), -1)  # torso
            cv2.circle(frame, (obj_x, obj_y - 45), 8, (200, 210, 220), -1)                       # head
            cv2.line(frame, (obj_x - 5, obj_y - 10), (obj_x - 8, obj_y + 15), (180, 190, 200), 3) # leg 1
            cv2.line(frame, (obj_x + 5, obj_y - 10), (obj_x + 8, obj_y + 15), (180, 190, 200), 3) # leg 2
            
        # Forensic CCTV OSD (On Screen Display) Overlay
        timestamp_str = f"CAM-04-NORTH-GATE | REC [●] 2026-10-27 20:15:{int(time_sec):02d}.{int((time_sec % 1)*100):02d}"
        cv2.putText(frame, timestamp_str, (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 240, 255), 1, cv2.LINE_AA)
        cv2.putText(frame, "TRACE X TEST EVIDENCE - NON-SENSITIVE SYNTHETIC", (15, height - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (140, 150, 160), 1)
        
        out.write(frame)
        
    out.release()
    print(f"Generated sample evidence video: {output_path} ({duration_sec}s, {total_frames} frames)")

if __name__ == "__main__":
    generate_sample_cctv_clip("sample_cctv_feed.mp4")
