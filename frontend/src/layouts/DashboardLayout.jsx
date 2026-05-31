import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Brain, 
  Video, 
  Server, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert,
  Activity,
  Check,
  AlertOctagon,
  Menu,
  X
} from 'lucide-react';
import { getHealth } from '../services/api';

function SidebarContent({ 
  isMobileVersion, 
  collapsed, 
  setCollapsed, 
  setMobileOpen, 
  healthStatus, 
  backendOnline, 
  navItems, 
  location 
}) {
  return (
    <>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,212,255,0.15)]">
            <ShieldAlert size={20} className="stroke-[2.5]" />
          </div>
          {(!collapsed || isMobileVersion) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col whitespace-nowrap"
            >
              <span className="font-poppins font-bold text-sm tracking-widest text-text">ZENTRIX AI</span>
              <span className="text-[10px] text-muted font-medium uppercase tracking-tight">Worker Intel</span>
            </motion.div>
          )}
        </div>
        {isMobileVersion ? (
          <button 
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded border border-border bg-card text-muted hover:text-text hover:border-danger/45 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        ) : (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-6 h-6 rounded border border-border bg-card text-muted hover:text-text hover:border-primary/45 transition-colors cursor-pointer"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all group relative ${
                isActive ? 'text-text font-medium' : 'text-muted hover:text-text hover:bg-card/30'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={isMobileVersion ? "activeSidebarIndicatorMobile" : "activeSidebarIndicatorDesktop"}
                  className="absolute inset-0 bg-primary/10 border-l-[3px] border-primary rounded-md pointer-events-none"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <Icon size={18} className={`z-10 relative transition-colors duration-200 ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
              {(!collapsed || isMobileVersion) && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm whitespace-nowrap z-10 relative"
                >
                  {item.name}
                </motion.span>
              )}
              {(collapsed && !isMobileVersion) && (
                <div className="absolute left-14 bg-card border border-border text-text text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-[0_0_15px_rgba(0,212,255,0.15)]">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Status Card */}
      <div className="p-4 border-t border-border bg-background/20">
        {(!collapsed || isMobileVersion) ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3 rounded-lg border border-border/70 bg-card/60 p-3"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Gateway Status</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                backendOnline 
                  ? 'bg-success/10 text-success border border-success/20' 
                  : 'bg-danger/10 text-danger border border-danger/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-success animate-pulse shadow-[0_0_8px_#00E676]' : 'bg-danger shadow-[0_0_8px_#FF1744]'}`} />
                {backendOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted font-medium">YOLO Engine</span>
                {healthStatus?.yolo_object_detection === 'online' ? (
                  <span className="text-success font-semibold flex items-center gap-0.5"><Check size={10} /> OK</span>
                ) : (
                  <span className="text-danger font-semibold flex items-center gap-0.5"><AlertOctagon size={10} /> ERR</span>
                )}
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted font-medium">Risk ML Model</span>
                {healthStatus?.text_ml_pipeline === 'online' ? (
                  <span className="text-success font-semibold flex items-center gap-0.5"><Check size={10} /> OK</span>
                ) : (
                  <span className="text-danger font-semibold flex items-center gap-0.5"><AlertOctagon size={10} /> ERR</span>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full border border-border/80 flex items-center justify-center p-0.5 ${
              backendOnline ? 'bg-success/20' : 'bg-danger/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-success shadow-[0_0_6px_#00E676]' : 'bg-danger shadow-[0_0_6px_#FF1744]'}`} />
            </span>
          </div>
        )}
      </div>
    </>
  );
}

function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });
  const [healthStatus, setHealthStatus] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Risk Prediction', path: '/risk-prediction', icon: Brain },
    { name: 'Live Monitoring', path: '/live-monitoring', icon: Video },
    { name: 'System Health', path: '/system-health', icon: Server },
  ];

  // Track window resizing for tablet auto-collapse and mobile check
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      if (width >= 768 && width < 1024) {
        setCollapsed(true);
      } else if (width >= 1024) {
        setCollapsed(false);
      }
    };
    handleResize(); // run once initially
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile drawer overlay on navigation changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Poll system health for the sidebar diagnostic summary
  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const data = await getHealth();
        setHealthStatus(data);
        setBackendOnline(data.status === 'healthy' || data.status === 'degraded');
      } catch (err) {
        setBackendOnline(false);
        setHealthStatus(null);
      }
    };

    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 1. Desktop Sidebar Navigation (Only visible on md and up) */}
      {!isMobile && (
        <motion.div 
          animate={{ width: collapsed ? '72px' : '260px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="hidden md:flex flex-col flex-shrink-0 h-full border-r border-border bg-panel/75 backdrop-blur-md text-muted select-none relative"
        >
          <SidebarContent 
            isMobileVersion={false}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            setMobileOpen={setMobileOpen}
            healthStatus={healthStatus}
            backendOnline={backendOnline}
            navItems={navItems}
            location={location}
          />
        </motion.div>
      )}

      {/* 2. Mobile Drawer Navigation Overlay (Only visible on screens below md) */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex flex-col h-screen w-[260px] border-r border-border bg-panel/75 backdrop-blur-md text-muted select-none shadow-2xl md:hidden"
            >
              <SidebarContent 
                isMobileVersion={true}
                collapsed={false}
                setCollapsed={setCollapsed}
                setMobileOpen={setMobileOpen}
                healthStatus={healthStatus}
                backendOnline={backendOnline}
                navItems={navItems}
                location={location}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden w-full">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between min-h-[4rem] py-3 px-4 sm:px-6 border-b border-border bg-panel/75 backdrop-blur-md z-10 gap-3">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button 
                onClick={() => setMobileOpen(true)}
                className="flex md:hidden items-center justify-center w-11 h-11 rounded border border-border bg-card text-muted hover:text-text hover:border-primary/45 transition-colors cursor-pointer"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-baseline gap-2 flex-wrap">
              <h1 className="font-poppins font-semibold text-base sm:text-lg text-text tracking-wide">
                {navItems.find(item => item.path === location.pathname)?.name || 'Platform'}
              </h1>
              <span className="text-xs text-muted">/</span>
              <span className="text-[10px] sm:text-xs text-muted uppercase tracking-wider font-semibold font-poppins">
                Zentrix Safety Node
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-card border border-border text-xs text-muted shadow-[0_0_8px_rgba(0,212,255,0.05)]">
              <Activity size={14} className="text-primary animate-pulse shadow-[0_0_6px_#00D4FF]" />
              <span className="font-mono">Inference Latency: 1.05ms</span>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-transparent">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-6"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
