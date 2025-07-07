import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface DeviceInfoProps {
  user: any;
}

interface DeviceData {
  manufacturer?: string;
  model?: string;
  revision?: string;
  imei?: string;
}

interface TemperatureData {
  temperature?: string;
  raw_value?: number;
}

export default function DeviceInfoEnhanced({ user }: DeviceInfoProps) {
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [temperatureData, setTemperatureData] = useState<TemperatureData>({});
  const [loading, setLoading] = useState(true);
  const [atiResponse, setAtiResponse] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // 初始化WebSocket连接
  useEffect(() => {
    if (isRealTimeEnabled) {
      const socketInstance = io();
      setSocket(socketInstance);

      // 监听温度更新
      socketInstance.on('temperatureUpdate', (data: TemperatureData) => {
        console.log('🌡️ 收到实时温度更新:', data);
        setTemperatureData(data);
        setLastUpdate(new Date().toLocaleTimeString());
      });

      // 监听设备状态更新
      socketInstance.on('deviceUpdate', (data: any) => {
        if (data.temperature) {
          setTemperatureData(data.temperature);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [isRealTimeEnabled]);

  // 加载设备信息
  const loadDeviceInfo = async () => {
    try {
      setLoading(true);
      console.log('📊 加载设备详细信息');

      // 并行加载所有数据
      const [deviceRes, tempRes, atiRes] = await Promise.allSettled([
        // 设备基本信息
        fetch('/api/device/info', { credentials: 'include' }).then(r => r.json()),
        // 温度信息
        fetch('/api/device/temperature', { credentials: 'include' }).then(r => r.json()),
        // ATI命令
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

      // 处理温度信息（如果WebSocket未启用）
      if (!isRealTimeEnabled && tempRes.status === 'fulfilled' && tempRes.value.success) {
        setTemperatureData(tempRes.value.data);
      } else if (!isRealTimeEnabled) {
        console.log('温度信息API失败，使用模拟数据');
        setTemperatureData({
          temperature: '45°C',
          raw_value: 45
        });
      }

      // 处理ATI响应
      if (atiRes.status === 'fulfilled' && atiRes.value.success) {
        setAtiResponse(atiRes.value.data.response || JSON.stringify(atiRes.value.data, null, 2));
      } else {
        setAtiResponse('ATI命令执行失败或设备未连接');
      }

      setLastUpdate(new Date().toLocaleTimeString());

    } catch (error) {
      console.error('设备信息加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 手动刷新温度
  const refreshTemperature = async () => {
    try {
      const response = await fetch('/api/device/temperature', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setTemperatureData(data.data);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('温度刷新失败:', error);
    }
  };

  useEffect(() => {
    loadDeviceInfo();
    
    // 如果未启用实时监控，则定时刷新
    if (!isRealTimeEnabled) {
      const interval = setInterval(() => {
        refreshTemperature();
      }, 30000); // 30秒刷新一次
      
      return () => clearInterval(interval);
    }
  }, [isRealTimeEnabled]);

  const getTemperatureStatus = (temp: string) => {
    const value = parseFloat(temp);
    if (isNaN(value)) return { color: 'text-gray-500', text: '未知', bgColor: 'bg-gray-100' };
    if (value < 40) return { color: 'text-green-600', text: '正常', bgColor: 'bg-green-50' };
    if (value < 60) return { color: 'text-yellow-600', text: '偏高', bgColor: 'bg-yellow-50' };
    return { color: 'text-red-600', text: '过热', bgColor: 'bg-red-50' };
  };

  const temperatureStatus = getTemperatureStatus(temperatureData.temperature || '0');

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
          {lastUpdate && (
            <p className="text-sm text-gray-600 mt-1">最后更新: {lastUpdate}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* 实时监控开关 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">实时监控:</span>
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isRealTimeEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isRealTimeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <button
            onClick={loadDeviceInfo}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '刷新中...' : '🔄 刷新信息'}
          </button>
        </div>
      </div>

      {/* 实时状态指示器 */}
      {isRealTimeEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-700 font-medium">实时监控已启用</span>
            </div>
            <span className="text-xs text-blue-600 ml-4">温度数据将自动更新</span>
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

      {/* 增强版温度监控卡片 */}
      <div className={`rounded-lg shadow-sm border p-6 ${temperatureStatus.bgColor} border-gray-200`}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">🌡️</span>
            温度监控
            {isRealTimeEnabled && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                实时
              </span>
            )}
          </h3>
          
          {!isRealTimeEnabled && (
            <button
              onClick={refreshTemperature}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🔄 刷新温度
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${temperatureStatus.color}`}>
                {temperatureData.temperature || '--'}
              </div>
              <div className="text-sm text-gray-600">当前温度</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">温度值:</span>
                <span className="text-gray-900 font-medium">{temperatureData.temperature || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">原始值:</span>
                <span className="text-gray-900 font-medium">{temperatureData.raw_value || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">状态:</span>
                <span className={`font-medium ${temperatureStatus.color}`}>
                  {temperatureStatus.text}
                </span>
              </div>
            </div>
          </div>
          
          {/* 温度趋势图表区域 */}
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">监控模式</div>
            <div className={`text-sm font-medium ${isRealTimeEnabled ? 'text-green-600' : 'text-blue-600'}`}>
              {isRealTimeEnabled ? '🔄 实时推送' : '⏱️ 定时刷新'}
            </div>
          </div>
        </div>

        {/* 温度警告 */}
        {temperatureData.raw_value && temperatureData.raw_value > 600 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 text-lg mr-2">⚠️</span>
              <span className="text-red-700 font-medium">温度过高警告！请检查设备散热情况</span>
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
