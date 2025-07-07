import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import Login from '../pages/Login';
import ChangePassword from '../pages/ChangePassword';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const initRef = useRef(false);
  
  // 直接使用store选择器，避免hooks的重新渲染问题
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const needsSetup = useAuthStore((state) => state.needsSetup);
  const needsPasswordChange = useAuthStore((state) => state.needsPasswordChange);
  const loading = useAuthStore((state) => state.loading);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);

  // 使用useRef防止重复初始化
  useEffect(() => {
    if (initRef.current || hasInitialized) {
      return;
    }
    
    initRef.current = true;
    
    const initializeAuth = async () => {
      console.log('🔐 AuthGuard 开始初始化');
      
      try {
        // 设置超时保护
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('认证检查超时')), 3000);
        });
        
        // 执行认证检查
        const authPromise = checkAuthStatus();
        
        await Promise.race([authPromise, timeoutPromise]);
        console.log('✅ 认证检查完成');
      } catch (error) {
        console.log('⚠️ 认证检查失败或超时:', error);
        // 即使失败也继续，让用户看到登录界面
      } finally {
        setHasInitialized(true);
        setIsLoading(false);
      }
    };
    
    // 延迟执行，避免同步问题
    const timer = setTimeout(initializeAuth, 100);
    
    // 强制超时保护
    const forceTimeout = setTimeout(() => {
      if (!hasInitialized) {
        console.log('⏰ 强制结束加载状态');
        setHasInitialized(true);
        setIsLoading(false);
      }
    }, 5000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(forceTimeout);
    };
  }, []); // 空依赖数组，只执行一次

  // 调试日志 - 使用独立的effect
  useEffect(() => {
    if (hasInitialized) {
      console.log('🔐 AuthGuard 状态:', {
        isAuthenticated,
        needsSetup,
        needsPasswordChange,
        hasUser: !!user,
        loading
      });
    }
  }, [isAuthenticated, needsSetup, needsPasswordChange, user, loading, hasInitialized]);

  // 显示加载界面
  if (isLoading || (!hasInitialized && loading)) {
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
