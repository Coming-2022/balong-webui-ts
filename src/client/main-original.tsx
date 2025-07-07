import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 详细的错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 React Error Boundary 捕获错误:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 React Error Boundary 详细信息:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // 发送错误到控制台，便于调试
    console.group('🔍 错误详细信息');
    console.error('错误对象:', error);
    console.error('错误堆栈:', error.stack);
    console.error('组件堆栈:', errorInfo.componentStack);
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
            <div className="text-center mb-6">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                应用程序加载失败
              </h1>
              <p className="text-gray-600 mb-6">
                前端应用遇到了JavaScript错误，请查看详细信息并刷新页面重试。
              </p>
            </div>
            
            {/* 错误详情 */}
            <div className="mb-6">
              <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                <summary className="cursor-pointer text-red-700 font-medium mb-2">
                  🔍 点击查看错误详情
                </summary>
                <div className="space-y-3 text-sm">
                  {this.state.error && (
                    <div>
                      <h3 className="font-medium text-red-800">错误信息:</h3>
                      <pre className="bg-red-100 p-2 rounded text-red-700 overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                  )}
                  
                  {this.state.error?.stack && (
                    <div>
                      <h3 className="font-medium text-red-800">错误堆栈:</h3>
                      <pre className="bg-red-100 p-2 rounded text-red-700 overflow-auto max-h-32 text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <h3 className="font-medium text-red-800">组件堆栈:</h3>
                      <pre className="bg-red-100 p-2 rounded text-red-700 overflow-auto max-h-32 text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>

            {/* 操作按钮 */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🔄 刷新页面
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🗑️ 清除缓存并刷新
              </button>
              
              <button
                onClick={() => {
                  const errorText = `
错误信息: ${this.state.error?.message || '未知错误'}
错误堆栈: ${this.state.error?.stack || '无堆栈信息'}
组件堆栈: ${this.state.errorInfo?.componentStack || '无组件堆栈'}
用户代理: ${navigator.userAgent}
时间: ${new Date().toISOString()}
                  `.trim();
                  
                  navigator.clipboard.writeText(errorText).then(() => {
                    alert('错误信息已复制到剪贴板');
                  }).catch(() => {
                    console.log('错误信息:', errorText);
                    alert('无法复制，请查看控制台');
                  });
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                📋 复制错误信息
              </button>
            </div>

            {/* 调试提示 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">🔧 调试提示:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 按 F12 打开浏览器开发者工具查看详细错误</li>
                <li>• 检查 Console 标签页的红色错误信息</li>
                <li>• 检查 Network 标签页是否有请求失败</li>
                <li>• 尝试无痕模式排除缓存问题</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('🚨 全局JavaScript错误:', event.error);
  console.error('错误详情:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 未处理的Promise拒绝:', event.reason);
  console.error('Promise:', event.promise);
});

// 渲染应用
console.log('🚀 开始渲染React应用...');

try {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  console.log('✅ React应用渲染成功');
} catch (error) {
  console.error('❌ React应用渲染失败:', error);
  
  // 如果React渲染失败，显示基本错误页面
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
        <h1 style="color: #dc2626; margin-bottom: 1rem;">React应用启动失败</h1>
        <p style="color: #6b7280; margin-bottom: 1rem;">应用在初始化时遇到严重错误</p>
        <pre style="background: #fef2f2; padding: 1rem; border-radius: 4px; text-align: left; overflow: auto; font-size: 0.875rem; color: #dc2626;">
${error instanceof Error ? error.stack : String(error)}
        </pre>
        <button onclick="location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; margin-top: 1rem;">
          刷新页面
        </button>
      </div>
    </div>
  `;
}
