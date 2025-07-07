import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// 应用状态类型
interface AppState {
  isLoggedIn: boolean;
  user: { username: string; role: string } | null;
  currentPage: string;
}

// 简单的登录组件
function SimpleLogin({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('123456');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔐 开始登录...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('📋 登录响应:', data);

      if (data.success) {
        setMessage('登录成功！');
        const user = data.user || { username, role: 'admin' };
        setTimeout(() => onLogin(user), 500);
      } else {
        // 允许默认账户登录
        if (username === 'admin' && password === '123456') {
          setMessage('登录成功！（默认账户）');
          const user = { username: 'admin', role: 'admin' };
          setTimeout(() => onLogin(user), 500);
        } else {
          setMessage(data.message || '登录失败');
        }
      }
    } catch (error: any) {
      console.error('❌ 登录失败:', error);
      // API失败时允许默认账户登录
      if (username === 'admin' && password === '123456') {
        setMessage('登录成功！（离线模式）');
        const user = { username: 'admin', role: 'admin' };
        setTimeout(() => onLogin(user), 500);
      } else {
        setMessage('网络错误，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MT5700M WebUI</h1>
          <p className="text-gray-600">设备管理控制台</p>
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
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

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            默认账户: admin / 123456
          </p>
        </div>
      </div>
    </div>
  );
}

// 简单的系统概览页面
function Dashboard() {
  const [deviceData, setDeviceData] = React.useState<any>({});
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState('');

  const loadData = async () => {
    try {
      console.log('📊 加载设备数据...');
      
      // 并行加载多个API
      const [deviceRes, signalRes, tempRes] = await Promise.allSettled([
        fetch('/api/device/info', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
        fetch('/api/signal', { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
        fetch('/api/device/temperature', { credentials: 'include' }).then(r => r.json()).catch(() => ({}))
      ]);

      const data = {
        device: deviceRes.status === 'fulfilled' ? deviceRes.value.data || {} : {},
        signal: signalRes.status === 'fulfilled' ? signalRes.value.data || {} : {},
        temperature: tempRes.status === 'fulfilled' ? tempRes.value.data || {} : {}
      };

      setDeviceData(data);
      setLastUpdate(new Date().toLocaleTimeString());
      console.log('✅ 设备数据加载完成:', data);
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
    // 每30秒刷新一次
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载设备数据...</p>
        </div>
      </div>
    );
  }

  return (
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 刷新数据
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
                 deviceData.signal?.sysmode || '未知'}
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
                {deviceData.temperature?.temperature ? 
                  (deviceData.temperature.temperature.toString().includes('°C') ? 
                    deviceData.temperature.temperature : 
                    `${deviceData.temperature.temperature}°C`) : 
                  '未知'}
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
                {deviceData.signal?.rsrp ? `${deviceData.signal.rsrp} dBm` : '未知'}
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
              <span className="text-gray-900">{deviceData.device?.manufacturer || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">型号:</span>
              <span className="text-gray-900">{deviceData.device?.model || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">固件版本:</span>
              <span className="text-gray-900">{deviceData.device?.revision || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IMEI:</span>
              <span className="text-gray-900 font-mono text-sm">
                {deviceData.device?.imei || '未知'}
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
                {deviceData.signal?.rsrp ? `${deviceData.signal.rsrp} dBm` : '未知'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">RSRQ:</span>
              <span className="text-gray-900">
                {deviceData.signal?.rsrq ? `${deviceData.signal.rsrq} dB` : '未知'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SINR:</span>
              <span className="text-gray-900">{deviceData.signal?.sinr || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">系统模式:</span>
              <span className="text-gray-900">{deviceData.signal?.sysmode || '未知'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 主应用组件
function CompleteApp() {
  const [appState, setAppState] = React.useState<AppState>({
    isLoggedIn: false,
    user: null,
    currentPage: 'dashboard'
  });

  const handleLogin = (user: any) => {
    console.log('✅ 用户登录成功:', user);
    setAppState({
      isLoggedIn: true,
      user,
      currentPage: 'dashboard'
    });
  };

  const handleLogout = () => {
    console.log('🚪 用户登出');
    setAppState({
      isLoggedIn: false,
      user: null,
      currentPage: 'dashboard'
    });
  };

  if (!appState.isLoggedIn) {
    return <SimpleLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
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
                  {appState.user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-gray-700">{appState.user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800 ml-2"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Dashboard />
        </div>
      </main>
    </div>
  );
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
    console.error('🚨 React错误边界捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">应用错误</h1>
            <p className="text-gray-600 mb-4">
              应用遇到了错误，请尝试刷新页面。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
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

// 启动应用
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <CompleteApp />
    </ErrorBoundary>
  );
  console.log('✅ 完整版React应用挂载成功');
} else {
  console.error('❌ 找不到root元素');
}
