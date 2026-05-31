import React from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Crop, Gauge, Eye, PlaySquare } from 'lucide-react';

function VideoAnalysisPanel({ stats }) {
  if (!stats) return null;

  const metrics = [
    { name: 'Video Size', value: `${parseFloat(stats.video_size_mb || 0).toFixed(2)} MB`, icon: HardDrive },
    { name: 'Resolution', value: stats.resolution || 'N/A', icon: Crop },
    { name: 'Frame Rate', value: `${parseFloat(stats.fps || 0).toFixed(1)} FPS`, icon: PlaySquare },
    { name: 'Total Frames', value: stats.total_frames || 0, icon: PlaySquare },
    { name: 'Inferences', value: stats.processed_frames || 0, icon: Eye },
    { name: 'Peak RAM Usage', value: `${parseFloat(stats.peak_ram_usage_mb || 0).toFixed(1)} MB`, icon: Gauge },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-lg p-4 space-y-3"
    >
      <h3 className="text-xs uppercase tracking-wider font-bold text-text border-b border-border/70 pb-2">
        Inference Processing Telemetry
      </h3>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3"
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div 
              key={m.name} 
              variants={itemVariants}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-background/30 border border-border/40 p-2.5 rounded flex flex-col justify-between hover:border-primary/20 transition-colors"
            >
              <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1">
                <Icon size={10} className="text-primary" />
                {m.name}
              </span>
              <span className="text-xs font-mono font-bold text-text mt-1">{m.value}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export default VideoAnalysisPanel;
