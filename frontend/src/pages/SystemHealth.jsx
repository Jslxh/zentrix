import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Activity, 
  Database, 
  Cpu, 
  FolderOpen,
  Info,
  Terminal,
  RefreshCw,
  HardDrive,
  Video
} from 'lucide-react';
import { getHealth } from '../services/api';
import StatusBadge from '../components/StatusBadge';

function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await getHealth();
      setHealth(data);
      setError(null);
      addLog(`GET /health - STATUS: ${data.status.toUpperCase()} - YOLO: ${data.yolo_object_detection.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      setHealth(null);
      setError('System core gateway is unreachable on port 8000.');
      addLog(`GET /health - STATUS: UNREACHABLE - Gateway communication failure`);
    } finally {
      // Short delay for smooth spinner transitions
      setTimeout(() => {
        setLoading(false);
        setLastUpdated(new Date().toLocaleTimeString());
      }, 500);
    }
  };

  const addLog = (msg) => {
    const timestamp = new Date().toISOString();
    setLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const cardContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 22 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-3 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-poppins font-bold text-text tracking-wide flex items-center gap-2">
            <Server className="text-primary" size={20} />
            Diagnostics Operations Center
          </h2>
          <p className="text-xs text-muted">
            Monitor Flask API gateway endpoints, custom YOLO models, and directories allocation telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted font-mono bg-background/50 border border-border/40 px-2 py-0.5 rounded">Last Sync: {lastUpdated || 'Never'}</span>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchHealth} 
            disabled={loading}
            className="flex items-center gap-1.5 bg-card border border-border hover:border-primary/45 text-text hover:text-primary transition-colors font-bold text-[10px] uppercase py-1.5 px-3 rounded font-poppins cursor-pointer shadow-[0_0_10px_rgba(0,212,255,0.05)]"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Force Refresh
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Telemetry Matrix Grid */}
        <div className="lg:col-span-3 space-y-4">
          <motion.div 
            variants={cardContainerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Backend status card */}
            <motion.div variants={cardVariants} className="glass-panel rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <Cpu size={12} className="text-primary" />
                  Flask Gateway API
                </span>
                <StatusBadge status={health ? health.status : 'offline'} />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Aggregated micro-service communication interface running on port 8000.
              </p>
            </motion.div>

            {/* YOLO Model status card */}
            <motion.div variants={cardVariants} className="glass-panel rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <Activity size={12} className="text-primary" />
                  YOLO26 Safety Engine
                </span>
                <StatusBadge status={health ? health.yolo_object_detection : 'offline'} />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Custom Ultralytics object detection model loaded from model PT parameters directory.
              </p>
            </motion.div>

            {/* Risk model status card */}
            <motion.div variants={cardVariants} className="glass-panel rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <Database size={12} className="text-primary" />
                  Biometrics Sklearn Model
                </span>
                <StatusBadge status={health ? health.text_ml_pipeline : 'offline'} />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Fitted Logistic Regression, StandardScaler, and TF-IDF models loaded from PKL directory.
              </p>
            </motion.div>

            {/* Storage status card */}
            <motion.div variants={cardVariants} className="glass-panel rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <FolderOpen size={12} className="text-primary" />
                  Staging Storage directories
                </span>
                <StatusBadge status={health ? (health.directories?.uploads === 'functional' ? 'online' : 'degraded') : 'offline'} />
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Staging uploads and processed output directories configured under Flask root directory path.
              </p>
            </motion.div>

            {/* Local Camera status card */}
            <motion.div variants={cardVariants} className="glass-panel rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                  <Video size={12} className="text-primary" />
                  Local Camera Service
                </span>
                <StatusBadge status={health && health.webcam_status && health.webcam_status.status === 'online' ? 'online' : 'optional'} />
              </div>
              <div className="text-xs text-muted leading-relaxed">
                {health && health.webcam_status ? (
                  <div className="space-y-1">
                    {health.webcam_status.status === 'online' ? (
                      <>
                        <p>Status: <span className="font-mono text-text bg-background/50 px-1 rounded">ONLINE</span></p>
                        <p>Res: <span className="font-mono text-text bg-background/50 px-1 rounded">{health.webcam_status.resolution}</span></p>
                        <p>Inference: <span className="font-mono text-text bg-background/50 px-1 rounded">{health.webcam_status.inference_fps} FPS</span></p>
                      </>
                    ) : (
                      <>
                        <p className="font-sans font-medium text-warning">Not Available in Docker Environment</p>
                        <p className="text-[10px] text-muted mt-1 leading-relaxed">
                          Local physical cameras cannot be accessed natively inside Docker container sandboxes without host device pass-through configurations.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <p>Real-time local hardware webcam reader (Optional deployment component).</p>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Staging/Storage details list */}
          <AnimatePresence>
            {health && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass-panel rounded-lg p-4 space-y-3"
              >
                <h3 className="text-xs uppercase font-bold tracking-wider text-text flex items-center gap-1.5 border-b border-border/80 pb-2">
                  <HardDrive size={13} className="text-primary animate-pulse" />
                  Hardware Storage Allocation
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                    <span className="text-muted font-medium uppercase font-sans">Staging Uploads Directory</span>
                    <span className="font-mono text-text bg-background/50 border border-border/50 px-2 py-0.5 rounded text-[10px]">
                      {health.directories?.uploads === 'functional' ? 'ALLOCATED (/static/uploads)' : 'FAULT'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted font-medium uppercase font-sans">Processed Output Directory</span>
                    <span className="font-mono text-text bg-background/50 border border-border/50 px-2 py-0.5 rounded text-[10px]">
                      {health.directories?.processed === 'functional' ? 'ALLOCATED (/static/processed)' : 'FAULT'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-danger/10 border border-danger/25 text-danger p-4 rounded-lg flex items-start gap-3 shadow-[0_0_15px_rgba(255,23,68,0.1)]"
            >
              <Info size={18} className="mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase">Operations Gateway Fault</h4>
                <p className="text-xs leading-relaxed text-muted">{error}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Diagnostic Terminal Logs */}
        <div className="lg:col-span-2 space-y-4 h-full">
          <div className="glass-panel rounded-lg p-5 flex flex-col h-[385px] shadow-[0_0_20px_rgba(0,0,0,0.15)]">
            <h3 className="text-xs uppercase font-bold tracking-wider text-text border-b border-border/80 pb-3 flex items-center gap-2">
              <Terminal size={14} className="text-primary" />
              Active System Diagnostics Logs
            </h3>
            
            <div className="flex-1 mt-4 bg-background border border-border rounded p-3 overflow-y-auto font-mono text-[10px] text-primary/85 space-y-1.5 leading-relaxed scrollbar-thin select-text shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
              {logs.length > 0 ? (
                <AnimatePresence>
                  {logs.map((log, idx) => (
                    <motion.div 
                      key={log}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="whitespace-pre-wrap break-all hover:bg-border/10 p-0.5 rounded transition-all"
                    >
                      {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-muted/40 italic py-2 text-center">No logs generated. Polling system health...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default SystemHealth;
