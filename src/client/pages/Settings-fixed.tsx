import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';

export default function Settings() {
  // 直接使用store选择器，避免可能的hook问题
  const user = useAuthStore((state) => state.user);
  const changePassword = useAuthStore((state) => state.changePassword);
  const loading = useAuthStore((state) => state.loading);
  
  const darkMode = useAppStore((state) => state.darkMode);
  const autoRefresh = useAppStore((state) => state.autoRefresh);
  const refreshInterval = useAppStore((state) => state.refreshInterval);
  const setDarkMode = useAppStore((state) => state.setDarkMode);
  const setAutoRefresh = useAppStore((state) => state.setAutoRefresh);
  const setRefreshInterval = useAppStore((state) => state.setRefreshInterval);

  const [localSettings, setLocalSettings] = useState({
    notifications: true,
    debugMode: false
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswords: false
  });

  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  // 调试日志
  useEffect(() => {
    console.log('⚙️ Settings页面加载完成');
    console.log('用户信息:', user);
    console.log('当前设置:', { darkMode, autoRefresh, refreshInterval });
  }, [user, darkMode, autoRefresh, refreshInterval]);

  const handleThemeChange = (theme: string) => {
    try {
      console.log('🎨 切换主题:', theme);
      if (theme === 'dark') {
        setDarkMode(true);
      } else if (theme === 'light') {
        setDarkMode(false);
      } else {
        // 跟随系统
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
      }
    } catch (error) {
      console.error('主题切换失败:', error);
    }
  };

  const getCurrentTheme = () => {
    return darkMode ? 'dark' : 'light';
  };

  const handleLocalSettingChange = (key: string, value: any) => {
    try {
      setLocalSettings(prev => ({ ...prev, [key]: value }));
      console.log('📝 本地设置更新:', key, value);
    } catch (error) {
      console.error('本地设置更新失败:', error);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordMessage(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setIsLoading(true);

    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setPasswordMessage({
          type: 'error',
          text: '请填写所有密码字段'
        });
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordMessage({
          type: 'error',
          text: '新密码和确认密码不一致'
        });
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setPasswordMessage({
          type: 'error',
          text: '新密码长度至少6位'
        });
        return;
      }

      console.log('🔑 开始修改密码...');
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      if (result.success) {
        setPasswordMessage({
          type: 'success',
          text: '密码修改成功'
        });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          showPasswords: false
        });
        console.log('✅ 密码修改成功');
      } else {
        setPasswordMessage({
          type: 'error',
          text: result.message || '密码修改失败'
        });
        console.log('❌ 密码修改失败:', result.message);
      }
    } catch (error: any) {
      console.error('❌ 密码修改异常:', error);
      setPasswordMessage({
        type: 'error',
        text: error.message || '密码修改过程中发生错误'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshIntervalChange = (value: number) => {
    try {
      setRefreshInterval(value);
      console.log('⏱️ 刷新间隔更新:', value);
    } catch (error) {
      console.error('刷新间隔更新失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          系统设置
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          管理您的账户设置和应用偏好
        </p>
      </div>

      {/* 用户信息 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          账户信息
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              用户名
            </label>
            <div className="text-gray-900 dark:text-white font-medium">
              {user?.username || '未知用户'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              角色
            </label>
            <div className="text-gray-900 dark:text-white">
              {user?.role === 'admin' ? '管理员' : '用户'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              最后登录
            </label>
            <div className="text-gray-900 dark:text-white">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '未知'}
            </div>
          </div>
        </div>
      </div>

      {/* 外观设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          外观设置
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              主题模式
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={getCurrentTheme() === 'light'}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">浅色模式</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={getCurrentTheme() === 'dark'}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">深色模式</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 数据刷新设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          数据刷新设置
        </h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-3"
            />
            <label htmlFor="autoRefresh" className="text-gray-700 dark:text-gray-300">
              启用自动刷新
            </label>
          </div>
          
          {autoRefresh && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                刷新间隔（秒）
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
                className="block w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={5}>5秒</option>
                <option value={10}>10秒</option>
                <option value={30}>30秒</option>
                <option value={60}>1分钟</option>
                <option value={300}>5分钟</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 其他设置 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          其他设置
        </h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="notifications"
              checked={localSettings.notifications}
              onChange={(e) => handleLocalSettingChange('notifications', e.target.checked)}
              className="mr-3"
            />
            <label htmlFor="notifications" className="text-gray-700 dark:text-gray-300">
              启用通知
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="debugMode"
              checked={localSettings.debugMode}
              onChange={(e) => handleLocalSettingChange('debugMode', e.target.checked)}
              className="mr-3"
            />
            <label htmlFor="debugMode" className="text-gray-700 dark:text-gray-300">
              调试模式
            </label>
          </div>
        </div>
      </div>

      {/* 密码修改 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          修改密码
        </h2>
        
        {passwordMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            passwordMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {passwordMessage.text}
          </div>
        )}
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              当前密码
            </label>
            <input
              type={passwordForm.showPasswords ? 'text' : 'password'}
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              新密码
            </label>
            <input
              type={passwordForm.showPasswords ? 'text' : 'password'}
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              确认新密码
            </label>
            <input
              type={passwordForm.showPasswords ? 'text' : 'password'}
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showPasswords"
              checked={passwordForm.showPasswords}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, showPasswords: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="showPasswords" className="text-sm text-gray-700 dark:text-gray-300">
              显示密码
            </label>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || loading ? '修改中...' : '修改密码'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
