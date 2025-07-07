import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './index.css';

console.log('🚀 MT5700M WebUI React应用启动');

// 渲染应用
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  
  console.log('✅ React 应用挂载成功');
} else {
  console.error('❌ 找不到 root 元素');
}
