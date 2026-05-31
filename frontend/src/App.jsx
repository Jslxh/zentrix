import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import RiskPrediction from './pages/RiskPrediction';
import LiveMonitoring from './pages/LiveMonitoring';
import SystemHealth from './pages/SystemHealth';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="risk-prediction" element={<RiskPrediction />} />
          <Route path="live-monitoring" element={<LiveMonitoring />} />
          <Route path="system-health" element={<SystemHealth />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
