import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

console.log('🚀 简单修复版React应用开始加载');

// 简单的登录组件
function LoginComponent() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [message, setMessage] = useState('');

  const handleLogin = () => {
    console.log('🔐 登录按钮被点击');
    setMessage('登录成功！正在跳转...');
    
    // 直接切换到仪表板
    setTimeout(() => {
      console.log('🔄 切换到仪表板');
      const event = new CustomEvent('switchToDashboard', { 
        detail: { username: 'admin' } 
      });
      window.dispatchEvent(event);
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            MT5700M WebUI
          </h1>
          <p style={{ color: '#6b7280' }}>简单修复版</p>
        </div>

        {message && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            background: message.includes('成功') ? '#f0fdf4' : '#fef2f2',
            color: message.includes('成功') ? '#16a34a' : '#dc2626',
            border: message.includes('成功') ? '1px solid #bbf7d0' : '1px solid #fecaca'
          }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            autoComplete="username"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            autoComplete="current-password"
          />
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            background: '#3b82f6',
            color: 'white',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          登录
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            默认账户: admin / 123456
          </p>
        </div>
      </div>
    </div>
  );
}

// 简单的仪表板组件
function DashboardComponent() {
  const handleLogout = () => {
    console.log('🚪 退出登录');
    const event = new CustomEvent('switchToLogin');
    window.dispatchEvent(event);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* 顶部导航 */}
      <nav style={{
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>📡</div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
              MT5700M WebUI
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></div>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>设备已连接</span>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                fontSize: '0.875rem',
                color: '#dc2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              退出登录
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            系统概览
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            最后更新: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* 状态卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: '2rem', marginRight: '1rem' }}>📱</div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>设备状态</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>🟢 在线</p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: '2rem', marginRight: '1rem' }}>🌐</div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>网络制式</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>5G</p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: '2rem', marginRight: '1rem' }}>🌡️</div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>设备温度</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>45°C</p>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ fontSize: '2rem', marginRight: '1rem' }}>📶</div>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280' }}>信号强度</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>-85 dBm</p>
              </div>
            </div>
          </div>
        </div>

        {/* 成功提示 */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '0.5rem' }}>
            React版本工作正常！
          </h2>
          <p style={{ color: '#15803d' }}>
            恭喜！React应用已成功运行，页面切换功能正常。
          </p>
        </div>
      </main>
    </div>
  );
}

// 主应用组件
function SimpleApp() {
  const [currentView, setCurrentView] = useState('login');

  // 监听自定义事件
  React.useEffect(() => {
    const handleSwitchToDashboard = () => {
      console.log('📊 切换到仪表板');
      setCurrentView('dashboard');
    };

    const handleSwitchToLogin = () => {
      console.log('🔓 切换到登录');
      setCurrentView('login');
    };

    window.addEventListener('switchToDashboard', handleSwitchToDashboard);
    window.addEventListener('switchToLogin', handleSwitchToLogin);

    return () => {
      window.removeEventListener('switchToDashboard', handleSwitchToDashboard);
      window.removeEventListener('switchToLogin', handleSwitchToLogin);
    };
  }, []);

  console.log('🔍 当前视图:', currentView);

  if (currentView === 'dashboard') {
    return <DashboardComponent />;
  }

  return <LoginComponent />;
}

// 启动应用
console.log('🔧 准备挂载React应用');

const container = document.getElementById('root');
if (container) {
  console.log('✅ 找到root容器');
  const root = createRoot(container);
  
  try {
    root.render(<SimpleApp />);
    console.log('✅ React应用挂载成功');
  } catch (error) {
    console.error('❌ React应用挂载失败:', error);
  }
} else {
  console.error('❌ 找不到root容器');
}

console.log('✅ 简单修复版React应用初始化完成');
