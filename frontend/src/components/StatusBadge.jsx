import React from 'react';
import { motion } from 'framer-motion';

function StatusBadge({ status }) {
  if (!status) return null;
  const normalized = status.toUpperCase();
  
  const config = {
    ONLINE: {
      bg: 'bg-success/10 text-success border-success/30 shadow-[0_0_10px_rgba(0,230,118,0.15)]',
      dot: 'bg-success shadow-[0_0_8px_#00E676]',
      label: 'ONLINE',
    },
    HEALTHY: {
      bg: 'bg-success/10 text-success border-success/30 shadow-[0_0_10px_rgba(0,230,118,0.15)]',
      dot: 'bg-success shadow-[0_0_8px_#00E676]',
      label: 'HEALTHY',
    },
    OFFLINE: {
      bg: 'bg-danger/10 text-danger border-danger/30 shadow-[0_0_10px_rgba(255,23,68,0.15)]',
      dot: 'bg-danger shadow-[0_0_8px_#FF1744]',
      label: 'OFFLINE',
    },
    DEGRADED: {
      bg: 'bg-warning/10 text-warning border-warning/30 shadow-[0_0_10px_rgba(255,167,38,0.15)]',
      dot: 'bg-warning shadow-[0_0_8px_#FFA726]',
      label: 'DEGRADED',
    },
    WARNING: {
      bg: 'bg-warning/10 text-warning border-warning/30 shadow-[0_0_10px_rgba(255,167,38,0.15)]',
      dot: 'bg-warning shadow-[0_0_8px_#FFA726]',
      label: 'WARNING',
    },
    OPTIONAL: {
      bg: 'bg-warning/10 text-warning border-warning/30 shadow-[0_0_10px_rgba(255,167,38,0.15)]',
      dot: 'bg-warning shadow-[0_0_8px_#FFA726]',
      label: 'OPTIONAL',
    },
  };

  const current = config[normalized] || {
    bg: 'bg-muted/10 text-muted border-muted/30',
    dot: 'bg-muted',
    label: normalized,
  };

  return (
    <motion.span 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded border relative overflow-hidden ${current.bg}`}
    >
      <span className="relative flex h-2 w-2">
        {normalized !== 'OFFLINE' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </span>
      {current.label}
    </motion.span>
  );
}

export default StatusBadge;
