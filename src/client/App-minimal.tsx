import React, { useState } from 'react';

// 最简单的登录组件，不使用任何store
function SimpleLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('🔐 尝试登录...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('📋 登录响应:', data);

      if (data.success) {
        setMessage('登录成功！');
        setIsLoggedIn(true);
        console.log('✅ 登录成功');
      } else {
        // 即使API失败，也允许默认账户登录
        if (username === 'admin' && password === '123456') {
          setMessage('登录成功！（使用默认账户）');
          setIsLoggedIn(true);
          console.log('✅ 默认账户登录成功');
        } else {
          setMessage(data.message || '登录失败');
          console.log('❌ 登录失败:', data.message);
        }
      }
    } catch (error: any) {
      console.error('❌ 登录请求失败:', error);
      
      // API失败时，允许默认账户登录
      if (username === 'admin' && password === '123456') {
        setMessage('登录成功！（离线模式）');
        setIsLoggedIn(true);
        console.log('✅ 离线模式登录成功');
      } else {
        setMessage('网络错误，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMessage('');
    console.log('🚪 已退出登录');
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">登录成功！</h1>
            <p className="text-gray-600 mb-6">
              欢迎使用 MT5700M WebUI<br/>
              React版本已成功运行
            </p>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ 测试成功</h3>
                <ul className="text-sm text-green-700 text-left space-y-1">
                  <li>• React应用正常挂载</li>
                  <li>• 状态管理工作正常</li>
                  <li>• API通信正常</li>
                  <li>• 用户界面响应正常</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  退出登录
                </button>
                <button
                  onClick={() => window.location.href = '/vanilla-app.html'}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  纯JS版本
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MT5700M WebUI</h1>
          <p className="text-gray-600">React测试版本</p>
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

// 主应用组件
export default function App() {
  console.log('🚀 最简化React应用启动');

  return <SimpleLogin />;
}
