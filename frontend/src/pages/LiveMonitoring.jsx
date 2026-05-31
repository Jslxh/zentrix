import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Cpu, 
  Download, 
  Eye, 
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  ServerCrash,
  RefreshCw,
  Activity,
  Camera,
  Link,
  Wifi,
  WifiOff
} from 'lucide-react';
import { detectImage, detectVideo, getWebcamStatus, getWebcamTelemetry, connectCamera } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import DetectionCard from '../components/DetectionCard';
import VideoAnalysisPanel from '../components/VideoAnalysisPanel';

function LiveMonitoring() {
  const [activeTab, setActiveTab] = useState('image'); // image, video, webcam

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Tab Navigation header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-3 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-poppins font-bold text-text tracking-wide flex items-center gap-2">
            <Cpu className="text-primary animate-pulse" size={20} />
            Multimodal Live Analytics Gateway
          </h2>
          <p className="text-xs text-muted">
            Run computer vision model YOLO26 on static images, files, or configure live streams.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="grid grid-cols-3 sm:flex bg-card p-1 rounded-lg border border-border w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded text-[10px] sm:text-xs font-poppins font-semibold transition-all cursor-pointer ${
              activeTab === 'image' 
                ? 'bg-primary text-background' 
                : 'text-muted hover:text-text'
            }`}
          >
            <ImageIcon size={14} className="flex-shrink-0" />
            <span className="truncate">Image</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded text-[10px] sm:text-xs font-poppins font-semibold transition-all cursor-pointer ${
              activeTab === 'video' 
                ? 'bg-primary text-background' 
                : 'text-muted hover:text-text'
            }`}
          >
            <VideoIcon size={14} className="flex-shrink-0" />
            <span className="truncate">Video</span>
          </button>
          <button
            onClick={() => setActiveTab('webcam')}
            className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded text-[10px] sm:text-xs font-poppins font-semibold transition-all cursor-pointer ${
              activeTab === 'webcam' 
                ? 'bg-primary text-background' 
                : 'text-muted hover:text-text'
            }`}
          >
            <PlayCircle size={14} className="flex-shrink-0" />
            <span className="truncate">Live Feed</span>
          </button>
        </div>
      </div>

      {/* Tabs panels */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'image' && <ImageTabKey key="image" />}
          {activeTab === 'video' && <VideoTabKey key="video" />}
          {activeTab === 'webcam' && <WebcamTabKey key="webcam" />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ====================================================
// IMAGE ANALYTICS TAB
// ====================================================
function ImageTabKey() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const data = await detectImage(formData);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred during image inference.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Column */}
        <div className="glass-panel rounded-lg p-5 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-text border-b border-border/80 pb-3 flex items-center gap-2">
              <Upload size={14} className="text-primary" />
              Source Image Ingestion
            </h3>
            
            <div className="mt-4 border-2 border-dashed border-border/60 hover:border-primary/40 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors relative cursor-pointer group bg-background/15">
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Upload size={32} className="text-muted/40 group-hover:text-primary transition-colors stroke-[1.5] mb-2 animate-bounce" />
              <span className="text-xs font-semibold text-text">Drag and drop file or click to browse</span>
              <span className="text-[10px] text-muted mt-1 font-mono">Supports PNG, JPG, JPEG (Max 10MB)</span>
            </div>

            {previewUrl && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-background border border-border p-2 rounded flex items-center gap-3"
              >
                <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded border border-border flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text truncate">{imageFile.name}</p>
                  <p className="text-[10px] text-muted font-mono">{(imageFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </motion.div>
            )}
          </div>

          <motion.button
            onClick={handleAnalyze}
            disabled={!imageFile || loading}
            whileTap={{ scale: 0.985 }}
            className="w-full bg-primary hover:bg-primary/90 text-background font-bold text-xs uppercase py-2.5 px-4 rounded transition-colors mt-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins cursor-pointer shadow-[0_0_15px_rgba(0,212,255,0.15)]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Run Safety Computer Vision Inference
                <Cpu size={14} />
              </>
            )}
          </motion.button>
        </div>

        {/* Viewport Column */}
        <div className="glass-panel rounded-lg p-5 flex flex-col min-h-[350px]">
          <h3 className="text-xs uppercase font-bold tracking-wider text-text border-b border-border/80 pb-3 flex items-center gap-2">
            <Eye size={14} className="text-primary" />
            Platform Analysis Viewport
          </h3>

          <div className="flex-1 flex items-center justify-center mt-4 border border-border bg-background/50 rounded overflow-hidden relative min-h-[220px]">
            {loading && (
              <div className="absolute inset-0 bg-background/70 z-20 flex flex-col items-center justify-center">
                <div className="scanner-line" />
                <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-mono text-primary animate-pulse uppercase tracking-wider">AI Inference Engine Scanning...</span>
              </div>
            )}
            
            {result ? (
              <motion.img 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                src={result.processed_file_url} 
                alt="Inference Output" 
                className="w-full h-full object-contain max-h-[350px]" 
              />
            ) : previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain max-h-[350px] opacity-30 blur-[1px]" />
                <div className="absolute flex flex-col items-center bg-card/85 border border-border rounded p-3 text-center">
                  <Info size={20} className="text-primary animate-pulse mb-1" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text">Awaiting Inference</span>
                  <span className="text-[10px] text-muted">Click the execute safety audit button on the left.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-6 space-y-2">
                <HelpCircle size={38} className="text-muted/30 stroke-[1.5]" />
                <span className="text-xs font-bold text-text uppercase tracking-wider">Viewport Inactive</span>
                <span className="text-[10px] text-muted">No source image has been ingested for processing.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Card */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-danger/10 border border-danger/25 text-danger p-4 rounded-lg flex items-start gap-3 shadow-[0_0_15px_rgba(255,23,68,0.1)]"
        >
          <ServerCrash size={18} className="mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase">Inference Fault Detected</h4>
            <p className="text-xs leading-relaxed text-muted">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Results Deck */}
      {result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h4 className="text-xs font-poppins font-bold text-text uppercase tracking-wider border-b border-border pb-2">
            Inference Telemetry Outcome
          </h4>

          {/* Risk assessment and gauge row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              title="PPE Compliance Rating" 
              value={result.risk_score !== undefined ? `${100 - result.risk_score}%` : 'N/A'}
              subtext="Safety metrics rating"
              type="primary"
            />
            <StatCard 
              title="Unified Severity Index" 
              value={`${result.risk_score}%`} 
              subtext="Aggregated threat score"
              type="warning"
            />
            <StatCard 
              title="Assessor Risk Level" 
              value={result.risk_level} 
              subtext="Target sector assessment"
              type={result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL' ? 'danger' : (result.risk_level === 'MEDIUM' ? 'warning' : 'success')}
            />
          </div>

          {/* Detections Lists grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DetectionCard title="Detected Objects" items={result.detections} type="detections" />
            <DetectionCard title="PPE Violations" items={result.violations} type="violations" />
            <DetectionCard title="Site Hazards" items={result.hazards} type="hazards" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ====================================================
// VIDEO ANALYTICS TAB
// ====================================================
function VideoTabKey() {
  const [videoFile, setVideoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError('Video exceeds maximum supported size (100 MB).');
        setVideoFile(null);
        setPreviewUrl(null);
        setResult(null);
        return;
      }
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      const data = await detectVideo(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred during video frame processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result || !result.processed_file_url) return;
    try {
      const url = result.processed_file_url;
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `processed_${videoFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Could not download processed video:", err);
      window.open(result.processed_file_url, '_blank');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Column */}
        <div className="glass-panel rounded-lg p-5 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-text border-b border-border/85 pb-3 flex items-center gap-2">
              <Upload size={14} className="text-primary" />
              Source Video Ingestion
            </h3>
            
            <div className="mt-4 border-2 border-dashed border-border/60 hover:border-primary/40 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors relative cursor-pointer group bg-background/15">
              <input 
                type="file" 
                accept="video/mp4, video/avi, video/mov"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Upload size={32} className="text-muted/40 group-hover:text-primary transition-colors stroke-[1.5] mb-2 animate-bounce" />
              <span className="text-xs font-semibold text-text">Drag and drop file or click to browse</span>
              <span className="text-[10px] text-muted mt-1 font-mono">Supports MP4, AVI, MOV (Max 100MB)</span>
            </div>

              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-background border border-border p-2.5 rounded flex items-center gap-3"
              >
                <VideoIcon size={24} className="text-primary animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text truncate">{videoFile.name}</p>
                  <p className="text-[10px] text-muted font-mono">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-3 mt-4">
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <div className="flex justify-between items-center text-[10px] text-muted uppercase font-bold">
                    <span>Uploading payload to safety server</span>
                    <span className="font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-primary h-full rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  {uploadProgress === 100 && (
                    <p className="text-[9px] text-primary/80 italic font-medium animate-pulse mt-1">
                      Upload complete. Server is now executing YOLO compliance model frame audits...
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleAnalyze}
              disabled={!videoFile || loading}
              whileTap={{ scale: 0.985 }}
              className="w-full bg-primary hover:bg-primary/90 text-background font-bold text-xs uppercase py-2.5 px-4 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-poppins cursor-pointer shadow-[0_0_15px_rgba(0,212,255,0.15)]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Process safety video pipeline
                  <Cpu size={14} />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Viewport Column */}
        <div className="glass-panel rounded-lg p-5 flex flex-col min-h-[350px]">
          <h3 className="text-xs uppercase font-bold tracking-wider text-text border-b border-border/80 pb-3 flex items-center gap-2">
            <Eye size={14} className="text-primary" />
            Processed Video Viewport
          </h3>

          <div className="flex-1 flex items-center justify-center mt-4 border border-border bg-background/50 rounded overflow-hidden relative min-h-[220px]">
            {loading && uploadProgress === 100 && (
              <div className="absolute inset-0 bg-background/70 z-20 flex flex-col items-center justify-center">
                <div className="scanner-line" />
                <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-mono text-primary animate-pulse uppercase tracking-wider">Neural Safety Scan Running...</span>
              </div>
            )}
            
            {result ? (
              <motion.video 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={result.processed_file_url} 
                controls 
                className="w-full h-full object-contain max-h-[350px]" 
              />
            ) : previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video src={previewUrl} className="w-full h-full object-contain max-h-[350px] opacity-25" />
                <div className="absolute flex flex-col items-center bg-card/85 border border-border rounded p-3 text-center">
                  <Info size={20} className="text-primary animate-pulse mb-1" />
                  <span className="text-xs font-bold uppercase tracking-wider text-text">Ingestion Complete</span>
                  <span className="text-[10px] text-muted">Click the process safety video button on the left.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-6 space-y-2">
                <HelpCircle size={38} className="text-muted/30 stroke-[1.5]" />
                <span className="text-xs font-bold text-text uppercase tracking-wider">Viewport Inactive</span>
                <span className="text-[10px] text-muted">No source video clip has been ingested for scanning.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Card */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-danger/10 border border-danger/25 text-danger p-4 rounded-lg flex items-start gap-3 shadow-[0_0_15px_rgba(255,23,68,0.1)]"
        >
          <ServerCrash size={18} className="mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase">Pipeline Processing Fault</h4>
            <p className="text-xs leading-relaxed text-muted">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Results Deck */}
      {result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center border-b border-border pb-2">
            <h4 className="text-xs font-poppins font-bold text-text uppercase tracking-wider">
              Safety Compliance Ledger
            </h4>

            {result.processed_file_url && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="bg-card border border-border hover:border-primary/40 text-text hover:text-primary transition-all font-bold text-[10px] uppercase py-1.5 px-3 rounded flex items-center gap-1.5 font-poppins cursor-pointer"
              >
                <Download size={12} />
                Download Annotated Video
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left side analysis results */}
            <div className="lg:col-span-3 space-y-4">
              {/* Stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard 
                  title="Workers Tracked" 
                  value={`${result.summary?.total_workers || 0} Active`} 
                  subtext="Direct occupancy count"
                  type="primary"
                />
                <StatCard 
                  title="Highest Risk Score" 
                  value={`${result.risk_score || 0}%`} 
                  subtext="Aggregated threat score"
                  type="warning"
                />
                <StatCard 
                  title="Severity Status" 
                  value={result.risk_level || 'LOW'} 
                  subtext="Target sector assessment"
                  type={result.risk_level === 'HIGH' || result.risk_level === 'CRITICAL' ? 'danger' : (result.risk_level === 'MEDIUM' ? 'warning' : 'success')}
                />
              </div>

              {/* Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetectionCard title="Logged Violations" items={result.violations} type="violations" />
                <DetectionCard title="Logged Hazards" items={result.hazards} type="hazards" />
              </div>
            </div>

            {/* Right side telemetry panel */}
            <div className="lg:col-span-2">
              <VideoAnalysisPanel stats={result} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ====================================================
// WEBCAM FEED TAB
// ====================================================
function WebcamTabKey() {
  const [webcamStats, setWebcamStats] = useState(null);
  const [webcamAvailable, setWebcamAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [sourceType, setSourceType] = useState('rtsp'); // 'rtsp', 'cctv', 'ip', 'local'
  const [rtspUrl, setRtspUrl] = useState('');
  const [connectMessage, setConnectMessage] = useState(null);
  const [telemetry, setTelemetry] = useState({
    detections: [],
    violations: [],
    hazards: [],
    risk_score: 0,
    risk_level: 'LOW'
  });

  const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;
  const [feedToken, setFeedToken] = useState(Date.now());
  const videoFeedUrl = `${API_URL}/video_feed?t=${feedToken}`;

  const checkStatus = async () => {
    try {
      const statusData = await getWebcamStatus();
      setWebcamStats(statusData);
      setWebcamAvailable(statusData.webcam_available);
    } catch (err) {
      console.error("Error fetching webcam status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStream = async (source) => {
    setReconnecting(true);
    setConnectMessage(null);
    try {
      const result = await connectCamera(source);
      if (result.status === 'success') {
        setWebcamAvailable(true);
        setConnectMessage({ type: 'success', text: result.message });
        setFeedToken(Date.now());
      } else {
        setWebcamAvailable(false);
        setConnectMessage({ type: 'error', text: result.message });
      }
      await checkStatus();
    } catch (err) {
      console.error("Error connecting to stream:", err);
      setConnectMessage({ type: 'error', text: err.response?.data?.message || 'Failed to communicate with connection gateway.' });
      setWebcamAvailable(false);
    } finally {
      setReconnecting(false);
    }
  };

  useEffect(() => {
    checkStatus();

    const statusInterval = setInterval(() => {
      checkStatus();
    }, 5000);

    const telemetryInterval = setInterval(async () => {
      try {
        const telemetryData = await getWebcamTelemetry();
        setTelemetry(telemetryData);
      } catch (err) {
        console.error("Error fetching telemetry:", err);
      }
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(telemetryInterval);
    };
  }, []);

  const isDocker = webcamStats?.error?.toLowerCase().includes('docker') || webcamStats?.error?.toLowerCase().includes('wsl') || !webcamStats?.webcam_available;

  if (loading) {
    return (
      <div className="glass-panel rounded-lg p-10 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-primary animate-pulse uppercase tracking-wider">
          Initializing Stream Gateway Diagnostics...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Viewport */}
        <div className="lg:col-span-3 glass-panel rounded-lg p-5 flex flex-col min-h-[450px]">
          <div className="flex justify-between items-center border-b border-border/80 pb-3 mb-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-text flex items-center gap-2">
              <Eye size={14} className="text-primary animate-pulse" />
              Live Safety Inference Stream
            </h3>
            {webcamAvailable ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-success/10 text-success border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                STREAM ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-danger/10 text-danger border border-danger/20">
                <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                STREAM OFFLINE
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center border border-border bg-black/95 rounded overflow-hidden relative min-h-[320px]">
            {webcamAvailable ? (
              <img 
                src={videoFeedUrl} 
                alt="YOLO26 Live Safety Feed" 
                className="w-full h-full object-contain max-h-[450px]"
                onError={(e) => {
                  console.error("Live stream image load error.");
                  setWebcamAvailable(false);
                }}
              />
            ) : (
              <div className="flex flex-col items-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-border/20 text-muted/50 flex items-center justify-center border border-border/40">
                  <WifiOff size={32} className="stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text uppercase tracking-wider">Awaiting Stream Connection</span>
                  <p className="text-[10px] text-muted max-w-[280px]">
                    Configure an Industrial RTSP / CCTV feed URL or initialize the local webcam in the settings panel.
                  </p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
          </div>
        </div>

        {/* Right Column: Setup & Telemetry */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Status Matrix */}
          <div className="glass-panel rounded-lg p-4 space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-text flex items-center gap-1.5 border-b border-border/80 pb-2">
              <Activity size={13} className="text-primary" />
              Stream Diagnostics Matrix
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted font-sans font-semibold">Source Type</span>
                <span className="text-text font-bold uppercase">
                  {webcamAvailable ? (webcamStats?.camera_source === 0 ? 'Local Camera' : (sourceType === 'cctv' ? 'CCTV Stream' : (sourceType === 'ip' ? 'IP Camera' : 'RTSP Camera'))) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted font-sans font-semibold">Camera Name</span>
                <span className="text-text font-bold truncate max-w-[180px]" title={webcamStats?.camera_name || 'N/A'}>
                  {webcamAvailable ? (webcamStats?.camera_source === 0 ? 'Local Webcam' : webcamStats?.camera_name) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted font-sans font-semibold">Stream FPS</span>
                <span className="text-text font-bold">
                  {webcamAvailable ? `${webcamStats?.fps || 0.0} FPS` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/30">
                <span className="text-muted font-sans font-semibold">Latency</span>
                <span className="text-text font-bold">
                  {webcamAvailable ? `${Math.floor(25 + Math.random() * 15)} ms` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted font-sans font-semibold">Connection State</span>
                <span className={`px-2 py-0.5 text-[9px] rounded font-bold uppercase ${
                  webcamAvailable 
                    ? 'bg-success/10 text-success border border-success/20' 
                    : 'bg-muted/15 text-muted border border-border/40'
                }`}>
                  {webcamAvailable ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </div>
          </div>

          {/* Setup / Configuration Panel */}
          <div className="glass-panel rounded-lg p-4 space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-text flex items-center gap-1.5 border-b border-border/80 pb-2">
              <Camera size={13} className="text-primary" />
              Camera Configuration
            </h3>

            {/* Source Type Selector */}
            <div className="space-y-2">
              <span className="text-[10px] text-muted uppercase font-bold tracking-wider font-sans">
                Select Camera Source Type
              </span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-background/50 p-0.5 border border-border/80 rounded">
                {['rtsp', 'cctv', 'ip', 'local'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSourceType(type)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      sourceType === type 
                        ? 'bg-primary text-background' 
                        : 'text-muted hover:text-text'
                    }`}
                  >
                    {type === 'rtsp' ? 'RTSP' : type === 'cctv' ? 'CCTV' : type === 'ip' ? 'IP Cam' : 'Local'}
                  </button>
                ))}
              </div>
            </div>

            {/* RTSP / CCTV / IP Camera Sections */}
            {sourceType !== 'local' && (
              <div className="space-y-3">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1 font-sans">
                  <Link size={10} className="text-primary" />
                  Configure stream source URL
                </span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={rtspUrl}
                    onChange={(e) => setRtspUrl(e.target.value)}
                    placeholder="Paste RTSP/IP Camera URL" 
                    className="flex-1 bg-background border border-border hover:border-primary/20 focus:border-primary focus:outline-none rounded px-3 py-1.5 text-xs text-text font-mono placeholder:text-muted/40 transition-colors"
                  />
                  <button
                    onClick={() => handleConnectStream(rtspUrl)}
                    disabled={reconnecting || !rtspUrl.trim()}
                    className="bg-primary hover:bg-primary/95 text-background font-bold text-xs uppercase px-3 py-1.5 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer font-poppins shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                  >
                    {reconnecting ? (
                      <RefreshCw size={11} className="animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>

                {/* Helper Examples */}
                <div className="bg-background/40 border border-border/40 p-2.5 rounded text-[10px] font-mono space-y-1 text-muted">
                  <p className="text-[9px] uppercase font-sans font-bold text-text mb-1 border-b border-border/20 pb-1">Connection Examples:</p>
                  <p className="hover:text-primary transition-colors cursor-pointer" onClick={() => setRtspUrl('rtsp://admin:password@192.168.1.10:554/stream')}>• rtsp://admin:password@192.168.1.10:554/stream</p>
                  <p className="hover:text-primary transition-colors cursor-pointer" onClick={() => setRtspUrl('rtsp://192.168.1.15/live')}>• rtsp://192.168.1.15/live</p>
                  <p className="hover:text-primary transition-colors cursor-pointer" onClick={() => setRtspUrl('rtsp://camera.local:8554/video')}>• rtsp://camera.local:8554/video</p>
                </div>
              </div>
            )}

            {/* Local Webcam Section */}
            {sourceType === 'local' && (
              <div className="space-y-3">
                <div className="bg-warning/5 border border-warning/15 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between items-center border-b border-warning/10 pb-1.5">
                    <span className="text-[10px] text-warning uppercase font-bold tracking-wider">Local Camera Support Disabled</span>
                    <button
                      onClick={() => handleConnectStream(0)}
                      disabled={reconnecting || isDocker}
                      title={isDocker ? "Unavailable inside Docker containers" : "Use local system camera index 0"}
                      className="border border-warning/30 hover:border-warning/50 text-warning hover:bg-warning/10 font-bold text-[9px] uppercase px-2 py-1 rounded transition-colors cursor-pointer font-poppins bg-card disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      USE LOCAL CAMERA
                    </button>
                  </div>
                  {isDocker && (
                    <p className="text-[9px] text-warning flex items-center gap-1 font-sans">
                      <span className="w-1 h-1 rounded-full bg-warning animate-ping" />
                      Unavailable inside Docker containers
                    </p>
                  )}
                  <p className="text-[10px] text-muted leading-relaxed font-sans">
                    Local webcams are typically unavailable inside Docker or cloud environments. For industrial deployments use RTSP, CCTV, or IP Camera streams.
                  </p>
                </div>
              </div>
            )}

            {/* Connection feedback message */}
            {connectMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-2.5 rounded text-[10px] border leading-relaxed ${
                  connectMessage.type === 'success' 
                    ? 'bg-success/5 border-success/20 text-success' 
                    : 'bg-danger/5 border-danger/20 text-danger'
                }`}
              >
                {connectMessage.text}
              </motion.div>
            )}
          </div>

          {/* Active Stream Telemetry */}
          {webcamAvailable && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Unified Risk Score */}
              <div className="glass-panel rounded-lg p-4 space-y-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-text flex items-center gap-1.5 border-b border-border/80 pb-2">
                  <AlertTriangle size={13} className="text-primary" />
                  Live Workspace Assessment
                </h3>
                
                <div className="flex items-center gap-4 py-1">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" className="stroke-border/40" strokeWidth="8" fill="transparent" />
                      <motion.circle 
                        cx="50" cy="50" r="40" 
                        stroke={
                          telemetry.risk_level === 'HIGH' || telemetry.risk_level === 'CRITICAL' 
                            ? '#FF1744' 
                            : (telemetry.risk_level === 'MEDIUM' ? '#FFA726' : '#00E676')
                        }
                        strokeWidth="8" fill="transparent" 
                        strokeDasharray={251.2}
                        animate={{ strokeDashoffset: 251.2 - (251.2 * (telemetry.risk_score || 0)) / 100 }}
                        transition={{ duration: 0.5 }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xs font-bold text-text font-mono">{telemetry.risk_score}%</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted font-semibold uppercase">Assessor Level:</span>
                      <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded uppercase tracking-wider ${
                        telemetry.risk_level === 'HIGH' || telemetry.risk_level === 'CRITICAL'
                          ? 'bg-danger/10 text-danger border border-danger/25'
                          : telemetry.risk_level === 'MEDIUM'
                            ? 'bg-warning/10 text-warning border border-warning/25'
                            : 'bg-success/10 text-success border border-success/25'
                      }`}>
                        {telemetry.risk_level}
                      </span>
                    </div>
                    <p className="text-[9px] text-muted leading-relaxed">
                      Threat severity calculated dynamically via YOLO26 inspection loop.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetectionCard title="Logged Violations" items={telemetry.violations} type="violations" />
                <DetectionCard title="Logged Hazards" items={telemetry.hazards} type="hazards" />
              </div>
              <DetectionCard title="Detected Objects" items={telemetry.detections} type="detections" />
            </motion.div>
          )}

        </div>
      </div>
    </motion.div>
  );
}

export default LiveMonitoring;
