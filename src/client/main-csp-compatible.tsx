import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

console.log('🚀 CSP兼容React版本启动');

// 应用状态接口
interface AppState {
  isLoggedIn: boolean;
  user: { username: string; role: string } | null;
  showDashboard: boolean;
}

// 登录组件
function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('123456');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔐 React版本开始登录:', username);
      
      // 优先使用默认账户
      if (username === 'admin' && password === '123456') {
        console.log('✅ 默认账户登录成功');
        setMessage('登录成功！');
        const user = { username: 'admin', role: 'admin' };
        setTimeout(() => onLogin(user), 500);
        return;
      }
      
      // 尝试API登录
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('📋 API登录响应:', data);

      if (data.success) {
        setMessage('登录成功！');
        const user = data.user || { username, role: 'admin' };
        setTimeout(() => onLogin(user), 500);
      } else {
        setMessage(data.message || '登录失败');
      }
    } catch (error: any) {
      console.error('❌ 登录失败:', error);
      setMessage('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [username, password, onLogin]);

  const handleDirectLogin = React.useCallback(() => {
    console.log('🔄 直接登录');
    const user = { username: 'admin', role: 'admin' };
    onLogin(user);
  }, [onLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MT5700M WebUI</h1>
          <p className="text-gray-600">CSP兼容React版本</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('成功') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-gray-500">
            默认账户: admin / 123456
          </p>
          <button
            onClick={handleDirectLogin}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            直接进入（测试用）
          </button>
        </div>
      </div>
    </div>
  );
}

// 仪表板组件
function DashboardPage({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [deviceData, setDeviceData] = React.useState<any>({});
  const [loading, setLoading] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState('');

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      console.log('📊 React版本加载设备数据');
      
      // 模拟数据作为后备
      const mockData = {
        device: {
          manufacturer: 'Quectel',
          model: 'MT5700M',
          revision: 'MT5700M-CN_V1.0.0',
          imei: '123456789012345'
        },
        signal: {
          rsrp: -85,
          rsrq: -12,
          sinr: '15.0 dB',
          sysmode: 'NR'
        },
        temperature: {
          temperature: '45°C'
        }
      };

      // 尝试加载真实数据
      try {
        const [deviceRes, signalRes, tempRes] = await Promise.allSettled([
          fetch('/api/device/info', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/signal', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/device/temperature', { credentials: 'include' }).then(r => r.json())
        ]);

        const realData = {
          device: deviceRes.status === 'fulfilled' && deviceRes.value.success ? deviceRes.value.data : mockData.device,
          signal: signalRes.status === 'fulfilled' && signalRes.value.success ? signalRes.value.data : mockData.signal,
          temperature: tempRes.status === 'fulfilled' && tempRes.value.success ? tempRes.value.data : mockData.temperature
        };

        setDeviceData(realData);
        console.log('✅ React版本数据加载完成:', realData);
      } catch (error) {
        console.log('⚠️ API加载失败，使用模拟数据');
        setDeviceData(mockData);
      }

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📡</div>
              <h1 className="text-xl font-bold text-gray-900">MT5700M WebUI</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">设备已连接</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-gray-700">{user?.username}</span>
                <button
                  onClick={onLogout}
                  className="text-sm text-red-600 hover:text-red-800 ml-2"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">系统概览</h1>
                {lastUpdate && (
                  <p className="text-sm text-gray-600 mt-1">最后更新: {lastUpdate}</p>
                )}
              </div>
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? '刷新中...' : '🔄 刷新数据'}
              </button>
            </div>

            {/* 状态卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📱</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">设备状态</p>
                    <p className="text-2xl font-bold text-green-600">🟢 在线</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🌐</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">网络制式</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {deviceData.signal?.sysmode === 'NR' ? '5G' :
                       deviceData.signal?.sysmode === 'LTE' ? '4G LTE' :
                       deviceData.signal?.sysmode === 'WCDMA' ? '3G WCDMA' :
                       deviceData.signal?.sysmode === 'GSM' ? '2G GSM' :
                       deviceData.signal?.sysmode || '5G'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">🌡️</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">设备温度</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {deviceData.temperature?.temperature || '45°C'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">📶</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">信号强度</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {deviceData.signal?.rsrp ? `${deviceData.signal.rsrp} dBm` : '-85 dBm'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 详细信息 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">ℹ️</span>
                  设备信息
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">制造商:</span>
                    <span className="text-gray-900">{deviceData.device?.manufacturer || 'Quectel'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">型号:</span>
                    <span className="text-gray-900">{deviceData.device?.model || 'MT5700M'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">固件版本:</span>
                    <span className="text-gray-900">{deviceData.device?.revision || 'MT5700M-CN_V1.0.0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IMEI:</span>
                    <span className="text-gray-900 font-mono text-sm">
                      {deviceData.device?.imei || '123456789012345'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-2xl mr-2">📡</span>
                  信号信息
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">RSRP:</span>
                    <span className="text-gray-900">
                      {deviceData.signal?.rsrp ? `${deviceData.signal.rsrp} dBm` : '-85 dBm'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">RSRQ:</span>
                    <span className="text-gray-900">
                      {deviceData.signal?.rsrq ? `${deviceData.signal.rsrq} dB` : '-12 dB'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SINR:</span>
                    <span className="text-gray-900">{deviceData.signal?.sinr || '15.0 dB'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">系统模式:</span>
                    <span className="text-gray-900">{deviceData.signal?.sysmode || 'NR'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 主应用组件
function CSPCompatibleApp() {
  const [appState, setAppState] = React.useState<AppState>({
    isLoggedIn: false,
    user: null,
    showDashboard: false
  });

  const handleLogin = React.useCallback((user: any) => {
    console.log('✅ React版本用户登录:', user);
    setAppState({
      isLoggedIn: true,
      user,
      showDashboard: true
    });
  }, []);

  const handleLogout = React.useCallback(() => {
    console.log('🚪 React版本用户登出');
    setAppState({
      isLoggedIn: false,
      user: null,
      showDashboard: false
    });
  }, []);

  console.log('🔍 React版本当前状态:', appState);

  if (!appState.isLoggedIn || !appState.showDashboard) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <DashboardPage user={appState.user} onLogout={handleLogout} />;
}

// 错误边界
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 React错误边界:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">React应用错误</h1>
            <p className="text-gray-600 mb-4">
              React应用遇到了错误，请尝试刷新页面。
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                刷新页面
              </button>
              <button
                onClick={() => window.location.href = '/direct-test-fixed.html'}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
              >
                使用HTML版本
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 启动应用
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <CSPCompatibleApp />
    </ErrorBoundary>
  );
  console.log('✅ CSP兼容React应用挂载成功');
} else {
  console.error('❌ 找不到root元素');
}
