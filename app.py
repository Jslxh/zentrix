import os
import uuid
import logging
import json
import datetime
import cv2
import threading
import time
from flask import Flask, request, jsonify, send_from_directory, url_for, Response
from werkzeug.utils import secure_filename
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

# Statistics tracking configuration
STATS_FILE = os.path.join('static', 'processed_stats.json')

def update_processed_stats(file_type, detections_count, violations_count, hazards_count, workers_count):
    try:
        stats = {
            "total_images": 0,
            "total_videos": 0,
            "total_workers": 0,
            "total_violations": 0,
            "total_hazards": 0,
            "history": []
        }
        if os.path.exists(STATS_FILE):
            with open(STATS_FILE, "r") as f:
                stats = json.load(f)
                
        if file_type == "image":
            stats["total_images"] = stats.get("total_images", 0) + 1
        elif file_type == "video":
            stats["total_videos"] = stats.get("total_videos", 0) + 1
            
        stats["total_workers"] = stats.get("total_workers", 0) + workers_count
        stats["total_violations"] = stats.get("total_violations", 0) + violations_count
        stats["total_hazards"] = stats.get("total_hazards", 0) + hazards_count
        
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        history = stats.get("history", [])
        history.insert(0, {
            "timestamp": current_time,
            "type": file_type.upper(),
            "workers": workers_count,
            "violations": violations_count,
            "hazards": hazards_count
        })
        stats["history"] = history[:100]
        
        with open(STATS_FILE, "w") as f:
            json.dump(stats, f, indent=4)
    except Exception as e:
        logger.error(f"Failed to update stats: {e}")


# Import our custom safety CV utilities
import safety_utils

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ZentrixFlaskBackend")

# Webcam Streamer Singleton for multi-client non-blocking streaming
class WebcamStreamer:
    def __init__(self):
        self.camera = None
        self.running = False
        self.thread = None
        self.latest_frame = None
        self.latest_telemetry = {
            "detections": [],
            "violations": [],
            "hazards": [],
            "risk_score": 0,
            "risk_level": "LOW"
        }
        self.lock = threading.Lock()
        self.status = "offline"
        self.error_message = ""
        self.fps = 0.0
        self.inference_fps = 0.0
        self.resolution = "N/A"
        self.source = 0
        self.has_probed = False
        
    def start(self, source=0, force=False):
        with self.lock:
            if not force and self.status == "offline" and self.source == source and self.has_probed:
                return
            if self.running and self.source == source:
                return
            if self.running:
                self.running = False
                time.sleep(0.2)
            self.source = source
            self.running = True
            self.status = "starting"
            self.has_probed = True
            self.thread = threading.Thread(target=self._run, daemon=True)
            self.thread.start()
            
    def stop(self):
        with self.lock:
            self.running = False
            self.status = "offline"
            
    def _run(self):
        logger.info(f"Starting Camera/RTSP Streamer background thread with source: {self.source}...")
        self.camera = cv2.VideoCapture(self.source)
        if not self.camera.isOpened():
            if isinstance(self.source, int) and self.source == 0:
                self.error_message = "Local Camera not available inside this Docker/WSL container environment."
            else:
                self.error_message = f"Failed to connect to RTSP/CCTV stream: {self.source}."
            self.status = "offline"
            self.running = False
            logger.info(self.error_message)
            return
            
        w = int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.resolution = f"{w}x{h}"
        self.status = "online"
        self.error_message = ""
        
        frame_count = 0
        start_time = time.time()
        
        while self.running:
            success, frame = self.camera.read()
            if not success:
                self.error_message = "Camera stream read failed."
                logger.warning(self.error_message)
                time.sleep(0.1)
                continue
                
            frame_resized = cv2.resize(frame, (640, 480))
            
            # YOLO Inference
            yolo_start = time.time()
            results = yolo_model(frame_resized, verbose=False)
            inference_time = time.time() - yolo_start
            
            detections = []
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_idx = int(box.cls[0])
                    cls_name = safety_utils.CLASS_NAMES[cls_idx]
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].tolist()
                    detections.append({
                        "class": cls_name,
                        "bbox": xyxy,
                        "conf": conf
                    })
                    
            analysis = safety_utils.check_ppe_and_hazards(detections, 640, 480)
            safety_utils.draw_hud_and_boxes(
                frame_resized, 
                detections, 
                analysis["violations"], 
                analysis["hazards"], 
                analysis["risk_score"], 
                analysis["risk_level"]
            )
            
            # Encode frame
            ret, buffer = cv2.imencode('.jpg', frame_resized)
            if ret:
                with self.lock:
                    self.latest_frame = buffer.tobytes()
                    self.latest_telemetry = {
                        "detections": [d["class"] for d in detections],
                        "violations": analysis["violations"],
                        "hazards": analysis["hazards"],
                        "risk_score": analysis["risk_score"],
                        "risk_level": analysis["risk_level"]
                    }
            
            frame_count += 1
            now = time.time()
            elapsed = now - start_time
            if elapsed >= 1.0:
                self.fps = frame_count / elapsed
                self.inference_fps = 1.0 / max(0.001, inference_time)
                frame_count = 0
                start_time = now
                
            time.sleep(0.01)
            
        self.camera.release()
        self.camera = None
        logger.info("Camera/RTSP Streamer background thread stopped.")
        
webcam_streamer = WebcamStreamer()


# Statistics tracking configuration
STATS_FILE = os.path.join('static', 'processed_stats.json')

def update_processed_stats(file_type, detections_count, violations_count, hazards_count, workers_count):
    try:
        stats = {
            "total_images": 0,
            "total_videos": 0,
            "total_workers": 0,
            "total_violations": 0,
            "total_hazards": 0,
            "history": []
        }
        if os.path.exists(STATS_FILE):
            with open(STATS_FILE, "r") as f:
                stats = json.load(f)
                
        if file_type == "image":
            stats["total_images"] = stats.get("total_images", 0) + 1
        elif file_type == "video":
            stats["total_videos"] = stats.get("total_videos", 0) + 1
            
        stats["total_workers"] = stats.get("total_workers", 0) + workers_count
        stats["total_violations"] = stats.get("total_violations", 0) + violations_count
        stats["total_hazards"] = stats.get("total_hazards", 0) + hazards_count
        
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        history = stats.get("history", [])
        history.insert(0, {
            "timestamp": current_time,
            "type": file_type.upper(),
            "workers": workers_count,
            "violations": violations_count,
            "hazards": hazards_count
        })
        stats["history"] = history[:100]
        
        with open(STATS_FILE, "w") as f:
            json.dump(stats, f, indent=4)
    except Exception as e:
        logger.error(f"Failed to update stats: {e}")


# Import our custom safety CV utilities
import safety_utils

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ZentrixFlaskBackend")

# Flask application setup
app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)

# Configuration
UPLOAD_FOLDER = os.path.join('static', 'uploads')
PROCESSED_FOLDER = os.path.join('static', 'processed')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # Max upload size: 100MB

# Allowed Extensions
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'avi', 'mov'}

def is_allowed_file(filename: str, allowed_set: set) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set

# ------------------------------------------------
# LOAD MACHINE LEARNING & DEEP LEARNING MODELS
# ------------------------------------------------
logger.info("Initializing Zentrix AI Inference engines...")
try:
    # 1. Text-based ML models
    ml_model = joblib.load('model/risk_prediction_model.pkl')
    tfidf_vectorizer = joblib.load('model/tfidf_vectorizer.pkl')
    scaler = joblib.load('model/scaler.pkl')
    label_encoder = joblib.load('model/label_encoder.pkl')
    feature_columns = joblib.load('model/feature_columns.pkl')
    logger.info("Text-based ML model components loaded successfully.")
    ml_models_ok = True
except Exception as e:
    logger.error(f"Failed to load text-based ML models: {e}")
    ml_models_ok = False

try:
    # 2. Custom YOLO object detection model
    yolo_model = safety_utils.load_yolo_model('model/yolo26_safety_model.pt')
    yolo_model_ok = True
except Exception as e:
    logger.error(f"Failed to load YOLO26 model: {e}")
    yolo_model_ok = False

# ------------------------------------------------
# CUSTOM ERROR HANDLERS
# ------------------------------------------------
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad Request", "message": str(error)}), 400

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "Payload Too Large", "message": "File exceeds maximum size limits."}), 413

@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({"error": "Internal Server Error", "message": str(error)}), 500

# ------------------------------------------------
# SYSTEM HEALTH ENDPOINTS
# ------------------------------------------------
@app.route("/", methods=["GET"])
def home():
    """
    Base ping endpoint for backward compatibility with frontend.py.
    """
    return jsonify({
        "message": "Zentrix AI Backend Running",
        "status": "online"
    })

@app.route("/health", methods=["GET"])
def health():
    """
    Detailed system diagnostics check.
    """
    status = "healthy"
    if not ml_models_ok or not yolo_model_ok:
        status = "degraded"
        
    return jsonify({
        "status": status,
        "text_ml_pipeline": "online" if ml_models_ok else "failed_to_load",
        "yolo_object_detection": "online" if yolo_model_ok else "failed_to_load",
        "webcam_status": {
            "available": webcam_streamer.status == "online",
            "status": webcam_streamer.status,
            "fps": round(webcam_streamer.fps, 1),
            "inference_fps": round(webcam_streamer.inference_fps, 1),
            "resolution": webcam_streamer.resolution
        },
        "directories": {
            "uploads": "functional" if os.path.exists(UPLOAD_FOLDER) else "missing",
            "processed": "functional" if os.path.exists(PROCESSED_FOLDER) else "missing"
        }
    }), 200

# ------------------------------------------------
# ML TEXT PREDICTION ROUTE
# ------------------------------------------------
def run_text_prediction(data):
    """
    Core ML prediction function using loaded transformers and classifiers.
    """
    # 1. Text processing
    reported_symptoms = data.get("reported_symptoms", "none")
    text_vector = tfidf_vectorizer.transform([reported_symptoms]).toarray()
    
    # 2. Categorical preprocessing
    audio_flag = data.get("audio_alert_flag", "no").strip().lower()
    audio_numeric = 1 if audio_flag == 'yes' else 0
    
    # 3. Create dataframe aligned with features
    raw_df = pd.DataFrame({
        'age': [int(data.get("age", 30))],
        'shift_duration_hrs': [float(data.get("shift_duration_hrs", 8.0))],
        'ppe_compliance_score': [float(data.get("ppe_compliance_score", 1.0))],
        'audio_alert_flag': [audio_numeric],
        'department': [data.get("department", "Assembly Line")]
    })
    
    encoded_df = pd.get_dummies(raw_df)
    structured_df = encoded_df.reindex(columns=feature_columns, fill_value=0)
    
    # 4. Scaling
    structured_scaled = scaler.transform(structured_df)
    
    # 5. Combination and prediction
    final_input = np.hstack((structured_scaled, text_vector))
    prediction = ml_model.predict(final_input)
    predicted_label = label_encoder.inverse_transform(prediction)
    
    return predicted_label[0]

@app.route("/predict", methods=["POST"])
def predict():
    """
    FastAPI style /predict endpoint for backward compatibility.
    """
    if not ml_models_ok:
        return jsonify({"error": "Model Loading Failure", "message": "Text classification models are unavailable on this server."}), 503
        
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid Input", "message": "Missing JSON post body."}), 400
            
        risk_level = run_text_prediction(data)
        return jsonify({
            "Predicted Risk Level": risk_level
        })
    except Exception as e:
        logger.error(f"Error during ML text prediction: {e}")
        return jsonify({"error": "Prediction Error", "message": str(e)}), 500

@app.route("/predict-risk", methods=["POST"])
def predict_risk():
    """
    Production alias for risk prediction.
    """
    if not ml_models_ok:
        return jsonify({"error": "Model Loading Failure", "message": "Text classification models are unavailable on this server."}), 503
        
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid Input", "message": "Missing JSON post body."}), 400
            
        # Validation checks
        required_fields = ["age", "department", "shift_duration_hrs", "reported_symptoms", "ppe_compliance_score", "audio_alert_flag"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": "Validation Error", "message": f"Missing required field '{field}'"}), 400
                
        risk_level = run_text_prediction(data)
        return jsonify({
            "risk_level": risk_level,
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Error during ML text prediction-risk: {e}")
        return jsonify({"error": "Prediction Error", "message": str(e)}), 500

# ------------------------------------------------
# COMPUTER VISION / OBJECT DETECTION ROUTES
# ------------------------------------------------
@app.route("/detect-image", methods=["POST"])
def detect_image_route():
    """
    POST route to process images through YOLO model, perform PPE compliance analysis,
    generate safety alerts, calculate risk scores, and return annotated images.
    """
    if not yolo_model_ok:
        return jsonify({"error": "Model Loading Failure", "message": "YOLO26 safety model is unavailable on this server."}), 503
        
    # Check if file exists in request
    if 'image' not in request.files:
        return jsonify({"error": "Missing File", "message": "No file parameter named 'image' found in the request."}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Missing Filename", "message": "The uploaded file has no filename."}), 400
        
    # File Validation
    if not is_allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({"error": "Invalid File Type", "message": "Supported image formats are: .png, .jpg, .jpeg"}), 400
        
    try:
        # Secure filename and write locally
        orig_filename = secure_filename(file.filename)
        unique_prefix = str(uuid.uuid4())[:8]
        filename = f"{unique_prefix}_{orig_filename}"
        
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        output_path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
        
        file.save(input_path)
        
        # Process image using safety utils
        logger.info(f"Processing image: {input_path}")
        result = safety_utils.detect_image(yolo_model, input_path, output_path)
        
        # Calculate full static URL
        processed_file_url = f"{request.host_url}static/processed/{filename}"
        
        # Build Response JSON
        response = {
            "detections": result["detections"],
            "violations": result["violations"],
            "hazards": result["hazards"],
            "confidence_scores": result["confidence_scores"],
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "processed_file_url": processed_file_url
        }
        
        # Clean up original upload to conserve space (processed is saved in static)
        if os.path.exists(input_path):
            os.remove(input_path)
            
        # Update statistics history
        workers_count = result["detections"].count("worker")
        violations_count = len(result["violations"])
        hazards_count = len(result["hazards"])
        update_processed_stats("image", len(result["detections"]), violations_count, hazards_count, workers_count)

        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error processing image upload: {e}", exc_info=True)
        return jsonify({"error": "Inference Error", "message": f"Failed to analyze image: {str(e)}"}), 500

@app.route("/detect-video", methods=["POST"])
def detect_video_route():
    """
    POST route to upload a video, run YOLO frame by frame, perform PPE compliance analysis,
    generate safety alerts, calculate risk scores, and write annotated downloadable videos.
    """
    if not yolo_model_ok:
        return jsonify({"error": "Model Loading Failure", "message": "YOLO26 safety model is unavailable on this server."}), 503
        
    # Check if file exists in request
    if 'video' not in request.files:
        return jsonify({"error": "Missing File", "message": "No file parameter named 'video' found in the request."}), 400
        
    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "Missing Filename", "message": "The uploaded file has no filename."}), 400
        
    # File Validation
    if not is_allowed_file(file.filename, ALLOWED_VIDEO_EXTENSIONS):
        return jsonify({"error": "Invalid File Type", "message": "Supported video formats are: .mp4, .avi, .mov"}), 400
        
    # Verify file size limit (100 MB)
    try:
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > 100 * 1024 * 1024:
            return jsonify({"error": "Payload Too Large", "message": "Video exceeds maximum supported size."}), 413
    except Exception as e:
        logger.warning(f"Could not determine video file size: {e}")
        
    try:
        # Secure filename and write locally
        orig_filename = secure_filename(file.filename)
        unique_prefix = str(uuid.uuid4())[:8]
        
        # Force .mp4 extension for output to support H.264 HTML stream capability
        base_name = os.path.splitext(orig_filename)[0]
        filename = f"{unique_prefix}_{base_name}.mp4"
        
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{unique_prefix}_{orig_filename}")
        output_path = os.path.join(app.config['PROCESSED_FOLDER'], filename)
        
        # Save file in chunks to prevent memory spikes
        with open(input_path, "wb") as f:
            while True:
                chunk = file.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                f.write(chunk)
        
        # Run video frame-by-frame inference
        logger.info(f"Processing video: {input_path}")
        result = safety_utils.detect_video(yolo_model, input_path, output_path)
        
        if "error" in result:
            # Clean up raw upload if processing failed
            if os.path.exists(input_path):
                os.remove(input_path)
            return jsonify({"error": "Inference Error", "message": result["error"]}), 500
            
        # Calculate full static download URL
        saved_video_filename = os.path.basename(output_path)
        processed_file_url = f"{request.host_url}static/processed/{saved_video_filename}"
        
        # Build Response JSON
        response = {
            "detections": result["detections"],
            "violations": result["violations"],
            "hazards": result["hazards"],
            "confidence_scores": result["confidence_scores"],
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "processed_file_url": processed_file_url,
            "summary": result["summary"],
            "video_size_mb": result.get("video_size_mb", 0.0),
            "resolution": result.get("resolution", "N/A"),
            "fps": result.get("fps", 0.0),
            "total_frames": result.get("total_frames", 0),
            "processed_frames": result.get("processed_frames", 0),
            "peak_ram_usage_mb": result.get("peak_ram_usage_mb", 0.0)
        }
        
        # Clean up original raw upload to save space
        if os.path.exists(input_path):
            os.remove(input_path)
            
        # Update statistics history
        workers_count = result["summary"].get("total_workers", 0)
        violations_count = len(result["violations"])
        hazards_count = len(result["hazards"])
        update_processed_stats("video", len(result["detections"]), violations_count, hazards_count, workers_count)

        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error processing video upload: {e}", exc_info=True)
        return jsonify({"error": "Inference Error", "message": f"Failed to analyze video: {str(e)}"}), 500

# ------------------------------------------------
# STATS ENDPOINT
# ------------------------------------------------
@app.route("/stats", methods=["GET"])
def get_stats():
    try:
        stats = {
            "total_images": 0,
            "total_videos": 0,
            "total_workers": 0,
            "total_violations": 0,
            "total_hazards": 0,
            "history": []
        }
        if os.path.exists(STATS_FILE):
            with open(STATS_FILE, "r") as f:
                stats = json.load(f)
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Failed to load processed stats: {e}")
        return jsonify({"error": "Internal Error", "message": str(e)}), 500

# ------------------------------------------------
# WEBCAM STREAMING ENDPOINTS
# ------------------------------------------------
@app.route("/video_feed")
def video_feed():
    webcam_streamer.start(force=False)
    
    def generate():
        while True:
            frame = webcam_streamer.latest_frame
            if frame is not None:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            time.sleep(0.04) # target ~25 FPS output stream
            
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route("/connect-camera", methods=["POST"])
def connect_camera():
    data = request.json
    if not data or "source" not in data:
        return jsonify({"error": "Missing Source", "message": "Specify camera source (0 or RTSP URL)"}), 400
    
    source = data["source"]
    if isinstance(source, str) and source.isdigit():
        source = int(source)
        
    webcam_streamer.start(source=source, force=True)
    
    # Wait briefly to check if it connects
    time.sleep(1.0)
    
    if webcam_streamer.status == "online":
        return jsonify({
            "status": "success",
            "message": "Connected to stream successfully",
            "camera_name": "Local Camera" if source == 0 else str(source),
            "webcam_available": True
        }), 200
    else:
        return jsonify({
            "status": "failed",
            "message": webcam_streamer.error_message or "Failed to connect to source",
            "camera_name": "Local Camera" if source == 0 else str(source),
            "webcam_available": False
        }), 200

@app.route("/webcam-status", methods=["GET"])
def get_webcam_status():
    webcam_streamer.start(force=False)
    
    # Wait briefly if starting to probe device
    if webcam_streamer.status == "starting":
        time.sleep(0.6)
        
    return jsonify({
        "webcam_available": webcam_streamer.status == "online",
        "camera_index": webcam_streamer.source if isinstance(webcam_streamer.source, int) else 0,
        "camera_source": webcam_streamer.source,
        "camera_name": "Local Camera" if webcam_streamer.source == 0 else str(webcam_streamer.source),
        "status": webcam_streamer.status,
        "error": webcam_streamer.error_message,
        "fps": round(webcam_streamer.fps, 1),
        "inference_fps": round(webcam_streamer.inference_fps, 1),
        "resolution": webcam_streamer.resolution
    }), 200

@app.route("/webcam-telemetry", methods=["GET"])
def get_webcam_telemetry():
    if webcam_streamer.status != "online":
        return jsonify({
            "detections": [],
            "violations": [],
            "hazards": [],
            "risk_score": 0,
            "risk_level": "LOW"
        }), 200
    return jsonify(webcam_streamer.latest_telemetry), 200

# ------------------------------------------------
# MAIN SERVER RUN
# ------------------------------------------------
if __name__ == "__main__":
    # In production, Flask should be run via WSGI server (e.g. gunicorn)
    # The app runs on port 8000 for Streamlit compatibility.
    logger.info("Starting Flask application on port 8000...")
    app.run(host="0.0.0.0", port=8000, debug=False)
