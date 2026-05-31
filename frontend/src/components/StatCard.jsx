import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';

function CountUp({ value }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const match = String(value).match(/\d+/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const numberValue = parseInt(match[0], 10);
    const startStr = String(value).substring(0, match.index);
    const endStr = String(value).substring(match.index + match[0].length);

    const anim = animate(0, numberValue, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(`${startStr}${Math.floor(latest)}${endStr}`);
      }
    });

    return () => anim.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}

function StatCard({ title, value, subtext, icon: Icon, type = 'primary' }) {
  const borderColors = {
    primary: 'border-l-4 border-l-primary hover:border-primary/45',
    success: 'border-l-4 border-l-success hover:border-success/45',
    warning: 'border-l-4 border-l-warning hover:border-warning/45',
    danger: 'border-l-4 border-l-danger hover:border-danger/45',
  };

  const bgGlow = {
    primary: 'hover:shadow-[0_0_20px_rgba(0,212,255,0.12)]',
    success: 'hover:shadow-[0_0_20px_rgba(0,230,118,0.12)]',
    warning: 'hover:shadow-[0_0_20px_rgba(255,167,38,0.12)]',
    danger: 'hover:shadow-[0_0_20px_rgba(255,23,68,0.12)]',
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
      className={`glass-panel p-5 rounded-lg flex items-center justify-between transition-all duration-300 relative overflow-hidden ${borderColors[type]} ${bgGlow[type]}`}
    >
      {/* Background radial accent glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(30,41,59,0.06),transparent_50%)] pointer-events-none" />

      <div className="space-y-1.5 z-10">
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{title}</span>
        <div className="text-2xl font-bold font-poppins text-text tracking-wide">
          <CountUp value={value} />
        </div>
        {subtext && <p className="text-[10px] text-muted/80 font-medium">{subtext}</p>}
      </div>
      
      {Icon && (
        <div className={`p-3 rounded-lg z-10 transition-colors duration-300 ${
          type === 'primary' ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,212,255,0.05)]' :
          type === 'success' ? 'bg-success/10 text-success border border-success/20 shadow-[0_0_10px_rgba(0,230,118,0.05)]' :
          type === 'warning' ? 'bg-warning/10 text-warning border border-warning/20 shadow-[0_0_10px_rgba(255,167,38,0.05)]' :
          'bg-danger/10 text-danger border border-danger/20 shadow-[0_0_10px_rgba(255,23,68,0.05)]'
        }`}>
          <Icon size={22} className="stroke-[2]" />
        </div>
      )}
    </motion.div>
  );
}

export default StatCard;
