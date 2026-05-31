import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

function DetectionCard({ title, items, type }) {
  const styles = {
    detections: {
      header: 'text-primary font-semibold',
      border: 'border-primary/20',
      icon: ShieldCheck,
      iconColor: 'text-primary',
    },
    violations: {
      header: 'text-danger font-semibold',
      border: 'border-danger/20',
      icon: ShieldAlert,
      iconColor: 'text-danger',
    },
    hazards: {
      header: 'text-warning font-semibold',
      border: 'border-warning/20',
      icon: AlertTriangle,
      iconColor: 'text-warning',
    },
  };

  const config = styles[type] || styles.detections;
  const Icon = config.icon;

  // Deduplicate array values
  const uniqueItems = items ? Array.from(new Set(items)) : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-panel p-4 rounded-lg space-y-3"
    >
      <h3 className={`text-xs uppercase tracking-wider font-bold ${config.header} flex items-center gap-2`}>
        <Icon size={15} className={config.iconColor} />
        {title}
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {uniqueItems.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {uniqueItems.map((item, idx) => (
              <motion.div 
                key={idx} 
                variants={itemVariants}
                className="flex items-center gap-2 text-xs py-1.5 px-2.5 rounded bg-background/40 border border-border/50 hover:border-primary/30 transition-colors"
              >
                {type === 'violations' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-danger shadow-[0_0_6px_#FF1744]" />
                ) : type === 'hazards' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-warning shadow-[0_0_6px_#FFA726]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_#00D4FF]" />
                )}
                <span className="font-mono text-text">{item}</span>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-xs text-muted/50 py-2 font-medium italic">
            {type === 'violations' || type === 'hazards' ? 'Clear - No compliance issues' : 'No objects detected'}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default DetectionCard;
