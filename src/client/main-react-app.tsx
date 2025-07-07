import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

console.log('⚛️ React主应用开始加载');

// 导入组件
import Dashboard from './components/Dashboard';
import DeviceInfo from './components/DeviceInfo';
import SignalMonitor from './components/SignalMonitor';
import CellManagement from './components/CellManagement';
import CellScan from './components/CellScan';
import ATConsole from './components/ATConsole';
import Settings from './components/Settings';

// 主应用组件
function ReactMainApp() {
  const [currentPage, setCurrentPage] = useState('overview');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 初始化用户信息
  useEffect(() => {
    console.log('🔍 初始化React应用用户信息');
    
    // 从全局变量获取用户信息
    if (window.currentUser) {
      setUser(window.currentUser);
      console.log('✅ 获取到用户信息:', window.currentUser);
    } else {
      // 从localStorage获取
      const savedUser = localStorage.getItem('mt5700m-user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log('✅ 从localStorage获取用户信息:', userData);
        } catch (error) {
          console.error('❌ 用户信息解析失败:', error);
          handleLogout();
        }
      } else {
        console.log('⚠️ 未找到用户信息，返回登录页面');
        handleLogout();
      }
    }
  }, []);

  // 处理退出登录
  const handleLogout = () => {
    console.log('🚪 React应用处理退出登录');
    
    // 清除状态
    localStorage.removeItem('mt5700m-user');
    window.currentUser = null;
    window.isLoggedIn = false;
    
    // 尝试调用API退出
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    }).catch(() => {
      // 忽略API错误
    });
    
    // 重新加载页面回到登录界面
    window.location.reload();
  };

  // 页面切换
  const switchPage = (page) => {
    console.log('📄 切换到页面:', page);
    setCurrentPage(page);
  };

  // 渲染当前页面内容
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Dashboard user={user} />;
      case 'device-info':
        return <DeviceInfo user={user} />;
      case 'signal-monitor':
        return <SignalMonitor user={user} />;
      case 'cell-management':
        return <CellManagement user={user} />;
      case 'cell-scan':
        return <CellScan user={user} />;
      case 'at-console':
        return <ATConsole user={user} />;
      case 'settings':
        return <Settings user={user} onLogout={handleLogout} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  // 页面标题映射
  const pageTitles = {
    'overview': '系统概览',
    'device-info': '设备信息',
    'signal-monitor': '信号监控',
    'cell-management': '小区管理',
    'cell-scan': '小区扫描',
    'at-console': 'AT控制台',
    'settings': '系统设置'
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化应用...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex flex-col h-full">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="text-2xl mr-2">📡</div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">MT5700M</h1>
                  <p className="text-xs text-gray-500">WebUI</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-gray-100"
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {[
                { id: 'overview', icon: '🏠', label: '系统概览' },
                { id: 'device-info', icon: '📊', label: '设备信息' },
                { id: 'signal-monitor', icon: '📶', label: '信号监控' },
                { id: 'cell-management', icon: '🗼', label: '小区管理' },
                { id: 'cell-scan', icon: '🔍', label: '小区扫描' },
                { id: 'at-console', icon: '📟', label: 'AT控制台' },
                { id: 'settings', icon: '⚙️', label: '系统设置' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => switchPage(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg mr-3">{item.icon}</span>
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              ))}
            </div>
          </nav>

          {/* 用户信息 */}
          <div className="p-4 border-t">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="w-full mt-2 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                🚪 退出登录
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {pageTitles[currentPage] || '系统概览'}
            </h1>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">设备已连接</span>
              </div>
              
              <div className="text-sm text-gray-500">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-6">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}

// 错误边界
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⚛️ React应用错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-red-50">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">React应用错误</h1>
            <p className="text-gray-600 mb-4">应用遇到了错误，请刷新页面重试。</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 启动React应用
const container = document.getElementById('react-app');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <ReactMainApp />
    </ErrorBoundary>
  );
  console.log('✅ React主应用挂载成功');
} else {
  console.error('❌ 找不到React应用容器');
}
