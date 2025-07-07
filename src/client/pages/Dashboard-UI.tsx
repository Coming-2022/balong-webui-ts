import React, { useState, useEffect } from 'react';

// 设备信息类型
interface DeviceInfo {
  manufacturer: string;
  model: string;
  revision: string;
  imei: string;
  loading: boolean;
}

export default function Dashboard() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    manufacturer: 'HUAWEI',
    model: 'MT5700M',
    revision: 'V1.0.0',
    imei: '123456789012345',
    loading: false
  });

  return (
    <div className="space-y-6">
      {/* 基础信息卡片 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📱</span>
          基础信息
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">设备制造商</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {deviceInfo.loading ? (
                <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-16 rounded"></span>
              ) : (
                deviceInfo.manufacturer
              )}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">设备型号</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {deviceInfo.loading ? (
                <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-20 rounded"></span>
              ) : (
                deviceInfo.model
              )}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">固件版本</p>
            <p className="font-medium text-gray-900 dark:text-white text-sm">
              {deviceInfo.loading ? (
                <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-32 rounded"></span>
              ) : (
                deviceInfo.revision
              )}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">IMEI</p>
            <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
              {deviceInfo.loading ? (
                <span className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-28 rounded"></span>
              ) : (
                deviceInfo.imei
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">连接状态</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 dark:text-green-400 font-medium">已连接</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">网络类型</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📶</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">5G NR</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">信号强度</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📡</span>
            <span className="text-green-600 dark:text-green-400 font-medium">优秀</span>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          实时监控
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">信号质量趋势</h3>
            <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">图表区域</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">温度监控</h3>
            <div className="h-32 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">图表区域</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
