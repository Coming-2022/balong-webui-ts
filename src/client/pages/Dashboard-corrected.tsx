import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

interface DashboardData {
  deviceInfo: {
    manufacturer?: string;
    model?: string;
    revision?: string;
    imei?: string;
    timestamp?: string;
  };
  signalData: {
    rsrp?: number | string;
    rsrq?: number | string;
    sinr?: string;
    sysmode?: string;
    timestamp?: string;
  };
  temperatureData: {
    temperature?: string;
    raw_value?: number;
    timestamp?: string;
  };
  lockStatus: {
    status?: 'locked' | 'unlocked' | 'unknown';
    info?: string;
    timestamp?: string;
  };
  networkStatus: {
    operator?: string;
    technology?: string;
    status?: string;
    connectivity?: 'connected' | 'disconnected' | 'testing' | 'unknown';
    ping_result?: {
      success: boolean;
      time?: number;
      error?: string;
    };
    timestamp?: string;
  };
  nrccData: {
    nr_count?: number;
    lte_count?: number;
    nr_records?: any[];
    lte_records?: any[];
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    deviceInfo: {},
    signalData: {},
    temperatureData: {},
    lockStatus: { status: 'unknown' },
    networkStatus: { connectivity: 'unknown' },
    nrccData: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const { socket, isConnected } = useSocket();

  // 激进的超时处理
  useEffect(() => {
    console.log('📊 Dashboard 初始化');
    
    // 3秒后强制完成加载
    const forceTimeout = setTimeout(() => {
      console.warn('⏰ Dashboard 加载超时，强制完成');
      setLoadTimeout(true);
      setLoading(false);
    }, 3000);

    // 快速加载基础数据
    const loadBasicData = async () => {
      try {
        console.log('🔍 开始加载基础数据...');
        
        // 并行加载，每个请求都有超时
        const promises = [
          fetchWithTimeout('/api/device/info', 2000).catch(() => ({ success: false, data: {} })),
          fetchWithTimeout('/api/signal', 2000).catch(() => ({ success: false, data: {} })),
          fetchWithTimeout('/api/device/temperature', 2000).catch(() => ({ success: false, data: {} })),
          fetchWithTimeout('/api/network/status', 2000).catch(() => ({ success: false, data: {} }))
        ];

        const [deviceRes, signalRes, tempRes, networkRes] = await Promise.allSettled(promises);
        
        // 处理结果，即使部分失败也继续
        const newData: DashboardData = {
          deviceInfo: deviceRes.status === 'fulfilled' && deviceRes.value.success ? deviceRes.value.data : {},
          signalData: signalRes.status === 'fulfilled' && signalRes.value.success ? signalRes.value.data : {},
          temperatureData: tempRes.status === 'fulfilled' && tempRes.value.success ? tempRes.value.data : {},
          networkStatus: networkRes.status === 'fulfilled' && networkRes.value.success ? networkRes.value.data : { connectivity: 'unknown' },
          lockStatus: { status: 'unknown' },
          nrccData: {}
        };

        setDashboardData(newData);
        setLastUpdate(new Date().toLocaleTimeString());
        console.log('✅ 基础数据加载完成');
        
      } catch (error) {
        console.error('❌ 数据加载失败:', error);
        setError('数据加载失败，但应用可以继续使用');
      } finally {
        clearTimeout(forceTimeout);
        setLoading(false);
      }
    };

    loadBasicData();

    return () => {
      clearTimeout(forceTimeout);
    };
  }, []);

  // Socket事件监听
  useEffect(() => {
    if (socket && isConnected) {
      console.log('🔌 Dashboard Socket连接已建立');
      
      // 监听实时数据更新
      socket.on('signalUpdate', (data) => {
        console.log('📶 收到信号更新:', data);
        setDashboardData(prev => ({
          ...prev,
          signalData: { ...prev.signalData, ...data }
        }));
        setLastUpdate(new Date().toLocaleTimeString());
      });

      socket.on('temperatureUpdate', (data) => {
        console.log('🌡️ 收到温度更新:', data);
        setDashboardData(prev => ({
          ...prev,
          temperatureData: { ...prev.temperatureData, ...data }
        }));
        setLastUpdate(new Date().toLocaleTimeString());
      });

      return () => {
        socket.off('signalUpdate');
        socket.off('temperatureUpdate');
      };
    }
  }, [socket, isConnected]);

  // 带超时的fetch函数
  const fetchWithTimeout = async (url: string, timeout: number) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        credentials: 'include'
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // 手动刷新数据
  const refreshData = async () => {
    console.log('🔄 手动刷新数据');
    setError(null);
    
    try {
      const promises = [
        fetchWithTimeout('/api/device/info', 3000).catch(() => ({ success: false, data: {} })),
        fetchWithTimeout('/api/signal', 3000).catch(() => ({ success: false, data: {} })),
        fetchWithTimeout('/api/device/temperature', 3000).catch(() => ({ success: false, data: {} })),
        fetchWithTimeout('/api/network/status', 3000).catch(() => ({ success: false, data: {} }))
      ];

      const [deviceRes, signalRes, tempRes, networkRes] = await Promise.allSettled(promises);
      
      const newData: DashboardData = {
        deviceInfo: deviceRes.status === 'fulfilled' && deviceRes.value.success ? deviceRes.value.data : dashboardData.deviceInfo,
        signalData: signalRes.status === 'fulfilled' && signalRes.value.success ? signalRes.value.data : dashboardData.signalData,
        temperatureData: tempRes.status === 'fulfilled' && tempRes.value.success ? tempRes.value.data : dashboardData.temperatureData,
        networkStatus: networkRes.status === 'fulfilled' && networkRes.value.success ? networkRes.value.data : dashboardData.networkStatus,
        lockStatus: dashboardData.lockStatus,
        nrccData: dashboardData.nrccData
      };

      setDashboardData(newData);
      setLastUpdate(new Date().toLocaleTimeString());
      console.log('✅ 数据刷新完成');
    } catch (error) {
      console.error('❌ 数据刷新失败:', error);
      setError('数据刷新失败');
    }
  };

  // 格式化设备状态
  const getDeviceStatus = () => {
    if (dashboardData.networkStatus.connectivity === 'connected') {
      return { text: '在线', color: 'text-green-600', icon: '🟢' };
    } else if (dashboardData.networkStatus.connectivity === 'disconnected') {
      return { text: '离线', color: 'text-red-600', icon: '🔴' };
    } else if (dashboardData.networkStatus.connectivity === 'testing') {
      return { text: '测试中', color: 'text-yellow-600', icon: '🟡' };
    }
    return { text: '未知', color: 'text-gray-600', icon: '⚪' };
  };

  // 格式化网络制式
  const getNetworkTechnology = () => {
    const sysmode = dashboardData.signalData.sysmode;
    const technology = dashboardData.networkStatus.technology;
    
    if (sysmode) {
      // 将系统模式转换为更友好的显示
      switch (sysmode.toUpperCase()) {
        case 'NR':
        case '5G':
          return '5G';
        case 'LTE':
        case '4G':
          return '4G LTE';
        case 'WCDMA':
        case '3G':
          return '3G WCDMA';
        case 'GSM':
        case '2G':
          return '2G GSM';
        default:
          return sysmode;
      }
    }
    
    return technology || '未知';
  };

  // 格式化温度
  const getTemperature = () => {
    const temp = dashboardData.temperatureData.temperature;
    if (!temp) return '未知';
    
    // 如果已经包含°C，直接返回
    if (typeof temp === 'string' && temp.includes('°C')) {
      return temp;
    }
    
    // 如果是数字，添加°C
    const numTemp = parseFloat(temp.toString());
    if (!isNaN(numTemp)) {
      return `${numTemp}°C`;
    }
    
    return temp.toString();
  };

  // 如果仍在加载且没有超时，显示加载状态
  if (loading && !loadTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在加载系统概览...</p>
          <p className="text-xs text-gray-400 mt-2">最多等待3秒</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            系统概览
          </h1>
          {lastUpdate && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              最后更新: {lastUpdate}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'WebSocket已连接' : 'WebSocket未连接'}
            </span>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 刷新数据
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="text-yellow-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">注意</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 超时提示 */}
      {loadTimeout && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="text-blue-400 text-xl mr-3">ℹ️</div>
            <div>
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">信息</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                数据加载超时，显示默认界面。设备功能可能不可用。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 设备状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 设备状态 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📱</div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">设备状态</p>
              <p className={`text-2xl font-bold ${getDeviceStatus().color} dark:text-white`}>
                {getDeviceStatus().icon} {getDeviceStatus().text}
              </p>
            </div>
          </div>
        </div>

        {/* 网络制式 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🌐</div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">网络制式</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {getNetworkTechnology()}
              </p>
            </div>
          </div>
        </div>

        {/* 设备温度 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🌡️</div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">设备温度</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {getTemperature()}
              </p>
            </div>
          </div>
        </div>

        {/* 信号强度 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📶</div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">信号强度</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.signalData?.rsrp ? `${dashboardData.signalData.rsrp} dBm` : '未知'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 设备信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">ℹ️</span>
            设备信息
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">制造商:</span>
              <span className="text-gray-900 dark:text-white">{dashboardData.deviceInfo?.manufacturer || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">型号:</span>
              <span className="text-gray-900 dark:text-white">{dashboardData.deviceInfo?.model || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">固件版本:</span>
              <span className="text-gray-900 dark:text-white">{dashboardData.deviceInfo?.revision || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">IMEI:</span>
              <span className="text-gray-900 dark:text-white font-mono text-sm">
                {dashboardData.deviceInfo?.imei || '未知'}
              </span>
            </div>
          </div>
        </div>

        {/* 网络信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">📡</span>
            网络信息
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">运营商:</span>
              <span className="text-gray-900 dark:text-white">{dashboardData.networkStatus?.operator || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">网络状态:</span>
              <span className="text-gray-900 dark:text-white">{dashboardData.networkStatus?.status || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">RSRP:</span>
              <span className="text-gray-900 dark:text-white">
                {dashboardData.signalData?.rsrp ? `${dashboardData.signalData.rsrp} dBm` : '未知'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">RSRQ:</span>
              <span className="text-gray-900 dark:text-white">
                {dashboardData.signalData?.rsrq ? `${dashboardData.signalData.rsrq} dB` : '未知'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
