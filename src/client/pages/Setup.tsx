import React, { useState, useEffect } from 'react';
import { useAuth, useAuthActions } from '../stores/authStore';

export default function Setup() {
  const { loading, error, isAuthenticated, needsSetup } = useAuth();
  const { setup, setError, checkAuthStatus } = useAuthActions();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);

  // 监听认证状态变化
  useEffect(() => {
    if (setupSuccess && isAuthenticated && !needsSetup) {
      console.log('✅ 设置成功，状态已更新，应该会自动跳转');
    }
  }, [setupSuccess, isAuthenticated, needsSetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证输入
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    if (formData.username.length < 3) {
      setError('用户名长度至少3位');
      return;
    }

    console.log('🚀 开始设置管理员账户...');
    const result = await setup(formData);
    
    if (result.success) {
      console.log('✅ 设置成功！');
      setSetupSuccess(true);
      // 强制重新检查认证状态
      setTimeout(() => {
        console.log('🔄 重新检查认证状态...');
        checkAuthStatus();
      }, 1000);
    } else {
      console.error('❌ 设置失败:', result.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo 和标题 */}
        <div className="text-center">
          <div className="text-6xl mb-4">{setupSuccess ? '🎉' : '🚀'}</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {setupSuccess ? '设置成功' : '初始设置'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {setupSuccess 
              ? '管理员账户创建成功，正在跳转到主界面...' 
              : '欢迎使用 MT5700M WebUI，请设置管理员账户'
            }
          </p>
        </div>

        {/* 成功状态 */}
        {setupSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
            <div className="text-green-600 dark:text-green-400 text-lg mb-2">
              ✅ 账户创建成功！
            </div>
            <div className="text-green-700 dark:text-green-300 text-sm">
              用户名: <strong>{formData.username}</strong>
            </div>
            <div className="mt-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-green-600 dark:text-green-400 text-sm mt-2">正在跳转...</p>
            </div>
            {/* 调试信息 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-xs text-gray-500 border-t pt-2">
                <p>调试: isAuthenticated={String(isAuthenticated)}, needsSetup={String(needsSetup)}</p>
              </div>
            )}
          </div>
        )}

        {/* 设置表单 */}
        {!setupSuccess && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex">
                    <div className="text-red-400 text-xl mr-3">⚠️</div>
                    <div className="text-red-700 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {/* 提示信息 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                  <div className="text-blue-400 text-xl mr-3">ℹ️</div>
                  <div className="text-blue-700 dark:text-blue-400 text-sm">
                    <p className="font-medium mb-1">安全提示：</p>
                    <ul className="text-xs space-y-1">
                      <li>• 用户名长度至少3位</li>
                      <li>• 密码长度至少6位</li>
                      <li>• 请使用强密码保护您的系统</li>
                      <li>• 设置完成后请妥善保管账户信息</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 用户名 */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  管理员用户名
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="请输入管理员用户名"
                  disabled={loading}
                />
              </div>

              {/* 密码 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  密码
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="请输入密码（至少6位）"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* 确认密码 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  确认密码
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="请再次输入密码"
                  disabled={loading}
                />
              </div>

              {/* 设置按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    设置中...
                  </div>
                ) : (
                  '完成设置'
                )}
              </button>
            </form>
          </div>
        )}

        {/* 版权信息 */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>MT5700M Balong WebUI - TypeScript版本</p>
          <p className="mt-1">© 2024 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
