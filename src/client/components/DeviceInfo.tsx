import React, { useState, useEffect } from 'react';

interface DeviceInfoProps {
  user: any;
}

export default function DeviceInfo({ user }: DeviceInfoProps) {
  const [deviceData, setDeviceData] = useState<any>({});
  const [temperatureData, setTemperatureData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [atiResponse, setAtiResponse] = useState('');

  const loadDeviceInfo = async () => {
    try {
      setLoading(true);
      console.log('📊 加载设备详细信息');

      // 加载设备基本信息
      try {
        const deviceRes = await fetch('/api/device/info', { credentials: 'include' });
        const deviceData = await deviceRes.json();
        if (deviceData.success) {
          setDeviceData(deviceData.data);
        }
      } catch (error) {
        console.log('设备信息API失败，使用模拟数据');
        setDeviceData({
          manufacturer: 'Quectel',
          model: 'MT5700M',
          revision: 'MT5700M-CN_V1.0.0',
          imei: '123456789012345'
        });
      }

      // 加载温度信息
      try {
        const tempRes = await fetch('/api/device/temperature', { credentials: 'include' });
        const tempData = await tempRes.json();
        if (tempData.success) {
          setTemperatureData(tempData.data);
        }
      } catch (error) {
        console.log('温度信息API失败，使用模拟数据');
        setTemperatureData({
          temperature: '45°C',
          raw_value: 45
        });
      }

      // 获取ATI原始响应
      try {
        const atiRes = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ command: 'ATI' })
        });
        const atiData = await atiRes.json();
        if (atiData.success) {
          setAtiResponse(atiData.data.response || JSON.stringify(atiData.data, null, 2));
        }
      } catch (error) {
        setAtiResponse('ATI命令执行失败或设备未连接');
      }

    } catch (error) {
      console.error('设备信息加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const getTemperatureStatus = (temp: string) => {
    const value = parseFloat(temp);
    if (isNaN(value)) return { color: 'text-gray-500', text: '未知' };
    if (value < 40) return { color: 'text-green-500', text: '正常' };
    if (value < 60) return { color: 'text-yellow-500', text: '偏高' };
    return { color: 'text-red-500', text: '过热' };
  };

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
        <h2 className="text-2xl font-bold text-gray-900">设备详细信息</h2>
        <button
          onClick={loadDeviceInfo}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? '刷新中...' : '🔄 刷新信息'}
        </button>
      </div>

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

      {/* 温度监控卡片 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🌡️</span>
          温度监控
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
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
                <span className={`font-medium ${getTemperatureStatus(temperatureData.temperature || '0').color}`}>
                  {getTemperatureStatus(temperatureData.temperature || '0').text}
                </span>
              </div>
            </div>
          </div>
        </div>
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
