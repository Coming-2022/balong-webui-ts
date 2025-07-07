import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import Login from '../pages/Login';
import ChangePassword from '../pages/ChangePassword';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  // 直接使用store，避免使用可能有问题的hooks
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const needsSetup = useAuthStore((state) => state.needsSetup);
  const needsPasswordChange = useAuthStore((state) => state.needsPasswordChange);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      console.log('🔐 AuthGuard 初始化开始');
      
      try {
        // 只在未检查过认证状态时才检查
        if (!authChecked) {
          console.log('🔍 检查认证状态...');
          await checkAuthStatus();
          
          if (isMounted) {
            setAuthChecked(true);
          }
        }
      } catch (error) {
        console.log('❌ 认证检查失败:', error);
        if (isMounted) {
          setAuthChecked(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // 设置超时，最多1秒后强制显示界面
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.log('⏰ 认证检查超时，强制显示界面');
        setIsLoading(false);
        setAuthChecked(true);
      }
    }, 1000);

    initAuth();

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []); // 空依赖数组，只执行一次

  // 调试日志 - 使用单独的useEffect避免循环
  useEffect(() => {
    console.log('🔐 AuthGuard 状态:', {
      isLoading,
      authChecked,
      isAuthenticated,
      needsSetup,
      needsPasswordChange,
      hasUser: !!user
    });
  }, [isLoading, authChecked, isAuthenticated, needsSetup, needsPasswordChange, user]);

  // 显示加载界面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">📡</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">正在加载应用程序...</p>
          <p className="text-gray-500 text-sm mt-2">请稍候</p>
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

  // 未认证，显示登录页面
  if (!isAuthenticated) {
    console.log('🔓 显示登录页面');
    return <Login />;
  }

  // 已认证，显示主应用
  console.log('✅ 显示主应用内容');
  return <>{children}</>;
}
