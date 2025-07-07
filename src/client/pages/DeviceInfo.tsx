import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { parseATIResponse, parseTempResponse } from '../utils/atParser';

interface DeviceData {
  info: string | null;
  timestamp: string | null;
  loading: boolean;
  error: string | null;
}

interface TemperatureData {
  temperature: string | null;
  raw_value: number | null;
  timestamp: string | null;
  loading: boolean;
  error: string | null;
}

export default function DeviceInfo() {
  const [deviceData, setDeviceData] = useState<DeviceData>({
    info: null,
    timestamp: null,
    loading: false,
    error: null,
  });

  const [temperatureData, setTemperatureData] = useState<TemperatureData>({
    temperature: null,
    raw_value: null,
    timestamp: null,
    loading: false,
    error: null,
  });

  const { sendCommand, isConnected } = useSocket();

  // 获取设备信息
  const fetchDeviceInfo = async () => {
    console.log('DeviceInfo - 开始获取设备信息');
    setDeviceData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await sendCommand('ATI');
      console.log('DeviceInfo - 设备信息响应:', response);
      
      if (response.success && response.data?.response) {
        // 使用解析工具函数
        const parsedInfo = parseATIResponse(response.data.response);
        
        // 格式化显示信息
        const formattedInfo = `制造商: ${parsedInfo.manufacturer}
型号: ${parsedInfo.model}
固件版本: ${parsedInfo.revision}
IMEI: ${parsedInfo.imei}`;
        
        setDeviceData({
          info: formattedInfo,
          timestamp: new Date().toLocaleString(),
          loading: false,
          error: null,
        });
        console.log('DeviceInfo - 设备信息获取成功');
      } else {
        throw new Error('设备信息命令执行失败');
      }
    } catch (error) {
      console.error('DeviceInfo - 设备信息获取失败:', error);
      setDeviceData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '获取设备信息失败',
      }));
    }
  };

  // 获取芯片温度
  const fetchTemperature = async () => {
    console.log('DeviceInfo - 开始获取芯片温度');
    setTemperatureData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await sendCommand('AT^TEMP?');
      console.log('DeviceInfo - 温度响应:', response);
      
      if (response.success && response.data?.response) {
        // 使用解析工具函数
        const temperature = parseTempResponse(response.data.response);
        
        setTemperatureData({
          temperature: `${temperature}°C`,
          raw_value: temperature,
          timestamp: new Date().toLocaleString(),
          loading: false,
          error: null,
        });
        console.log('DeviceInfo - 温度获取成功:', temperature);
      } else {
        throw new Error('温度命令执行失败');
      }
    } catch (error) {
      console.error('DeviceInfo - 温度获取失败:', error);
      const errorMsg = error instanceof Error ? error.message : '获取温度失败';
      setTemperatureData(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
    }
  };

  // 重启设备
  const restartDevice = async () => {
    if (!confirm('确定要重启设备吗？这将中断当前连接。')) {
      return;
    }
    
    try {
      await sendCommand('AT+CFUN=1,1');
      alert('设备重启命令已发送');
    } catch (error) {
      alert('设备重启失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 页面加载时获取信息
  useEffect(() => {
    if (isConnected) {
      // 页面加载时获取设备信息和温度
      Promise.allSettled([
        fetchDeviceInfo(),
        fetchTemperature()
      ]).then(([deviceResult, tempResult]) => {
        if (deviceResult.status === 'rejected') {
          console.error('DeviceInfo - 初始设备信息获取失败:', deviceResult.reason);
        }
        if (tempResult.status === 'rejected') {
          console.error('DeviceInfo - 初始温度信息获取失败:', tempResult.reason);
        }
      });
    }
  }, [isConnected]);

  // 获取温度状态颜色
  const getTempStatusColor = (rawValue: number | null) => {
    if (!rawValue) return 'text-gray-500';
    
    if (rawValue < 40) return 'text-green-500';
    if (rawValue < 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // 获取温度状态文本
  const getTempStatusText = (rawValue: number | null) => {
    if (!rawValue) return '未知';
    
    if (rawValue < 40) return '正常';
    if (rawValue < 60) return '偏高';
    return '过热';
  };

  // 获取温度进度条宽度
  const getTempProgress = (rawValue: number | null) => {
    if (!rawValue) return 0;
    return Math.min(Math.max((rawValue / 100) * 100, 0), 100);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              📊 设备信息
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              查看MT5700M设备的详细信息和状态
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 设备基本信息 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            💻 设备基本信息
          </h2>
          
          {deviceData.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-gray-600 dark:text-gray-300">正在获取设备信息...</span>
            </div>
          ) : deviceData.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-red-700 dark:text-red-300">{deviceData.error}</span>
              </div>
            </div>
          ) : deviceData.info ? (
            <div className="space-y-3">
              <pre className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                {deviceData.info}
              </pre>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                最后更新: {deviceData.timestamp}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              暂无设备信息
            </div>
          )}
        </div>

        {/* 芯片温度 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            🌡️ 芯片温度
          </h2>
          
          {temperatureData.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-gray-600 dark:text-gray-300">正在获取温度信息...</span>
            </div>
          ) : temperatureData.error ? (
            <div className="space-y-3">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span className="text-red-700 dark:text-red-300">{temperatureData.error}</span>
                </div>
              </div>
              
              {/* 调试信息 */}
              <details className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  调试信息 (点击展开)
                </summary>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
                  {temperatureData.error}
                </div>
              </details>
              
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                💡 <strong>调试建议:</strong> 在AT控制台中手动执行 "AT^CHIPTEMP?" 命令查看原始响应格式
              </div>
            </div>
          ) : temperatureData.temperature ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {temperatureData.temperature}
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">当前温度</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    原始值: {temperatureData.raw_value}
                  </div>
                </div>
              </div>
              
              {/* 温度进度条 */}
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      !temperatureData.raw_value ? 'bg-gray-500' :
                      temperatureData.raw_value < 40 ? 'bg-green-500' :
                      temperatureData.raw_value < 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${getTempProgress(temperatureData.raw_value)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>0°C</span>
                  <span className={getTempStatusColor(temperatureData.raw_value)}>
                    {getTempStatusText(temperatureData.raw_value)}
                  </span>
                  <span>100°C</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                最后更新: {temperatureData.timestamp}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              暂无温度信息
            </div>
          )}
        </div>
      </div>

      {/* 系统状态 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          📈 系统状态
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">设备连接</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected ? '在线' : '离线'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">AT接口</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">正常</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${getTempStatusColor(temperatureData.raw_value).includes('green') ? 'bg-green-500' : getTempStatusColor(temperatureData.raw_value).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">温度状态</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getTempStatusText(temperatureData.raw_value)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">WebUI</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">运行中</div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          🔧 设备操作
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={fetchDeviceInfo}
            disabled={deviceData.loading || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>刷新设备信息</span>
          </button>
          
          <button
            onClick={fetchTemperature}
            disabled={temperatureData.loading || !isConnected}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>🌡️</span>
            <span>刷新温度</span>
          </button>
          
          <button
            onClick={restartDevice}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>重启设备</span>
          </button>
          
          <button
            onClick={() => {
              const info = {
                deviceInfo: deviceData.info,
                temperature: temperatureData.temperature,
                timestamp: new Date().toLocaleString()
              };
              
              const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `mt5700m_device_info_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            disabled={!deviceData.info && !temperatureData.temperature}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>📥</span>
            <span>导出信息</span>
          </button>
        </div>
      </div>
    </div>
  );
}
