import React, { useState } from 'react';
import Login from '../pages/Login';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  // 立即检查认证状态，不使用useEffect
  const getInitialAuthState = () => {
    try {
      const savedUser = localStorage.getItem('mt5700m-user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        console.log('✅ 发现已保存的用户信息，自动登录:', user.username);
        return true;
      } else {
        console.log('🔓 未找到登录信息，显示登录界面');
        return false;
      }
    } catch (error) {
      console.error('❌ 检查认证状态失败:', error);
      return false;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState);

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
