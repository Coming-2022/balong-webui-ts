import React, { useState, useEffect } from 'react';

interface DashboardProps {
  user: any;
}

interface DeviceData {
  device: {
    manufacturer?: string;
    model?: string;
    revision?: string;
    imei?: string;
  };
  signal: {
    rsrp?: number;
    rsrq?: number;
    sinr?: string;
    sysmode?: string;
  };
  temperature: {
    temperature?: string;
  };
  network: {
    operator?: string;
    status?: string;
  };
}

export default function Dashboard({ user }: DashboardProps) {
  const [deviceData, setDeviceData] = useState<DeviceData>({
    device: {},
    signal: {},
    temperature: {},
    network: {}
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  // 加载数据
  const loadData = async () => {
    try {
      console.log('📊 Dashboard加载数据');
      setLoading(true);
      
      // 模拟数据作为后备
      const mockData: DeviceData = {
        device: {
          manufacturer: 'Quectel',
          model: 'MT5700M',
          revision: 'MT5700M-CN_V1.0.0',
          imei: '123456789012345'
        },
        signal: {
          rsrp: -85,
          rsrq: -12,
          sinr: '15.0 dB',
          sysmode: 'NR'
        },
        temperature: {
          temperature: '45°C'
        },
        network: {
          operator: '中国移动',
          status: '已连接'
        }
      };

      try {
        // 并行加载真实数据
        const [deviceRes, signalRes, tempRes] = await Promise.allSettled([
          fetch('/api/device/info', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/signal', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/device/temperature', { credentials: 'include' }).then(r => r.json())
        ]);

        const realData: DeviceData = {
          device: deviceRes.status === 'fulfilled' && deviceRes.value.success ? deviceRes.value.data : mockData.device,
          signal: signalRes.status === 'fulfilled' && signalRes.value.success ? signalRes.value.data : mockData.signal,
          temperature: tempRes.status === 'fulfilled' && tempRes.value.success ? tempRes.value.data : mockData.temperature,
          network: mockData.network
        };

        setDeviceData(realData);
        console.log('✅ Dashboard数据加载完成:', realData);
      } catch (error) {
        console.log('⚠️ API加载失败，使用模拟数据');
        setDeviceData(mockData);
      }

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Dashboard数据加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // 每30秒刷新一次
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 格式化网络制式
  const formatNetworkType = (sysmode?: string) => {
    const types: { [key: string]: string } = {
      'NR': '5G',
      'LTE': '4G LTE',
      'WCDMA': '3G WCDMA',
      'GSM': '2G GSM'
    };
    return types[sysmode || ''] || sysmode || '未知';
  };

  // 获取信号强度状态
  const getSignalStatus = (rsrp?: number) => {
    if (!rsrp) return { color: 'text-gray-500', text: '未知' };
    if (rsrp >= -80) return { color: 'text-green-500', text: '优秀' };
    if (rsrp >= -90) return { color: 'text-blue-500', text: '良好' };
    if (rsrp >= -100) return { color: 'text-yellow-500', text: '一般' };
    return { color: 'text-red-500', text: '较差' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载系统概览...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">欢迎回来，{user?.username}！</h2>
          {lastUpdate && (
            <p className="text-sm text-gray-600 mt-1">最后更新: {lastUpdate}</p>
          )}
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? '刷新中...' : '🔄 刷新数据'}
        </button>
      </div>

      {/* 状态卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 设备状态 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📱</div>
            <div>
              <p className="text-sm font-medium text-gray-600">设备状态</p>
              <p className="text-2xl font-bold text-green-600">🟢 在线</p>
            </div>
          </div>
        </div>

        {/* 网络制式 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🌐</div>
            <div>
              <p className="text-sm font-medium text-gray-600">网络制式</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNetworkType(deviceData.signal.sysmode)}
              </p>
            </div>
          </div>
        </div>

        {/* 设备温度 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🌡️</div>
            <div>
              <p className="text-sm font-medium text-gray-600">设备温度</p>
              <p className="text-2xl font-bold text-gray-900">
                {deviceData.temperature.temperature || '未知'}
              </p>
            </div>
          </div>
        </div>

        {/* 信号强度 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📶</div>
            <div>
              <p className="text-sm font-medium text-gray-600">信号强度</p>
              <p className={`text-2xl font-bold ${getSignalStatus(deviceData.signal.rsrp).color}`}>
                {deviceData.signal.rsrp ? `${deviceData.signal.rsrp} dBm` : '未知'}
              </p>
              <p className="text-xs text-gray-500">
                {getSignalStatus(deviceData.signal.rsrp).text}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 详细信息卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 设备信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">ℹ️</span>
            设备信息
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">制造商:</span>
              <span className="text-gray-900 font-medium">{deviceData.device.manufacturer || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">型号:</span>
              <span className="text-gray-900 font-medium">{deviceData.device.model || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">固件版本:</span>
              <span className="text-gray-900 font-medium">{deviceData.device.revision || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IMEI:</span>
              <span className="text-gray-900 font-mono text-sm">{deviceData.device.imei || '未知'}</span>
            </div>
          </div>
        </div>

        {/* 信号信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📡</span>
            信号信息
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">RSRP:</span>
              <span className={`font-medium ${getSignalStatus(deviceData.signal.rsrp).color}`}>
                {deviceData.signal.rsrp ? `${deviceData.signal.rsrp} dBm` : '未知'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">RSRQ:</span>
              <span className="text-gray-900 font-medium">
                {deviceData.signal.rsrq ? `${deviceData.signal.rsrq} dB` : '未知'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SINR:</span>
              <span className="text-gray-900 font-medium">{deviceData.signal.sinr || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">系统模式:</span>
              <span className="text-gray-900 font-medium">{deviceData.signal.sysmode || '未知'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2">📊</span>
            <span className="text-sm font-medium">设备信息</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2">📶</span>
            <span className="text-sm font-medium">信号监控</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2">🔍</span>
            <span className="text-sm font-medium">小区扫描</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2">📟</span>
            <span className="text-sm font-medium">AT控制台</span>
          </button>
        </div>
      </div>
    </div>
  );
}
