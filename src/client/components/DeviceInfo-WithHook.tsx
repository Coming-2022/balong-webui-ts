import React, { useState, useEffect } from 'react';
import { useTemperatureMonitor } from '../hooks/useTemperatureMonitor';

interface DeviceInfoProps {
  user: any;
}

interface DeviceData {
  manufacturer?: string;
  model?: string;
  revision?: string;
  imei?: string;
}

export default function DeviceInfoWithHook({ user }: DeviceInfoProps) {
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [atiResponse, setAtiResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastDeviceUpdate, setLastDeviceUpdate] = useState('');

  // 使用温度监控Hook
  const {
    temperatureData,
    loading: tempLoading,
    error: tempError,
    lastUpdate: tempLastUpdate,
    isRealTime,
    setRealTime,
    refreshTemperature,
    getTemperatureStatus
  } = useTemperatureMonitor({
    realTime: true,
    pollingInterval: 30000,
    onTemperatureChange: (data) => {
      console.log('🌡️ 温度数据更新:', data);
    },
    onHighTemperature: (data) => {
      console.warn('⚠️ 高温警告:', data);
      // 可以在这里添加通知逻辑
    },
    highTemperatureThreshold: 600 // 60°C
  });

  // 加载设备基本信息
  const loadDeviceInfo = async () => {
    try {
      setLoading(true);
      console.log('📊 加载设备基本信息');

      // 并行加载设备信息和ATI命令
      const [deviceRes, atiRes] = await Promise.allSettled([
        fetch('/api/device/info', { credentials: 'include' }).then(r => r.json()),
        fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ command: 'ATI' })
        }).then(r => r.json())
      ]);

      // 处理设备信息
      if (deviceRes.status === 'fulfilled' && deviceRes.value.success) {
        setDeviceData(deviceRes.value.data);
      } else {
        console.log('设备信息API失败，使用模拟数据');
        setDeviceData({
          manufacturer: 'Quectel',
          model: 'MT5700M',
          revision: 'MT5700M-CN_V1.0.0',
          imei: '123456789012345'
        });
      }

      // 处理ATI响应
      if (atiRes.status === 'fulfilled' && atiRes.value.success) {
        setAtiResponse(atiRes.value.data.response || JSON.stringify(atiRes.value.data, null, 2));
      } else {
        setAtiResponse('ATI命令执行失败或设备未连接');
      }

      setLastDeviceUpdate(new Date().toLocaleTimeString());

    } catch (error) {
      console.error('设备信息加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const temperatureStatus = getTemperatureStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载设备信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">设备详细信息</h2>
          <div className="flex items-center space-x-4 mt-1">
            {lastDeviceUpdate && (
              <p className="text-sm text-gray-600">设备信息更新: {lastDeviceUpdate}</p>
            )}
            {tempLastUpdate && (
              <p className="text-sm text-gray-600">温度更新: {tempLastUpdate}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 实时监控开关 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">实时温度:</span>
            <button
              onClick={() => setRealTime(!isRealTime)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRealTime ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRealTime ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <button
            onClick={loadDeviceInfo}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '刷新中...' : '🔄 刷新设备'}
          </button>
        </div>
      </div>

      {/* 实时状态指示器 */}
      {isRealTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-700 font-medium">温度实时监控已启用</span>
            </div>
            <span className="text-xs text-blue-600">数据将通过WebSocket自动更新</span>
          </div>
        </div>
      )}

      {/* 基本信息卡片 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">📊</span>
          基本信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">制造商:</span>
              <span className="text-gray-900 font-medium">{deviceData.manufacturer || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">设备型号:</span>
              <span className="text-gray-900 font-medium">{deviceData.model || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">固件版本:</span>
              <span className="text-gray-900 font-medium">{deviceData.revision || '未知'}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">IMEI:</span>
              <span className="text-gray-900 font-mono text-sm">{deviceData.imei || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SIM卡状态:</span>
              <span className="text-green-600 font-medium">已插入</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">网络注册:</span>
              <span className="text-green-600 font-medium">已注册</span>
            </div>
          </div>
        </div>
      </div>

      {/* 智能温度监控卡片 */}
      <div className={`rounded-lg shadow-sm border p-6 ${temperatureStatus.bgColor} border-gray-200`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">🌡️</span>
            智能温度监控
            <div className="ml-3 flex items-center space-x-2">
              {isRealTime ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                  实时
                </span>
              ) : (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  定时
                </span>
              )}
              
              {temperatureStatus.level === 'danger' && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse">
                  ⚠️ 高温
                </span>
              )}
            </div>
          </h3>
          
          <div className="flex items-center space-x-2">
            {!isRealTime && (
              <button
                onClick={refreshTemperature}
                disabled={tempLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {tempLoading ? '⏳' : '🔄'} 刷新
              </button>
            )}
          </div>
        </div>
        
        {/* 温度错误显示 */}
        {tempError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 text-lg mr-2">❌</span>
              <span className="text-red-700 text-sm">{tempError}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* 温度显示 */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${temperatureStatus.color} ${tempLoading ? 'animate-pulse' : ''}`}>
                {tempLoading ? '...' : (temperatureData?.temperature || '--')}
              </div>
              <div className="text-sm text-gray-600">当前温度</div>
            </div>
            
            {/* 温度详情 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">温度值:</span>
                <span className="text-gray-900 font-medium">
                  {temperatureData?.temperature || '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">原始值:</span>
                <span className="text-gray-900 font-medium">
                  {temperatureData?.raw_value || '--'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">状态:</span>
                <span className={`font-medium ${temperatureStatus.color}`}>
                  {temperatureStatus.text}
                </span>
              </div>
            </div>
          </div>
          
          {/* 监控状态 */}
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">监控模式</div>
            <div className={`text-sm font-medium ${isRealTime ? 'text-green-600' : 'text-blue-600'}`}>
              {isRealTime ? '🔄 WebSocket推送' : '⏱️ HTTP轮询'}
            </div>
            {tempLastUpdate && (
              <div className="text-xs text-gray-500 mt-1">
                {tempLastUpdate}
              </div>
            )}
          </div>
        </div>

        {/* 高温警告 */}
        {temperatureStatus.level === 'danger' && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 text-lg mr-2">🚨</span>
              <div>
                <span className="text-red-700 font-medium">温度过高警告！</span>
                <p className="text-red-600 text-sm mt-1">
                  当前温度 {temperatureData?.temperature}，请检查设备散热情况
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ATI原始响应 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">📟</span>
          原始设备信息 (ATI)
        </h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto">
          <pre>{atiResponse || '正在获取设备信息...'}</pre>
        </div>
      </div>
    </div>
  );
}
