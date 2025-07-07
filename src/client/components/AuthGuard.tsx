import React, { useEffect, useState } from 'react';
import Login from '../pages/Login';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthGuard启动 - 检查认证状态');
    
    // 立即检查localStorage中的登录状态
    const checkAuthStatus = () => {
      try {
        const savedUser = localStorage.getItem('mt5700m-user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          console.log('✅ 发现已保存的用户信息，自动登录:', user.username);
          setIsAuthenticated(true);
        } else {
          console.log('🔓 未找到登录信息，显示登录界面');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ 检查认证状态失败:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // 立即执行检查，不延迟
    checkAuthStatus();
  }, []);

  // 处理登录成功
  const handleLoginSuccess = (user: any) => {
    console.log('✅ 登录成功:', user.username);
    localStorage.setItem('mt5700m-user', JSON.stringify(user));
    setIsAuthenticated(true);
  };

  // 处理退出登录
  const handleLogout = () => {
    console.log('🚪 退出登录');
    localStorage.removeItem('mt5700m-user');
    setIsAuthenticated(false);
  };

  // 如果正在加载，显示简单的加载状态（避免闪烁）
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📡</div>
          <div className="text-lg text-gray-600">正在初始化...</div>
        </div>
      </div>
    );
  }

  // 如果未认证，直接显示登录页面
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 如果已认证，显示主应用
  return (
    <div>
      {React.cloneElement(children as React.ReactElement, { onLogout: handleLogout })}
    </div>
  );
}
