import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// 最小化的测试组件
function MinimalApp() {
  const [step, setStep] = React.useState(0);
  
  React.useEffect(() => {
    console.log('🚀 MinimalApp 组件已挂载');
    
    // 模拟加载步骤
    const timer = setTimeout(() => {
      setStep(1);
      console.log('✅ 第一步完成');
      
      setTimeout(() => {
        setStep(2);
        console.log('✅ 第二步完成');
        
        setTimeout(() => {
          setStep(3);
          console.log('✅ 所有步骤完成，应用就绪');
        }, 1000);
      }, 1000);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (step === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📡</div>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>正在加载应用程序...</div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }
  
  if (step === 1) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔄</div>
          <div style={{ fontSize: '1.5rem' }}>正在初始化组件...</div>
        </div>
      </div>
    );
  }
  
  if (step === 2) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚡</div>
          <div style={{ fontSize: '1.5rem' }}>正在连接服务...</div>
        </div>
      </div>
    );
  }
  
  // 最终的登录界面
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
          <h1 style={{ color: '#333', margin: '0 0 0.5rem 0' }}>MT5700M WebUI</h1>
          <p style={{ color: '#666', margin: 0 }}>测试版本 - 登录界面</p>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>用户名</label>
          <input 
            type="text" 
            defaultValue="admin"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333' }}>密码</label>
          <input 
            type="password" 
            defaultValue="123456"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <button
          onClick={() => {
            console.log('🔐 登录按钮被点击');
            alert('✅ 测试成功！\n\n前端React应用工作正常。\n点击确定返回完整应用。');
            window.location.href = '/';
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          测试登录
        </button>
        
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#f0f8ff', 
          borderRadius: '5px',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <strong>✅ 测试成功标志：</strong>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>页面在3秒内完成加载</li>
            <li>显示此登录界面</li>
            <li>按钮可以点击</li>
            <li>控制台无错误信息</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('🚨 全局JavaScript错误:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 未处理的Promise拒绝:', event.reason);
});

// 渲染应用
console.log('🚀 开始渲染最小化测试应用...');

try {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <MinimalApp />
    </React.StrictMode>
  );
  
  console.log('✅ 最小化测试应用渲染成功');
} catch (error) {
  console.error('❌ 最小化测试应用渲染失败:', error);
  
  // 如果React渲染失败，显示基本错误页面
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui; background: #f5f5f5;">
      <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
        <h1 style="color: #dc2626; margin-bottom: 1rem;">React渲染失败</h1>
        <p style="color: #6b7280; margin-bottom: 1rem;">最小化测试应用无法启动</p>
        <pre style="background: #fef2f2; padding: 1rem; border-radius: 4px; text-align: left; overflow: auto; font-size: 0.875rem; color: #dc2626;">
${error instanceof Error ? error.stack : String(error)}
        </pre>
        <button onclick="location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">
          刷新页面
        </button>
        <div style="margin-top: 1rem;">
          <a href="/debug.html" style="color: #3b82f6; text-decoration: none;">前往调试页面</a>
        </div>
      </div>
    </div>
  `;
}
