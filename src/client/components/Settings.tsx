import React, { useState } from 'react';

interface SettingsProps {
  user: any;
  onLogout: () => void;
}

export default function Settings({ user, onLogout }: SettingsProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">系统设置</h2>

      {/* 用户信息 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">账户信息</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">用户名:</span>
            <span className="text-gray-900 font-medium">{user?.username || '未知'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">角色:</span>
            <span className="text-gray-900 font-medium">{user?.role === 'admin' ? '管理员' : '用户'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">登录时间:</span>
            <span className="text-gray-900 font-medium">{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 界面设置 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">界面设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 font-medium">深色模式</label>
              <p className="text-sm text-gray-500">切换到深色主题</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 font-medium">自动刷新</label>
              <p className="text-sm text-gray-500">自动刷新设备数据</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {autoRefresh && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">刷新间隔</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* 系统操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系统操作</h3>
        <div className="space-y-4">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🚪 退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
