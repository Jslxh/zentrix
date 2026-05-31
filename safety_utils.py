import os
import cv2
import math
import numpy as np
import logging
import gc
import time
import torch
import subprocess
import shutil
from ultralytics import YOLO

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ZentrixSafetyUtils")

def get_ram_usage_mb() -> float:
    """
    Returns current process RSS memory usage in MB.
    Gracefully handles platforms without psutil (e.g. inside Docker or bare environment).
    """
    try:
        import psutil
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)
    except ImportError:
        # Fallback for Linux / Proc FS if psutil is not available
        try:
            if os.name != 'nt':
                with open('/proc/self/status') as f:
                    for line in f:
                        if 'VmRSS' in line:
                            return float(line.split()[1]) / 1024.0
        except Exception:
            pass
    return 0.0


# Define premium BGR colors for annotations
CLASS_COLORS = {
    "conveyor": (180, 105, 14),        # Slate blue
    "forklift": (0, 123, 255),          # Safety orange
    "hazard_zone": (53, 0, 255),        # Crimson red
    "helmet": (136, 255, 0),            # Bright neon green
    "machine_hazard": (0, 165, 255),    # Vibrant amber/orange
    "mask": (255, 240, 0),              # Electric cyan
    "overhead_hazard": (255, 0, 230),   # Purple/pink glow
    "safety_vest": (0, 255, 221),       # Lime yellow
    "shield": (255, 191, 0),            # Sky blue
    "welding_hazard": (0, 0, 255),      # Neon red
    "worker": (255, 150, 0)             # Blue-teal
}

CLASS_NAMES = [
    "conveyor", "forklift", "hazard_zone", "helmet", "machine_hazard",
    "mask", "overhead_hazard", "safety_vest", "shield", "welding_hazard", "worker"
]

def load_yolo_model(model_path: str = "model/yolo26_safety_model.pt") -> YOLO:
    """
    Loads the YOLO model from the specified path.
    Raises FileNotFoundError if model doesn't exist, or Exception on loading failure.
    """
    if not os.path.exists(model_path):
        logger.error(f"Model file not found at: {model_path}")
        raise FileNotFoundError(f"YOLO26 model file not found at {model_path}")
    try:
        logger.info(f"Loading YOLO26 model from {model_path}...")
        model = YOLO(model_path)
        logger.info("YOLO26 model loaded successfully.")
        return model
    except Exception as e:
        logger.error(f"Failed to load YOLO model: {e}")
        raise RuntimeError(f"Error loading YOLO model: {str(e)}")

def get_intersection_over_second(box1, box2):
    """
    Calculates the ratio of the intersection area to the area of box2.
    box1: [x1, y1, x2, y2] (e.g., worker)
    box2: [x1, y1, x2, y2] (e.g., PPE)
    """
    x_left = max(box1[0], box2[0])
    y_top = max(box1[1], box2[1])
    x_right = min(box1[2], box2[2])
    y_bottom = min(box1[3], box2[3])

    if x_right < x_left or y_bottom < y_top:
        return 0.0

    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])
    if box2_area <= 0:
        return 0.0
    return intersection_area / box2_area

def check_ppe_and_hazards(detections_list, img_width, img_height):
    """
    Analyzes frame-level detections for compliance and hazard conditions.
    detections_list: list of dicts {"class": str, "bbox": [x1, y1, x2, y2], "conf": float}
    """
    workers = []
    helmets = []
    safety_vests = []
    masks = []
    shields = []
    forklifts = []
    hazard_zones = []
    
    # Simple image-wide flags
    has_welding_hazard = False
    has_machine_hazard = False
    has_overhead_hazard = False
    has_conveyor = False
    
    violations = []
    hazards = []
    
    # Sort detections into categories
    for det in detections_list:
        cls_name = det["class"]
        bbox = det["bbox"]
        
        if cls_name == "worker":
            workers.append(det)
        elif cls_name == "helmet":
            helmets.append(bbox)
        elif cls_name == "safety_vest":
            safety_vests.append(bbox)
        elif cls_name == "mask":
            masks.append(bbox)
        elif cls_name == "shield":
            shields.append(bbox)
        elif cls_name == "forklift":
            forklifts.append(bbox)
            if "Forklift detected" not in hazards:
                # Base hazard presence
                pass
        elif cls_name == "hazard_zone":
            hazard_zones.append(bbox)
        elif cls_name == "welding_hazard":
            has_welding_hazard = True
        elif cls_name == "machine_hazard":
            has_machine_hazard = True
        elif cls_name == "overhead_hazard":
            has_overhead_hazard = True
        elif cls_name == "conveyor":
            has_conveyor = True

    # 1. PPE Compliance Evaluation per Worker
    helmet_missing_count = 0
    vest_missing_count = 0
    mask_missing_count = 0
    shield_missing_count = 0

    for idx, worker in enumerate(workers):
        w_box = worker["bbox"]
        
        # Helmet compliance
        has_helmet = False
        for h_box in helmets:
            if get_intersection_over_second(w_box, h_box) > 0.4:
                has_helmet = True
                break
        if not has_helmet:
            helmet_missing_count += 1
            
        # Safety Vest compliance
        has_vest = False
        for v_box in safety_vests:
            if get_intersection_over_second(w_box, v_box) > 0.4:
                has_vest = True
                break
        if not has_vest:
            vest_missing_count += 1
            
        # Mask compliance
        has_mask = False
        for m_box in masks:
            if get_intersection_over_second(w_box, m_box) > 0.4:
                has_mask = True
                break
        if not has_mask:
            mask_missing_count += 1

        # Face Shield compliance in welding areas
        if has_welding_hazard:
            has_shield = False
            for s_box in shields:
                if get_intersection_over_second(w_box, s_box) > 0.4:
                    has_shield = True
                    break
            if not has_shield:
                shield_missing_count += 1

    # Populate unique violations list
    if helmet_missing_count > 0:
        violations.append("Helmet Missing")
    if vest_missing_count > 0:
        violations.append("Safety Vest Missing")
    if mask_missing_count > 0:
        violations.append("Mask Missing")
    if shield_missing_count > 0:
        violations.append("Face Shield Missing")

    # 2. Hazard Proximity & Overlap Alerts
    # Check Forklifts near workers
    forklift_near_workers = False
    for f_box in forklifts:
        f_center = ((f_box[0] + f_box[2]) / 2, (f_box[1] + f_box[3]) / 2)
        for worker in workers:
            w_box = worker["bbox"]
            w_center = ((w_box[0] + w_box[2]) / 2, (w_box[1] + w_box[3]) / 2)
            # Distance in pixels
            dist = math.sqrt((f_center[0] - w_center[0])**2 + (f_center[1] - w_center[1])**2)
            # Threshold is 25% of the max image dimension
            threshold = 0.25 * max(img_width, img_height)
            if dist < threshold or get_intersection_over_second(w_box, f_box) > 0.05:
                forklift_near_workers = True
                break
        if forklift_near_workers:
            break

    if len(forklifts) > 0:
        if forklift_near_workers:
            hazards.append("Forklift detected near workers")
        else:
            hazards.append("Forklift detected")

    # Check Workers inside Hazard Zones
    worker_in_hazard_zone = False
    for hz_box in hazard_zones:
        for worker in workers:
            w_box = worker["bbox"]
            # If worker intersects with hazard zone
            if get_intersection_over_second(hz_box, w_box) > 0.05 or get_intersection_over_second(w_box, hz_box) > 0.05:
                worker_in_hazard_zone = True
                break
        if worker_in_hazard_zone:
            break

    if len(hazard_zones) > 0:
        if worker_in_hazard_zone:
            hazards.append("Worker inside hazard zone")
        else:
            hazards.append("Hazard Zone detected")

    # Global Hazards Presence
    if has_machine_hazard:
        hazards.append("Machine Hazard detected")
    if has_overhead_hazard:
        hazards.append("Overhead Hazard detected")
    if has_welding_hazard:
        hazards.append("Welding Hazard detected")
    if has_conveyor:
        hazards.append("Conveyor detected")

    # 3. Unified Risk Scoring Logic
    risk_score = 0
    if len(workers) > 0:
        risk_score += 20  # Base score for active workspace occupancy
        
        # Violation Penalties
        if "Helmet Missing" in violations:
            risk_score += 30
        if "Safety Vest Missing" in violations:
            risk_score += 20
        if "Mask Missing" in violations:
            risk_score += 10
        if "Face Shield Missing" in violations:
            risk_score += 15
            
        # Hazard Proximity Penalties
        if "Worker inside hazard zone" in hazards:
            risk_score += 30
        if "Forklift detected near workers" in hazards:
            risk_score += 25
            
    # Presence of other hazards
    if has_machine_hazard:
        risk_score += 10
    if has_overhead_hazard:
        risk_score += 15
    if has_welding_hazard:
        risk_score += 10
        
    risk_score = min(100, risk_score)
    
    # Map Risk Score to Risk Level
    if risk_score == 0:
        risk_level = "LOW"
    elif risk_score <= 30:
        risk_level = "LOW"
    elif risk_score <= 60:
        risk_level = "MEDIUM"
    elif risk_score <= 85:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"
        
    return {
        "violations": violations,
        "hazards": hazards,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "counts": {
            "workers": len(workers),
            "helmet_violations": helmet_missing_count,
            "mask_violations": mask_missing_count,
            "safety_vest_violations": vest_missing_count,
            "forklift_events": len(forklifts),
            "hazard_zone_events": len(hazard_zones)
        }
    }

def draw_hud_and_boxes(img, detections, violations, hazards, risk_score, risk_level):
    """
    Draws a highly polished, premium-looking safety HUD and labeled bounding boxes.
    """
    h, w, _ = img.shape
    
    # 1. Draw Bounding Boxes
    for det in detections:
        cls_name = det["class"]
        bbox = [int(coord) for coord in det["bbox"]]
        conf = det["conf"]
        color = CLASS_COLORS.get(cls_name, (255, 255, 255))
        
        # Bounding box with slightly rounded corners representation
        cv2.rectangle(img, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
        
        # Labeled text container
        label = f"{cls_name} {int(conf * 100)}%"
        (lbl_w, lbl_h), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        
        # Make sure label background stays within the frame
        y_label = max(bbox[1], lbl_h + 5)
        cv2.rectangle(img, (bbox[0], y_label - lbl_h - 4), (bbox[0] + lbl_w + 6, y_label + baseline - 2), color, cv2.FILLED)
        cv2.putText(img, label, (bbox[0] + 3, y_label - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 1, cv2.LINE_AA)

    # 2. Draw Enterprise Safety HUD Overlay (Semi-transparent top bar & sidebar)
    hud_overlay = img.copy()
    
    # Top HUD Bar
    cv2.rectangle(hud_overlay, (0, 0), (w, 55), (15, 23, 42), -1)
    # Risk Level Panel in HUD
    panel_color = (0, 255, 136)  # Green for LOW
    if risk_level == "MEDIUM":
        panel_color = (0, 165, 255)  # Orange
    elif risk_level == "HIGH":
        panel_color = (53, 0, 255)  # Red
    elif risk_level == "CRITICAL":
        panel_color = (0, 0, 150)  # Crimson/Dark red
        
    cv2.rectangle(hud_overlay, (w - 240, 10), (w - 10, 45), (30, 41, 59), -1)
    
    # Combine the overlay
    cv2.addWeighted(hud_overlay, 0.82, img, 0.18, 0, img)
    
    # Add text on top bar
    cv2.putText(img, "🛡️ ZENTRIX AI - ACTIVE SAFETY INTELLIGENCE", (15, 34), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 240, 255), 2, cv2.LINE_AA)
    
    # Add Risk Score/Level details
    risk_text = f"RISK: {risk_level} ({risk_score}%)"
    cv2.putText(img, risk_text, (w - 225, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.5, panel_color, 2, cv2.LINE_AA)
    
    # Left Column HUD for Warnings if any exist
    if violations or hazards:
        warnings_overlay = img.copy()
        box_h = 40 + (len(violations) + len(hazards)) * 25
        # Draw background panel
        cv2.rectangle(warnings_overlay, (10, 70), (320, 70 + box_h), (15, 23, 42), -1)
        cv2.rectangle(warnings_overlay, (10, 70), (320, 70 + box_h), (0, 240, 255), 1)
        cv2.addWeighted(warnings_overlay, 0.85, img, 0.15, 0, img)
        
        cv2.putText(img, "⚠️ DANGER ALERTS", (20, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 2, cv2.LINE_AA)
        
        curr_y = 120
        for viol in violations:
            cv2.putText(img, f"• {viol}", (25, curr_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 165, 255), 1, cv2.LINE_AA)
            curr_y += 25
        for haz in hazards:
            cv2.putText(img, f"• {haz}", (25, curr_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (53, 0, 255), 1, cv2.LINE_AA)
            curr_y += 25

def detect_image(model: YOLO, image_path: str, output_path: str) -> dict:
    """
    Runs inference on an image, draws annotations, and saves the result.
    Returns structured detection dict.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image from {image_path}. File might be corrupted or missing.")
        
    img_h, img_w, _ = img.shape
    
    # Run YOLO Inference
    results = model(img)
    
    detections = []
    confidence_scores = []
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls_idx = int(box.cls[0])
            cls_name = CLASS_NAMES[cls_idx]
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            
            detections.append({
                "class": cls_name,
                "bbox": xyxy,
                "conf": conf
            })
            confidence_scores.append(conf)
            
    # Analyze violations, hazards, and risk
    analysis = check_ppe_and_hazards(detections, img_w, img_h)
    
    # Draw premium overlays on image
    draw_hud_and_boxes(img, detections, analysis["violations"], analysis["hazards"], analysis["risk_score"], analysis["risk_level"])
    
    # Save the processed image
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, img)
    
    return {
        "detections": [d["class"] for d in detections],
        "violations": analysis["violations"],
        "hazards": analysis["hazards"],
        "confidence_scores": confidence_scores,
        "risk_score": analysis["risk_score"],
        "risk_level": analysis["risk_level"]
    }

def detect_video(model: YOLO, video_path: str, output_path: str, progress_callback=None) -> dict:
    """
    Processes video frame-by-frame, performs inference, saves annotated video,
    and returns a summary of detections and violations in a memory-efficient manner.
    """
    start_time = time.time()
    
    # 1. Automatic Device Selection
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    # 2. Get Video Size
    try:
        video_size_mb = os.path.getsize(video_path) / (1024 * 1024)
    except Exception:
        video_size_mb = 0.0

    # 3. Initialize Video Capture
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video file {video_path}.")
    except Exception as e:
        logger.error(f"VideoCapture initialization failed: {e}")
        return {"error": f"Failed to open video file: {str(e)}"}

    # Get video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        total_frames = 1
        
    logger.info(f"Input video properties: Size={video_size_mb:.2f}MB, Res={width}x{height}, FPS={fps}, Total Frames={total_frames}")

    # 4. Check for Automatic Downscaling (> 1920x1080)
    downscale_needed = False
    orig_w, orig_h = width, height
    if width > 1920 or height > 1080:
        downscale_needed = True
        aspect_ratio = width / height
        if aspect_ratio > 1920 / 1080:
            width = 1920
            height = int(1920 / aspect_ratio)
        else:
            height = 1080
            width = int(1080 * aspect_ratio)
        logger.info(f"Automatically downscaling base video resolution to {width}x{height}")

    # 5. Calculate Target Resolution for YOLO Inference
    aspect_ratio = width / height
    if aspect_ratio >= 1.5:
        target_w, target_h = 640, 360
    else:
        target_w, target_h = 640, 640
    logger.info(f"Target processing resolution: {target_w}x{target_h}")

    # 6. Initialize Video Writer
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    codecs_to_try = [
        ('mp4v', '.mp4'),
        ('XVID', '.avi')
    ]
    
    out = None
    for codec, ext in codecs_to_try:
        try:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            temp_output = output_path
            if not output_path.endswith(ext):
                temp_output = os.path.splitext(output_path)[0] + ext
            out = cv2.VideoWriter(temp_output, fourcc, fps, (target_w, target_h))
            if out.isOpened():
                logger.info(f"VideoWriter successfully initialized with codec '{codec}'.")
                output_path = temp_output
                break
        except Exception as e:
            logger.warning(f"Failed to initialize VideoWriter with codec '{codec}': {e}")
            if out is not None:
                out.release()
                
    if out is None or not out.isOpened():
        cap.release()
        return {"error": "Could not initialize OpenCV VideoWriter with any available codec."}

    # Aggregate statistics
    unique_detections = set()
    unique_violations = set()
    unique_hazards = set()
    all_confidence_scores = []
    
    max_workers = 0
    total_helmet_violations = 0
    total_mask_violations = 0
    total_safety_vest_violations = 0
    forklift_events = 0
    hazard_zone_events = 0
    highest_risk_score = 0
    highest_risk_level = "LOW"
    
    # Pre-populate fallback metadata for frame skipping
    last_detections = []
    last_analysis = {
        "violations": [],
        "hazards": [],
        "risk_score": 0,
        "risk_level": "LOW",
        "counts": {
            "workers": 0,
            "helmet_violations": 0,
            "mask_violations": 0,
            "safety_vest_violations": 0,
            "forklift_events": 0,
            "hazard_zone_events": 0
        }
    }
    
    frame_idx = 0
    processed_frames = 0
    peak_ram = get_ram_usage_mb()

    # 7. Core Frame Processing Loop
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_idx += 1

            # Downscale frame if original is > 1920x1080
            if downscale_needed:
                frame = cv2.resize(frame, (width, height))
                
            # Resize frame to target dimensions before YOLO inference
            frame = cv2.resize(frame, (target_w, target_h))

            # Process every 3rd frame
            if frame_idx == 1 or frame_idx % 3 == 0:
                processed_frames += 1
                try:
                    # Use imgsz=640, conf=0.25, stream=True
                    results = model(frame, imgsz=640, conf=0.25, stream=True, verbose=False, device=device)
                    frame_detections = []
                    
                    for r in results:
                        boxes = r.boxes
                        for box in boxes:
                            cls_idx = int(box.cls[0])
                            cls_name = CLASS_NAMES[cls_idx]
                            conf = float(box.conf[0])
                            xyxy = box.xyxy[0].tolist()
                            
                            frame_detections.append({
                                "class": cls_name,
                                "bbox": xyxy,
                                "conf": conf
                            })
                            unique_detections.add(cls_name)
                            all_confidence_scores.append(conf)
                    
                    # Clean up temporary results object immediately
                    del results
                except Exception as e:
                    logger.error(f"YOLO prediction failed at frame {frame_idx}: {e}")
                    raise RuntimeError(f"YOLO prediction error: {str(e)}")

                # Analyze compliance & hazards in the current frame
                analysis = check_ppe_and_hazards(frame_detections, target_w, target_h)
                
                # Cache results for skipped frames
                last_detections = frame_detections
                last_analysis = analysis
            else:
                # Reuse detections & analysis from last processed frame
                frame_detections = last_detections
                analysis = last_analysis

            # Accumulate metrics
            max_workers = max(max_workers, analysis["counts"]["workers"])
            total_helmet_violations = max(total_helmet_violations, analysis["counts"]["helmet_violations"])
            total_mask_violations = max(total_mask_violations, analysis["counts"]["mask_violations"])
            total_safety_vest_violations = max(total_safety_vest_violations, analysis["counts"]["safety_vest_violations"])
            
            if len([h for h in analysis["hazards"] if "Forklift" in h]) > 0:
                forklift_events = max(forklift_events, analysis["counts"]["forklift_events"])
            if len([h for h in analysis["hazards"] if "hazard zone" in h.lower()]) > 0:
                hazard_zone_events = max(hazard_zone_events, analysis["counts"]["hazard_zone_events"])
                
            for viol in analysis["violations"]:
                unique_violations.add(viol)
            for haz in analysis["hazards"]:
                unique_hazards.add(haz)
                
            if analysis["risk_score"] > highest_risk_score:
                highest_risk_score = analysis["risk_score"]
                highest_risk_level = analysis["risk_level"]
                
            # Draw overlay and write frame directly to disk (never append to list)
            draw_hud_and_boxes(frame, frame_detections, analysis["violations"], analysis["hazards"], analysis["risk_score"], analysis["risk_level"])
            out.write(frame)
            
            # Track peak RAM
            curr_ram = get_ram_usage_mb()
            if curr_ram > peak_ram:
                peak_ram = curr_ram
                
            # Periodic garbage collection
            if frame_idx % 30 == 0:
                gc.collect()
                
            # Progress callback invocation
            if progress_callback:
                try:
                    elapsed = time.time() - start_time
                    progress_callback(frame_idx, total_frames, elapsed)
                except Exception as cb_err:
                    logger.warning(f"Error calling progress callback: {cb_err}")
                    
    except Exception as process_err:
        logger.error(f"Error during video processing loop: {process_err}")
        return {"error": f"Error during frame processing: {str(process_err)}"}
    finally:
        cap.release()
        if out is not None:
            out.release()
        gc.collect()

    # Browser compatibility fix
    # H.264 + YUV420p conversion
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        logger.warning("FFmpeg executable not found. Skipping browser compatibility transcoding.")
    else:
        if os.path.exists(output_path):
            original_size_bytes = os.path.getsize(output_path)
            original_size_mb = original_size_bytes / (1024 * 1024)
            temp_output = f"{output_path}.tmp.mp4"
            
            cmd = [
                ffmpeg_path, "-y", "-i", output_path,
                "-c:v", "libx264",
                "-preset", "fast",
                "-pix_fmt", "yuv420p",
                temp_output
            ]
            
            t_start = time.time()
            try:
                result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                duration = time.time() - t_start
                
                if result.returncode == 0 and os.path.exists(temp_output):
                    transcoded_size_bytes = os.path.getsize(temp_output)
                    transcoded_size_mb = transcoded_size_bytes / (1024 * 1024)
                    
                    os.replace(temp_output, output_path)
                    
                    logger.info("FFmpeg found.")
                    logger.info("Starting browser compatibility transcoding.")
                    logger.info(f"Original size: {original_size_mb:.2f} MB")
                    logger.info(f"Transcoded size: {transcoded_size_mb:.2f} MB")
                    logger.info(f"Transcoding duration: {duration:.2f} seconds")
                    logger.info(f"FFmpeg return code: {result.returncode}")
                else:
                    logger.warning(f"FFmpeg transcoding failed with return code {result.returncode}. Error: {result.stderr}")
                    if os.path.exists(temp_output):
                        try:
                            os.remove(temp_output)
                        except Exception as e:
                            logger.warning(f"Failed to remove temp file {temp_output}: {e}")
            except Exception as e:
                logger.warning(f"Failed to run FFmpeg transcoding command: {e}")
                if os.path.exists(temp_output):
                    try:
                        os.remove(temp_output)
                    except Exception:
                        pass
        else:
            logger.warning(f"Original video output not found at {output_path} for transcoding.")

    processing_time = time.time() - start_time
    avg_conf = [sum(all_confidence_scores)/len(all_confidence_scores)] if all_confidence_scores else [0.0]

    # Log metrics
    logger.info("=== Video Processing Statistics ===")
    logger.info(f"Video Size: {video_size_mb:.2f} MB")
    logger.info(f"Resolution: {orig_w}x{orig_h} -> Processed at: {target_w}x{target_h}")
    logger.info(f"FPS: {fps}")
    logger.info(f"Total Frames: {total_frames}")
    logger.info(f"Processed Frames: {processed_frames}")
    logger.info(f"Processing Time: {processing_time:.2f} seconds")
    logger.info(f"Peak RAM Usage: {peak_ram:.2f} MB")
    logger.info("==================================")

    return {
        "detections": list(unique_detections),
        "violations": list(unique_violations),
        "hazards": list(unique_hazards),
        "confidence_scores": avg_conf,
        "risk_score": highest_risk_score,
        "risk_level": highest_risk_level,
        "processed_file_url": f"static/processed/{os.path.basename(output_path)}",
        "video_size_mb": video_size_mb,
        "resolution": f"{orig_w}x{orig_h}",
        "fps": fps,
        "total_frames": total_frames,
        "processed_frames": processed_frames,
        "processing_time": processing_time,
        "peak_ram_usage_mb": peak_ram,
        "summary": {
            "total_workers": max_workers,
            "helmet_violations": total_helmet_violations,
            "mask_violations": total_mask_violations,
            "safety_vest_violations": total_safety_vest_violations,
            "forklift_events": forklift_events,
            "hazard_zone_events": hazard_zone_events,
            "risk_level": highest_risk_level
        }
    }

def detect_webcam(model: YOLO):
    """
    Opens the default webcam device, runs real-time inference,
    and displays the annotated live stream in a window.
    """
    cap = cv2.VideoCapture(1)
    if not cap.isOpened():
        logger.error("Webcam device 0 could not be opened.")
        print("Error: Could not access the webcam.")
        return
        
    logger.info("Webcam stream started. Press 'q' to quit.")
    
    cv2.namedWindow("ZENTRIX AI - Live Safety Monitoring", cv2.WINDOW_NORMAL)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            logger.error("Failed to read frame from webcam.")
            break
            
        h, w, _ = frame.shape
        
        # Inference
        results = model(frame, verbose=False)
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_idx = int(box.cls[0])
                cls_name = CLASS_NAMES[cls_idx]
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()
                
                detections.append({
                    "class": cls_name,
                    "bbox": xyxy,
                    "conf": conf
                })
                
        # Compliance & Hazards check
        analysis = check_ppe_and_hazards(detections, w, h)
        
        # Draw HUD overlays on live frames
        draw_hud_and_boxes(frame, detections, analysis["violations"], analysis["hazards"], analysis["risk_score"], analysis["risk_level"])
        
        # Display the live window
        cv2.imshow("ZENTRIX AI - Live Safety Monitoring", frame)
        
        # Stop on keypress 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
    logger.info("Webcam stream terminated.")
