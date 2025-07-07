import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import Login from '../pages/Login';
import ChangePassword from '../pages/ChangePassword';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [forceShowLogin, setForceShowLogin] = useState(false);
  
  // 直接使用store选择器
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const needsSetup = useAuthStore((state) => state.needsSetup);
  const needsPasswordChange = useAuthStore((state) => state.needsPasswordChange);

  useEffect(() => {
    console.log('🔐 AuthGuard 简化版启动');
    
    // 1秒后强制停止加载，直接显示登录界面
    const timer = setTimeout(() => {
      console.log('⏰ 强制停止加载，显示登录界面');
      setIsLoading(false);
      if (!isAuthenticated) {
        setForceShowLogin(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // 调试日志
  useEffect(() => {
    console.log('🔐 AuthGuard 状态:', {
      isLoading,
      isAuthenticated,
      needsSetup,
      needsPasswordChange,
      hasUser: !!user,
      forceShowLogin
    });
  }, [isLoading, isAuthenticated, needsSetup, needsPasswordChange, user, forceShowLogin]);

  // 显示加载界面 - 最多1秒
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">📡</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">正在加载应用程序...</p>
          <p className="text-gray-500 text-sm mt-2">最多1秒</p>
        </div>
      </div>
    );
  }

  // 需要初始设置
  if (needsSetup) {
    console.log('🔧 显示初始设置页面');
    return <Login isSetup={true} />;
  }

  // 需要修改密码
  if (needsPasswordChange) {
    console.log('🔑 显示密码修改页面');
    return <ChangePassword />;
  }

  // 未认证或强制显示登录，显示登录页面
  if (!isAuthenticated || forceShowLogin) {
    console.log('🔓 显示登录页面');
    return <Login />;
  }

  // 已认证，显示主应用
  console.log('✅ 显示主应用内容');
  return <>{children}</>;
}
