import React, { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  // 导航菜单
  const navigation = [
    { name: '系统概览', href: '/', icon: '🏠' },
    { name: 'AT控制台', href: '/at-console', icon: '📟' },
    { name: '设备信息', href: '/device-info', icon: '📊' },
    { name: '信号监控', href: '/signal-monitor', icon: '📶' },
    { name: '小区管理', href: '/cell-management', icon: '🗼' },
    { name: '小区扫描', href: '/cell-scan', icon: '🔍' },
    { name: '系统设置', href: '/settings', icon: '⚙️' },
  ];

  // 加载用户信息
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('mt5700m-user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }, []);

  // 处理退出登录
  const handleLogout = useCallback(async () => {
    setShowUserMenu(false);
    
    try {
      console.log('🚪 Layout组件处理退出登录');
      
      // 清除本地存储
      localStorage.removeItem('mt5700m-user');
      
      // 尝试调用API退出
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      } catch (error) {
        console.log('API退出失败，忽略:', error);
      }
      
      // 调用父组件的退出函数
      if (onLogout) {
        onLogout();
      } else {
        // 如果没有父组件退出函数，直接刷新页面
        window.location.href = '/';
      }
      
    } catch (error) {
      console.error('退出登录失败:', error);
      // 即使出错也要强制退出
      window.location.href = '/';
    }
  }, [onLogout]);

  const handleUserMenuToggle = useCallback(() => {
    setShowUserMenu(prev => !prev);
  }, []);

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* 侧边栏 */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="text-2xl mr-2">📡</div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">MT5700M WebUI</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">设备管理控制台</p>
              </div>
            </div>
            
            {/* 导航菜单 */}
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/' && location.pathname === '/dashboard');
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 顶部导航栏 */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              {/* 移动端菜单按钮 */}
              <div className="md:hidden">
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <span className="text-xl">☰</span>
                </button>
              </div>
              
              {/* 页面标题 */}
              <div className="flex-1 md:flex-none">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {navigation.find(item => 
                    location.pathname === item.href || 
                    (item.href === '/' && location.pathname === '/dashboard')
                  )?.name || '系统概览'}
                </h2>
              </div>

              {/* 用户菜单 */}
              <div className="relative user-menu">
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-2 text-sm bg-white dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-gray-700 dark:text-gray-300">
                    {user?.username || '用户'}
                  </span>
                  <span className="text-gray-400">▼</span>
                </button>

                {/* 下拉菜单 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-medium">{user?.username || '用户'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.role === 'admin' ? '管理员' : '用户'}
                        </div>
                      </div>
                      
                      <Link
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        ⚙️ 系统设置
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        🚪 退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* 页面内容 */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
