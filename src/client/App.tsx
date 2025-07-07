import React from 'react';
import { Routes, Route } from 'react-router-dom';

// 组件导入
import AuthGuard from './components/AuthGuard-instant';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ATConsole from './pages/ATConsole';
import DeviceInfo from './pages/DeviceInfo';
import SignalMonitor from './pages/SignalMonitor';
import CellManagement from './pages/CellManagement';
import CellScan from './pages/CellScan';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// 主应用组件
function App() {
  console.log('📱 App组件渲染 - 即时登录版本');

  return (
    <div className="App">
      <AuthGuard>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/at-console" element={<ATConsole />} />
            <Route path="/device-info" element={<DeviceInfo />} />
            <Route path="/signal-monitor" element={<SignalMonitor />} />
            <Route path="/cell-management" element={<CellManagement />} />
            <Route path="/cell-scan" element={<CellScan />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AuthGuard>
    </div>
  );
}

export default App;
