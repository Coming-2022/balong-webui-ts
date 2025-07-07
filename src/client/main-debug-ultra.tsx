import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

console.log('🚀 超级调试版本开始加载...');

// 全局调试函数
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 🔍 ${message}`, data || '');
  
  // 同时显示在页面上
  const debugDiv = document.getElementById('debug-info');
  if (debugDiv) {
    const logEntry = document.createElement('div');
    logEntry.style.fontSize = '12px';
    logEntry.style.color = '#666';
    logEntry.style.marginBottom = '2px';
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugDiv.appendChild(logEntry);
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
}

// 最简单的状态管理
let appState = {
  isLoggedIn: false,
  user: null,
  showDashboard: false
};

function updateAppState(newState: any) {
  debugLog('📝 更新应用状态', { from: appState, to: newState });
  appState = { ...appState, ...newState };
  renderApp();
}

// 登录组件
function LoginComponent() {
  debugLog('🔓 渲染登录组件');
  
  return React.createElement('div', {
    className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'
  }, [
    React.createElement('div', {
      key: 'login-card',
      className: 'bg-white p-8 rounded-lg shadow-lg max-w-md w-full'
    }, [
      // 标题
      React.createElement('div', {
        key: 'header',
        className: 'text-center mb-8'
      }, [
        React.createElement('div', {
          key: 'icon',
          className: 'text-6xl mb-4'
        }, '📡'),
        React.createElement('h1', {
          key: 'title',
          className: 'text-2xl font-bold text-gray-900 mb-2'
        }, 'MT5700M WebUI'),
        React.createElement('p', {
          key: 'subtitle',
          className: 'text-gray-600'
        }, '超级调试版本')
      ]),
      
      // 调试信息区域
      React.createElement('div', {
        key: 'debug-area',
        id: 'debug-info',
        style: {
          height: '150px',
          overflow: 'auto',
          backgroundColor: '#f3f4f6',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px',
          fontSize: '12px'
        }
      }),
      
      // 测试按钮
      React.createElement('div', {
        key: 'buttons',
        className: 'space-y-3'
      }, [
        React.createElement('button', {
          key: 'test-login',
          className: 'w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600',
          onClick: () => {
            debugLog('🔘 测试登录按钮被点击');
            
            setTimeout(() => {
              debugLog('⏰ 延迟执行登录逻辑');
              updateAppState({
                isLoggedIn: true,
                user: { username: 'admin', role: 'admin' },
                showDashboard: true
              });
            }, 100);
          }
        }, '测试登录'),
        
        React.createElement('button', {
          key: 'direct-switch',
          className: 'w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600',
          onClick: () => {
            debugLog('🔘 直接切换按钮被点击');
            debugLog('📊 准备显示仪表板');
            
            // 立即切换
            appState.showDashboard = true;
            debugLog('✅ 状态已更新，准备重新渲染');
            renderApp();
          }
        }, '直接切换到仪表板'),
        
        React.createElement('button', {
          key: 'force-render',
          className: 'w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600',
          onClick: () => {
            debugLog('🔘 强制重新渲染按钮被点击');
            renderApp();
          }
        }, '强制重新渲染')
      ])
    ])
  ]);
}

// 仪表板组件
function DashboardComponent() {
  debugLog('📊 渲染仪表板组件');
  
  return React.createElement('div', {
    className: 'min-h-screen bg-gray-50'
  }, [
    // 顶部导航
    React.createElement('nav', {
      key: 'nav',
      className: 'bg-white shadow-sm border-b border-gray-200'
    }, [
      React.createElement('div', {
        key: 'nav-content',
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
      }, [
        React.createElement('div', {
          key: 'nav-inner',
          className: 'flex justify-between h-16'
        }, [
          React.createElement('div', {
            key: 'nav-left',
            className: 'flex items-center'
          }, [
            React.createElement('div', {
              key: 'nav-icon',
              className: 'text-2xl mr-3'
            }, '📡'),
            React.createElement('h1', {
              key: 'nav-title',
              className: 'text-xl font-bold text-gray-900'
            }, 'MT5700M WebUI - 仪表板')
          ]),
          
          React.createElement('div', {
            key: 'nav-right',
            className: 'flex items-center space-x-4'
          }, [
            React.createElement('button', {
              key: 'logout-btn',
              className: 'text-sm text-red-600 hover:text-red-800',
              onClick: () => {
                debugLog('🚪 退出按钮被点击');
                updateAppState({
                  isLoggedIn: false,
                  user: null,
                  showDashboard: false
                });
              }
            }, '退出登录')
          ])
        ])
      ])
    ]),
    
    // 主内容
    React.createElement('main', {
      key: 'main',
      className: 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'
    }, [
      React.createElement('div', {
        key: 'main-content',
        className: 'px-4 py-6 sm:px-0'
      }, [
        React.createElement('div', {
          key: 'success-message',
          className: 'bg-green-50 border border-green-200 rounded-lg p-6 text-center'
        }, [
          React.createElement('div', {
            key: 'success-icon',
            className: 'text-6xl mb-4'
          }, '🎉'),
          React.createElement('h2', {
            key: 'success-title',
            className: 'text-2xl font-bold text-green-800 mb-2'
          }, '页面切换成功！'),
          React.createElement('p', {
            key: 'success-desc',
            className: 'text-green-700'
          }, '恭喜！React应用的页面切换功能正常工作。'),
          React.createElement('div', {
            key: 'success-time',
            className: 'mt-4 text-sm text-green-600'
          }, `切换时间: ${new Date().toLocaleTimeString()}`)
        ])
      ])
    ])
  ]);
}

// 主应用组件
function MainApp() {
  debugLog('🏠 渲染主应用组件', { appState });
  
  if (appState.showDashboard) {
    debugLog('✅ 显示仪表板');
    return DashboardComponent();
  } else {
    debugLog('🔓 显示登录页面');
    return LoginComponent();
  }
}

// 渲染函数
let root: any = null;

function renderApp() {
  debugLog('🎨 开始渲染应用', { appState });
  
  const container = document.getElementById('root');
  if (!container) {
    debugLog('❌ 找不到root容器');
    return;
  }
  
  if (!root) {
    debugLog('🆕 创建React根');
    root = createRoot(container);
  }
  
  try {
    debugLog('🔄 执行渲染');
    root.render(React.createElement(MainApp));
    debugLog('✅ 渲染完成');
  } catch (error) {
    debugLog('❌ 渲染失败', error);
  }
}

// 启动应用
debugLog('🚀 启动超级调试版本');

// 等待DOM加载完成
if (document.readyState === 'loading') {
  debugLog('⏳ 等待DOM加载完成');
  document.addEventListener('DOMContentLoaded', () => {
    debugLog('✅ DOM加载完成，开始渲染');
    renderApp();
  });
} else {
  debugLog('✅ DOM已就绪，立即渲染');
  renderApp();
}

// 全局错误捕获
window.addEventListener('error', (e) => {
  debugLog('❌ 全局错误', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  debugLog('❌ 未处理的Promise错误', e.reason);
});

debugLog('✅ 超级调试版本初始化完成');
