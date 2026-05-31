import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  User, 
  ShieldAlert, 
  Activity, 
  HelpCircle,
  FileText,
  Clock,
  Compass,
  ArrowRight,
  TrendingDown,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { predictRisk } from '../services/api';

function SkeletonLoader() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full space-y-5"
    >
      <div className="border border-border/50 bg-background/25 p-4 rounded-md space-y-3 animate-pulse">
        <div className="h-4 bg-border/40 rounded w-1/3"></div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-border/40"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-border/40 rounded w-1/2"></div>
            <div className="h-3 bg-border/40 rounded w-full"></div>
            <div className="h-3 bg-border/40 rounded w-4/5"></div>
          </div>
        </div>
      </div>
      <div className="bg-background/25 border border-border/50 p-4 rounded-md flex flex-col items-center justify-center space-y-3 animate-pulse">
        <div className="h-3 bg-border/40 rounded w-1/4"></div>
        <div className="h-8 bg-border/40 rounded w-1/3"></div>
        <div className="w-full bg-border/30 h-1.5 rounded-full"></div>
      </div>
    </motion.div>
  );
}

function RiskPrediction() {
  const [formData, setFormData] = useState({
    age: 35,
    department: 'Assembly Line',
    shift_duration_hrs: 8,
    audio_alert_flag: 'No',
    ppe_compliance_score: 0.95,
    reported_symptoms: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const departments = [
    'Assembly Line', 'Boiler Room', 'Chemical Processing', 
    'Electrical Unit', 'Foundry', 'Heavy Machinery', 
    'Mining Section', 'Paint Shop', 'Warehouse', 'Welding Unit'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    });
  };

  const handleSliderChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: parseFloat(value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await predictRisk(formData);
      if (data.status === 'success' || data.risk_level) {
        const rLevel = (data.risk_level || 'UNKNOWN').toUpperCase();
        setResult({
          riskLevel: rLevel,
          score: rLevel === 'LOW' ? 20 : (rLevel === 'MEDIUM' ? 60 : 90),
        });
      } else {
        throw new Error(data.message || 'Failed to parse assessment response.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to communicate with safety classification server.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskDetails = (level) => {
    const config = {
      LOW: {
        color: 'text-success border-success/30 bg-success/5',
        badge: 'bg-success/15 text-success border border-success/30',
        icon: CheckCircle2,
        action: 'Clear for standard duty. Keep checking wearable diagnostics logs.',
      },
      MEDIUM: {
        color: 'text-warning border-warning/30 bg-warning/5',
        badge: 'bg-warning/15 text-warning border border-warning/30',
        icon: AlertTriangle,
        action: 'Restrict heavy machinery operations. Perform localized PPE compliance audit and verify hydration metrics.',
      },
      HIGH: {
        color: 'text-danger border-danger/30 bg-danger/5',
        badge: 'bg-danger/15 text-danger border border-danger/30',
        icon: XCircle,
        action: 'IMMEDIATE WORK STOPPAGE. Revoke shift authorization, escort worker to safety station, and alert clinical safety officer.',
      },
    };
    return config[level] || config.LOW;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-poppins font-bold text-text tracking-wide flex items-center gap-2">
          <Brain className="text-primary" size={20} />
          Biometric Predictive AI Risk Assessor
        </h2>
        <p className="text-xs text-muted">
          Input worker biometric parameters and Shift duration details to calculate operational health index metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 glass-panel rounded-lg p-5 space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.15)]">
          <h3 className="text-xs uppercase font-bold tracking-wider text-text border-b border-border/80 pb-3 flex items-center gap-2">
            <User size={14} className="text-primary" />
            Worker Diagnostics Form
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Age input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase flex items-center gap-1">
                <FileText size={11} /> Worker Age (Years)
              </label>
              <input 
                type="number" 
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="18" 
                max="85"
                required
                className="w-full bg-background border border-border hover:border-primary/30 focus:border-primary/50 text-text rounded px-3 py-2 text-xs focus:outline-none transition-colors font-mono"
              />
            </div>

            {/* Department select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase flex items-center gap-1">
                <Compass size={11} /> Assigned Sector
              </label>
              <select 
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full bg-background border border-border hover:border-primary/30 focus:border-primary/50 text-text rounded px-3 py-2 text-xs focus:outline-none transition-colors cursor-pointer"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Shift duration slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-muted uppercase">
                <span className="flex items-center gap-1"><Clock size={11} /> Shift Duration</span>
                <span className="font-mono text-primary font-bold">{formData.shift_duration_hrs} Hrs</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="16" 
                step="0.5"
                value={formData.shift_duration_hrs}
                onChange={(e) => handleSliderChange('shift_duration_hrs', e.target.value)}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Audio Alert Triggered select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase flex items-center gap-1">
                <ShieldAlert size={11} /> Wearable Alert Triggered?
              </label>
              <select 
                name="audio_alert_flag"
                value={formData.audio_alert_flag}
                onChange={handleInputChange}
                className="w-full bg-background border border-border hover:border-primary/30 focus:border-primary/50 text-text rounded px-3 py-2 text-xs focus:outline-none transition-colors cursor-pointer"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          {/* PPE Compliance Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold text-muted uppercase">
              <span className="flex items-center gap-1"><Activity size={11} /> Wearable PPE Index</span>
              <span className="font-mono text-primary font-bold">{(formData.ppe_compliance_score * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.01"
              value={formData.ppe_compliance_score}
              onChange={(e) => handleSliderChange('ppe_compliance_score', e.target.value)}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Symptoms input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase flex items-center gap-1">
              <FileText size={11} /> Symptoms & Telemetry Incident logs
            </label>
            <textarea 
              name="reported_symptoms"
              value={formData.reported_symptoms}
              onChange={handleInputChange}
              rows="3"
              placeholder="Provide qualitative wear logs (e.g. 'feeling dizzy due to extreme high furnace heat, minor head pain')"
              className="w-full bg-background border border-border hover:border-primary/30 focus:border-primary/50 text-text rounded px-3 py-2 text-xs focus:outline-none transition-colors placeholder:text-muted/40 font-poppins"
            />
          </div>

          <motion.button 
            type="submit" 
            disabled={loading}
            whileTap={{ scale: 0.985 }}
            className="w-full bg-primary hover:bg-primary/95 text-background font-bold text-xs uppercase py-2.5 px-4 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer font-poppins shadow-[0_0_15px_rgba(0,212,255,0.2)]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Compute Predictive Safety Index
                <ArrowRight size={14} />
              </>
            )}
          </motion.button>
        </form>

        {/* Results Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-lg p-5 space-y-4 h-full min-h-[350px] flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.15)] relative">
            <h3 className="text-xs uppercase font-bold tracking-wider text-text border-b border-border pb-3 flex items-center gap-2">
              <TrendingDown size={14} className="text-primary" />
              Safety Diagnostics Outcome
            </h3>

            <div className="flex-1 flex flex-col justify-center items-center w-full">
              <AnimatePresence mode="wait">
                {loading ? (
                  <SkeletonLoader key="skeleton" />
                ) : error ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-6 space-y-3"
                  >
                    <XCircle className="text-danger mx-auto" size={32} />
                    <h4 className="text-xs font-bold text-text uppercase">Inference Request Failed</h4>
                    <p className="text-xs text-muted leading-relaxed max-w-[220px]">{error}</p>
                    <button 
                      type="button"
                      onClick={handleSubmit}
                      className="bg-primary hover:bg-primary/90 text-background font-bold text-[10px] uppercase py-1.5 px-3 rounded flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <RefreshCw size={10} /> Retry Prediction
                    </button>
                  </motion.div>
                ) : result ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-full space-y-5"
                  >
                    {/* Risk Level Alert card */}
                    {(() => {
                      const details = getRiskDetails(result.riskLevel);
                      const Icon = details.icon;
                      return (
                        <div className={`border p-4 rounded-md space-y-3 ${details.color} shadow-[inset_0_0_12px_rgba(0,0,0,0.2)]`}>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase font-bold tracking-widest font-mono">Assessor Report</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-poppins ${details.badge}`}>
                              {result.riskLevel} RISK
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="mt-0.5"><Icon size={20} className="shadow-[0_0_8px_currentColor]" /></div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold uppercase tracking-wider font-poppins text-text">Recommended Actions</h4>
                              <p className="text-xs leading-relaxed text-muted">{details.action}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Numeric Score Visualization */}
                    <div className="bg-background/20 border border-border/80 p-4 rounded-md flex flex-col items-center justify-center space-y-2">
                      <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Calculated Severity Score</span>
                      <span className={`text-3xl font-bold font-mono ${
                        result.riskLevel === 'HIGH' ? 'text-danger shadow-[0_0_10px_rgba(255,23,68,0.2)]' : (result.riskLevel === 'MEDIUM' ? 'text-warning shadow-[0_0_10px_rgba(255,167,38,0.2)]' : 'text-success shadow-[0_0_10px_rgba(0,230,118,0.2)]')
                      }`}>
                        {result.score} / 100
                      </span>
                      <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden mt-1">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.score}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            result.riskLevel === 'HIGH' ? 'bg-danger' : (result.riskLevel === 'MEDIUM' ? 'bg-warning' : 'bg-success')
                          }`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center space-y-2 p-6"
                  >
                    <HelpCircle size={38} className="text-muted/30 stroke-[1.5]" />
                    <h4 className="text-xs font-bold text-text uppercase tracking-wider">Awaiting Execution</h4>
                    <p className="text-xs text-muted/70 max-w-[240px]">
                      Complete the worker telemetry diagnostics form and click compute to analyze predictions.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default RiskPrediction;
