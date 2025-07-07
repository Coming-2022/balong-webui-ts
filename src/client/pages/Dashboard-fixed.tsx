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
    timestamp?: string;
  };
  cellInfo: {
    locked_cell?: {
      pci?: number;
      earfcn?: number;
      band?: string;
      bandwidth?: string;
    };
    serving_cell?: {
      pci?: number;
      earfcn?: number;
      rsrp?: number;
      rsrq?: number;
    };
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    deviceInfo: {},
    signalData: {},
    temperatureData: {},
    lockStatus: { status: 'unknown' },
    networkStatus: { connectivity: 'unknown' },
    cellInfo: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const { socket, isConnected } = useSocket();

  // 加载数据
  useEffect(() => {
    console.log('📊 Dashboard 初始化');
    loadDashboardData();
    
    // 设置定时刷新
    const interval = setInterval(loadDashboardData, 30000); // 30秒刷新一次
    
    return () => clearInterval(interval);
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
      });

      return () => {
        socket.off('signalUpdate');
        socket.off('temperatureUpdate');
      };
    }
  }, [socket, isConnected]);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 开始加载Dashboard数据...');
      setError(null);
      
      // 并行加载所有数据
      const [
        deviceRes,
        signalRes,
        tempRes,
        lockRes,
        networkRes,
        cellRes
      ] = await Promise.allSettled([
        fetchData('/api/device/info'),
        fetchData('/api/signal'),
        fetchData('/api/device/temperature'),
        fetchData('/api/device/lock-status'),
        fetchData('/api/network/status'),
        fetchData('/api/cell/info')
      ]);

      const newData: DashboardData = {
        deviceInfo: getResultData(deviceRes),
        signalData: getResultData(signalRes),
        temperatureData: getResultData(tempRes),
        lockStatus: getResultData(lockRes) || { status: 'unknown' },
        networkStatus: getResultData(networkRes) || { connectivity: 'unknown' },
        cellInfo: getResultData(cellRes) || {}
      };

      setDashboardData(newData);
      setLastUpdate(new Date().toLocaleTimeString());
      console.log('✅ Dashboard数据加载完成');
      
    } catch (error) {
      console.error('❌ Dashboard数据加载失败:', error);
      setError('部分数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (url: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
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
      console.warn(`API ${url} 请求失败:`, error);
      return { success: false, data: null };
    }
  };

  const getResultData = (result: PromiseSettledResult<any>) => {
    if (result.status === 'fulfilled' && result.value.success) {
      return result.value.data;
    }
    return null;
  };

  // 格式化信号强度
  const formatSignalStrength = (rsrp: number | string | undefined) => {
    if (rsrp === undefined || rsrp === null) return '未知';
    const value = typeof rsrp === 'string' ? parseFloat(rsrp) : rsrp;
    if (isNaN(value)) return '未知';
    return `${value} dBm`;
  };

  // 格式化信号质量
  const formatSignalQuality = (rsrq: number | string | undefined) => {
    if (rsrq === undefined || rsrq === null) return '未知';
    const value = typeof rsrq === 'string' ? parseFloat(rsrq) : rsrq;
    if (isNaN(value)) return '未知';
    return `${value} dB`;
  };

  // 格式化温度
  const formatTemperature = (temp: string | number | undefined) => {
    if (temp === undefined || temp === null) return '未知';
    if (typeof temp === 'string') {
      return temp.includes('°C') ? temp : `${temp}°C`;
    }
    return `${temp}°C`;
  };

  // 获取信号强度状态
  const getSignalStatus = (rsrp: number | string | undefined) => {
    if (rsrp === undefined || rsrp === null) return { color: 'gray', text: '未知' };
    const value = typeof rsrp === 'string' ? parseFloat(rsrp) : rsrp;
    if (isNaN(value)) return { color: 'gray', text: '未知' };
    
    if (value >= -80) return { color: 'green', text: '优秀' };
    if (value >= -90) return { color: 'blue', text: '良好' };
    if (value >= -100) return { color: 'yellow', text: '一般' };
    return { color: 'red', text: '较差' };
  };

  // 获取连接状态
  const getConnectionStatus = () => {
    if (dashboardData.networkStatus.connectivity === 'connected') {
      return { color: 'green', text: '已连接', icon: '🟢' };
    } else if (dashboardData.networkStatus.connectivity === 'disconnected') {
      return { color: 'red', text: '未连接', icon: '🔴' };
    } else if (dashboardData.networkStatus.connectivity === 'testing') {
      return { color: 'yellow', text: '测试中', icon: '🟡' };
    }
    return { color: 'gray', text: '未知', icon: '⚪' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在加载系统概览...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            系统概览
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            MT5700M 设备状态总览
            {lastUpdate && (
              <span className="ml-2 text-sm">
                最后更新: {lastUpdate}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 刷新数据
        </button>
      </div>

      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <div className="text-yellow-400 mr-3">⚠️</div>
            <div className="text-yellow-800 dark:text-yellow-200">{error}</div>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {getConnectionStatus().icon} {getConnectionStatus().text}
              </p>
            </div>
          </div>
        </div>

        {/* 网络制式 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">📡</div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">网络制式</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.signalData.sysmode || dashboardData.networkStatus.technology || '未知'}
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
                {formatTemperature(dashboardData.temperatureData.temperature)}
              </p>
            </div>
          </div>
        </div>

        {/* 运营商 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="text-3xl mr-4">🏢</div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">运营商</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboardData.networkStatus.operator || '未知'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 信号监控 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📶</span>
          信号监控
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* RSRP */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              信号强度 (RSRP)
            </div>
            <div className={`text-3xl font-bold mb-2 ${
              getSignalStatus(dashboardData.signalData.rsrp).color === 'green' ? 'text-green-600' :
              getSignalStatus(dashboardData.signalData.rsrp).color === 'blue' ? 'text-blue-600' :
              getSignalStatus(dashboardData.signalData.rsrp).color === 'yellow' ? 'text-yellow-600' :
              getSignalStatus(dashboardData.signalData.rsrp).color === 'red' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {formatSignalStrength(dashboardData.signalData.rsrp)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {getSignalStatus(dashboardData.signalData.rsrp).text}
            </div>
          </div>

          {/* RSRQ */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              信号质量 (RSRQ)
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {formatSignalQuality(dashboardData.signalData.rsrq)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              质量指标
            </div>
          </div>

          {/* SINR */}
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              信噪比 (SINR)
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {dashboardData.signalData.sinr || '未知'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              信噪比
            </div>
          </div>
        </div>
      </div>

      {/* 锁定小区信息 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">🗼</span>
          锁定小区信息
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 锁定状态 */}
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">锁定状态</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">状态:</span>
                <span className={`font-medium ${
                  dashboardData.lockStatus.status === 'locked' ? 'text-green-600' :
                  dashboardData.lockStatus.status === 'unlocked' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {dashboardData.lockStatus.status === 'locked' ? '🔒 已锁定' :
                   dashboardData.lockStatus.status === 'unlocked' ? '🔓 未锁定' :
                   '❓ 未知'}
                </span>
              </div>
              {dashboardData.lockStatus.info && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">信息:</span>
                  <span className="text-gray-900 dark:text-white">{dashboardData.lockStatus.info}</span>
                </div>
              )}
            </div>
          </div>

          {/* 小区信息 */}
          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">当前小区</h3>
            <div className="space-y-2">
              {dashboardData.cellInfo.serving_cell?.pci && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">PCI:</span>
                  <span className="text-gray-900 dark:text-white">{dashboardData.cellInfo.serving_cell.pci}</span>
                </div>
              )}
              {dashboardData.cellInfo.serving_cell?.earfcn && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">EARFCN:</span>
                  <span className="text-gray-900 dark:text-white">{dashboardData.cellInfo.serving_cell.earfcn}</span>
                </div>
              )}
              {dashboardData.cellInfo.locked_cell?.band && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">频段:</span>
                  <span className="text-gray-900 dark:text-white">{dashboardData.cellInfo.locked_cell.band}</span>
                </div>
              )}
              {!dashboardData.cellInfo.serving_cell?.pci && (
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                  暂无小区信息
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 设备信息 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">ℹ️</span>
          设备信息
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">制造商:</span>
              <span className="text-gray-900 dark:text-white">{dashboardData.deviceInfo.manufacturer || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">型号:</span>
              <span className="text-gray-900 dark:text-white">{dashboardData.deviceInfo.model || '未知'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">固件版本:</span>
              <span className="text-gray-900 dark:text-white">{dashboardData.deviceInfo.revision || '未知'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">IMEI:</span>
              <span className="text-gray-900 dark:text-white font-mono text-sm">
                {dashboardData.deviceInfo.imei || '未知'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
