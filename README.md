# Zentrix AI – Industrial Worker Safety Monitoring System

## Overview

Zentrix AI is an industrial worker safety monitoring platform that combines Artificial Intelligence, Computer Vision, and Machine Learning to improve workplace safety. The system automatically detects Personal Protective Equipment (PPE) compliance, identifies workplace hazards, analyzes safety violations, and predicts worker risk levels using real-time image and video analytics.

The platform is designed for industrial environments such as manufacturing plants, construction sites, warehouses, and production facilities where continuous safety monitoring is essential.

---

## Key Features

### PPE Compliance Detection

Detects whether workers are wearing required safety equipment such as:

* Safety Helmet
* Safety Vest
* Face Mask
* Gloves (if included in the trained dataset)

### Hazard Detection

Identifies workplace hazards and unsafe conditions using a custom-trained YOLO model.

### Risk Prediction System

Predicts worker safety risk levels using a Machine Learning model based on:

* Worker Age
* Department
* Shift Duration
* PPE Compliance Score
* Number of Safety Alerts
* Symptoms and Safety Indicators

### Image Analytics

Upload images and receive:

* Annotated Detection Results
* PPE Compliance Analysis
* Hazard Identification
* Safety Recommendations

### Video Analytics

Upload safety videos and receive:

* Frame-by-Frame Object Detection
* PPE Violation Detection
* Hazard Monitoring
* Annotated Video Output
* Browser-Compatible H.264 Video Processing

### RTSP and CCTV Monitoring

Supports industrial surveillance systems including:

* RTSP Streams
* IP Cameras
* CCTV Cameras
* Industrial Monitoring Systems

### System Health Monitoring

Provides real-time monitoring of:

* Backend Status
* YOLO Detection Service
* Processing Directories
* Camera Connectivity
* AI Pipeline Health

---

## System Architecture

```text
React Frontend
      |
      v
Flask Backend API
      |
      +----------------+
      |                |
      v                v
YOLO Detection     ML Risk Prediction
      |                |
      +-------+--------+
              |
              v
      Detection Results
              |
              v
      React Dashboard
```

---

## Technology Stack

### Frontend

* React 19
* Vite
* Tailwind CSS
* Recharts
* Framer Motion
* Lucide React
* Axios

### Backend

* Python
* Flask
* Flask-CORS
* OpenCV
* Ultralytics YOLO
* NumPy
* Pandas
* Scikit-Learn

### Machine Learning

* YOLO Object Detection
* Risk Prediction Model
* TF-IDF Vectorization
* Feature Scaling
* Label Encoding

### DevOps

* Docker
* Docker Compose
* Nginx
* FFmpeg

---

## Project Structure

```text
zentrix/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   └── services/
│
├── model/
│   ├── yolo26_safety_model.pt
│   ├── risk_prediction_model.pkl
│   ├── scaler.pkl
│   ├── feature_columns.pkl
│   ├── label_encoder.pkl
│   └── tfidf_vectorizer.pkl
│
├── dataset/
│   └── data.yaml
│
├── static/
│
├── app.py
├── safety_utils.py
├── predict_vdo.py
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Jslxh/zentrix.git
cd zentrix
```

### Build Docker Containers

```bash
docker compose build
```

### Start Application

```bash
docker compose up -d
```

### Verify Running Containers

```bash
docker ps
```

---

## Application Access

### Frontend

```text
http://localhost:3000
```

### Backend API

```text
http://localhost:8000
```

### Health Check

```text
http://localhost:8000/health
```

---

## API Endpoints

### Risk Prediction

```http
POST /predict-risk
```

### Image Detection

```http
POST /detect-image
```

### Video Detection

```http
POST /detect-video
```

### System Health

```http
GET /health
```

### Camera Status

```http
GET /webcam-status
```

### Camera Telemetry

```http
GET /webcam-telemetry
```

### Connect Camera

```http
POST /connect-camera
```

---

## Browser-Compatible Video Processing

Zentrix automatically converts processed videos into H.264 format using FFmpeg.

Benefits:

* Chrome Compatible
* Edge Compatible
* Firefox Compatible
* Downloadable Annotated Videos
* Improved Playback Support

---

## Industrial Use Cases

### Manufacturing Plants

* PPE Compliance Monitoring
* Worker Safety Surveillance
* Hazard Identification

### Construction Sites

* Helmet Detection
* Safety Vest Detection
* Unsafe Behavior Monitoring

### Warehouses

* Risk Assessment
* Worker Monitoring
* Incident Prevention

### Industrial Facilities

* CCTV-Based Safety Monitoring
* RTSP Stream Analytics
* Automated Compliance Auditing

---

## Future Enhancements

* Multi-Camera Monitoring
* Real-Time Alert Notifications
* SMS and Email Safety Alerts
* Cloud Deployment on AWS
* Role-Based Access Control
* Historical Analytics Dashboard
* Safety Compliance Reports
* Predictive Incident Prevention

---

## Author

Jaya Shree Lakshmi S

B.Tech Artificial Intelligence and Machine Learning

---

## License

This project is developed for academic, research, and industrial safety monitoring purposes.
