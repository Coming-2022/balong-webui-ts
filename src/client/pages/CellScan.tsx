import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';

interface ScanProgress {
  stage: 'init' | 'scan';
  message: string;
  progress: number;
}

interface ScanResult {
  rat: string;
  plmn: string;
  freq: number;
  pci: number;
  band: number;
  lac: number;
  scs: string;
  rsrp: number;
  rsrq: number;
  sinr: number;
  lte_sinr: number;
  timestamp: string;
}

interface SortConfig {
  key: keyof ScanResult;
  direction: 'asc' | 'desc';
}

export default function CellScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<string>('');
  const [lastInitTime, setLastInitTime] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'rsrp', direction: 'desc' });

  const { sendCommand, isConnected, socket, initConfiguration, startScan } = useSocket();

  // 监听扫描进度
  useEffect(() => {
    if (!socket) {
      console.log('❌ Socket不存在，无法监听事件');
      return;
    }

    const handleScanProgress = (progress: ScanProgress) => {
      console.log('📊 扫描进度:', progress);
      setScanProgress(progress);
    };

    const handleScanComplete = (data: any) => {
      console.log('✅ 扫描完成:', data);
      if (data.success && data.results) {
        setScanResults(data.results);
        setLastScanTime(new Date().toLocaleString());
        setScanProgress({
          stage: 'scan',
          message: `扫描完成，发现 ${data.results.length} 个小区`,
          progress: 100
        });
      } else {
        setError(data.error || '扫描完成但无结果');
      }
      setIsScanning(false);
    };

    const handleScanError = (data: any) => {
      console.error('❌ 扫描错误:', data);
      setError(data.message || data.error || '扫描过程出错');
      setIsScanning(false);
      setScanProgress(null);
    };

    socket.on('scanProgress', handleScanProgress);
    socket.on('scanComplete', handleScanComplete);
    socket.on('scanError', handleScanError);

    return () => {
      socket.off('scanProgress', handleScanProgress);
      socket.off('scanComplete', handleScanComplete);
      socket.off('scanError', handleScanError);
    };
  }, [socket]);

  // 扫描超时处理
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isScanning) {
      timeoutId = setTimeout(() => {
        console.warn('⚠️ 扫描超时，自动停止');
        setError('扫描超时，请重试');
        setIsScanning(false);
        setScanProgress(null);
      }, 5 * 60 * 1000);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isScanning]);

  // 初始化配置
  const handleInitConfiguration = async () => {
    if (!isConnected || !socket) {
      setError('设备未连接');
      return;
    }

    console.log('🔧 开始初始化配置流程...');
    setIsInitializing(true);
    setError(null);
    
    const commands = [
      { cmd: 'AT^C5GOPTION=1,1,1', desc: '设置5G选项' },
      { cmd: 'AT^LTEFREQLOCK=0', desc: '解锁LTE频率' },
      { cmd: 'AT^NRFREQLOCK=0', desc: '解锁NR频率' },
      { cmd: 'AT^SYSCFGEX="0803",3FFFFFFF,1,2,7FFFFFFFFFFFFFFF,,', desc: '配置系统参数' }
    ];

    try {
      for (let i = 0; i < commands.length; i++) {
        const { cmd, desc } = commands[i];
        
        console.log(`🔧 执行命令 ${i + 1}/${commands.length}: ${cmd}`);
        
        // 开始执行当前命令时的进度
        const startProgress = Math.round((i / commands.length) * 100);
        // 完成当前命令后的进度
        const endProgress = Math.round(((i + 1) / commands.length) * 100);
        
        setScanProgress({
          stage: 'init',
          message: `${desc}: ${cmd}`,
          progress: startProgress
        });
        
        let retryCount = 0;
        const maxRetries = 3;
        let success = false;
        
        while (retryCount < maxRetries && !success) {
          try {
            console.log(`🔧 发送命令 (尝试 ${retryCount + 1}/${maxRetries}): ${cmd}`);
            
            if (retryCount > 0) {
              setScanProgress({
                stage: 'init',
                message: `${desc} - 重试中 (${retryCount}/${maxRetries})`,
                progress: startProgress
              });
            }
            
            const response = await new Promise<any>((resolve, reject) => {
              socket.emit('sendCommand', cmd, (response: any) => {
                if (response.success) {
                  resolve(response);
                } else {
                  reject(new Error(response.error || '命令执行失败'));
                }
              });
            });
            
            console.log(`✅ 命令执行成功: ${cmd}`, response);
            success = true;
            
          } catch (error) {
            retryCount++;
            console.warn(`⚠️ 命令执行失败 (尝试 ${retryCount}/${maxRetries}): ${cmd}`, error);
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              throw new Error(`命令执行失败，已重试${maxRetries}次: ${cmd} - ${error instanceof Error ? error.message : '未知错误'}`);
            }
          }
        }
        
        setScanProgress({
          stage: 'init',
          message: `${desc} - 完成`,
          progress: endProgress
        });
        
        if (i < commands.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setScanProgress({
        stage: 'init',
        message: '初始化配置完成！',
        progress: 100
      });
      
      setIsInitialized(true);
      setLastInitTime(new Date().toLocaleString());
      setError(null);
      
      setTimeout(() => {
        alert('✅ 初始化配置成功完成！\n\n所有配置命令已执行完毕，现在可以开始小区扫描。');
        setScanProgress(null);
      }, 1000);
      
    } catch (error) {
      console.error('❌ 初始化配置失败:', error);
      setError(error instanceof Error ? error.message : '初始化配置失败');
      
      setScanProgress({
        stage: 'init',
        message: '初始化配置失败',
        progress: 0
      });
      
      setTimeout(() => {
        setScanProgress(null);
      }, 3000);
    } finally {
      setIsInitializing(false);
    }
  };

  // 注册网络
  const handleRegisterNetwork = async () => {
    if (!isConnected || !socket) {
      setError('设备未连接');
      return;
    }

    console.log('📡 开始注册网络...');
    setIsRegistering(true);
    setError(null);

    try {
      console.log('📡 发送命令: AT+COPS=0');
      
      const response = await new Promise<any>((resolve, reject) => {
        socket.emit('sendCommand', 'AT+COPS=0', (response: any) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '注册网络失败'));
          }
        });
      });

      console.log('✅ 注册网络命令执行成功:', response);
      alert('✅ 注册网络命令已发送！\n\n设备将自动搜索并注册到可用的网络。');
      
    } catch (error) {
      console.error('❌ 注册网络失败:', error);
      setError(error instanceof Error ? error.message : '注册网络失败');
      alert('❌ 注册网络失败\n\n' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsRegistering(false);
    }
  };

  // 开始扫描
  const handleStartScan = async () => {
    if (!isConnected || !socket) {
      setError('设备未连接');
      return;
    }

    if (isScanning || isInitializing) {
      return;
    }

    console.log('🔍 开始小区扫描');
    setIsScanning(true);
    setError(null);
    setScanProgress(null);
    setScanResults([]);

    try {
      console.log('📡 调用服务端startScan，等待完成...');
      
      socket.emit('startScan', (response: any) => {
        console.log('📋 服务端扫描响应:', response);
        
        if (response.success) {
          console.log('✅ 小区扫描成功完成');
          setLastScanTime(new Date().toLocaleString());
        } else {
          console.error('❌ 小区扫描失败:', response.error);
          setError(response.error || '小区扫描失败');
          setIsScanning(false);
        }
      });
      
    } catch (error) {
      console.error('❌ 扫描过程出错:', error);
      setError(error instanceof Error ? error.message : '扫描过程出错');
      setIsScanning(false);
    }
  };

  // 停止扫描
  const handleStopScan = () => {
    setIsScanning(false);
    setIsInitializing(false);
    setScanProgress(null);
  };

  // 清空结果
  const handleClearResults = () => {
    setScanResults([]);
    setLastScanTime('');
    setError(null);
  };

  // 导出结果
  const handleExportResults = () => {
    if (scanResults.length === 0) return;

    let content = 'MT5700M 小区扫描结果\n';
    content += `扫描时间: ${lastScanTime}\n`;
    content += `发现小区: ${scanResults.length} 个\n`;
    content += '='.repeat(80) + '\n\n';
    content += 'RAT,PLMN,频率(kHz),PCI,频段,LAC,SCS,RSRP(dBm),RSRQ(dB),SINR(dB),LTE_SINR(dB)\n';

    scanResults.forEach(result => {
      content += `${result.rat},${result.plmn},${result.freq},${result.pci},${result.band},${result.lac},${result.scs},${result.rsrp},${result.rsrq},${result.sinr},${result.lte_sinr}\n`;
    });

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mt5700m_cell_scan_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 获取信号强度颜色
  const getSignalColor = (rsrp: number) => {
    if (rsrp >= -80) return 'text-green-600';
    if (rsrp >= -90) return 'text-yellow-600';
    if (rsrp >= -100) return 'text-orange-600';
    return 'text-red-600';
  };

  // 排序功能
  const handleSort = (key: keyof ScanResult) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 获取排序后的数据
  const getSortedResults = () => {
    const sortedResults = [...scanResults];
    
    sortedResults.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
    
    return sortedResults;
  };

  // 获取排序图标
  const getSortIcon = (key: keyof ScanResult) => {
    if (sortConfig.key !== key) {
      return <span className="text-gray-400">↕️</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="text-blue-600">↑</span> : 
      <span className="text-blue-600">↓</span>;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <span className="text-4xl mr-4">🔍</span>
          小区扫描
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          扫描周围的5G/LTE小区信息，分析网络覆盖情况
        </p>
      </div>

      {/* 控制面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">扫描控制</h2>
          <div className="flex items-center space-x-3">
            {/* 初始化状态指示器 */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isInitialized 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>{isInitialized ? '已初始化' : '未初始化'}</span>
              {lastInitTime && (
                <span className="text-xs opacity-75">({lastInitTime})</span>
              )}
            </div>

            {/* Socket连接状态指示器 */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Socket已连接' : 'Socket未连接'}</span>
            </div>

            <button
              onClick={handleInitConfiguration}
              disabled={!isConnected || isInitializing || isScanning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isInitializing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>⚙️</span>
              )}
              <span>{isInitializing ? '初始化中...' : isInitialized ? '重新初始化' : '初始化配置'}</span>
            </button>

            <button
              onClick={isScanning ? handleStopScan : handleStartScan}
              disabled={!isConnected || isInitializing}
              className={`px-4 py-2 text-white rounded-lg focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                isScanning 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {isScanning ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>🔍</span>
              )}
              <span>{isScanning ? '停止扫描' : '开始扫描'}</span>
            </button>

            {/* 注册网络按钮 */}
            <button
              onClick={handleRegisterNetwork}
              disabled={!isConnected || isRegistering || isScanning}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isRegistering ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>📡</span>
              )}
              <span>{isRegistering ? '注册中...' : '注册网络'}</span>
            </button>

            {scanResults.length > 0 && (
              <>
                <button
                  onClick={handleExportResults}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center space-x-2"
                >
                  <span>📥</span>
                  <span>导出结果</span>
                </button>

                <button
                  onClick={handleClearResults}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>清空结果</span>
                </button>
              </>
            )}
          </div>
        </div>
        {/* 扫描进度 */}
        {scanProgress && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {scanProgress.stage === 'init' ? '🔧 初始化配置' : '🔍 小区扫描'}: {scanProgress.message}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(scanProgress.progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  scanProgress.stage === 'init' 
                    ? scanProgress.progress === 100 
                      ? 'bg-green-600' 
                      : 'bg-blue-600'
                    : 'bg-green-600'
                }`}
                style={{ width: `${Math.round(scanProgress.progress)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-3">⚠️</span>
              <div>
                <div className="text-red-700 dark:text-red-300 font-medium">扫描失败</div>
                <div className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* 扫描说明 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-500 text-xl mr-3">ℹ️</span>
            <div>
              <div className="text-blue-700 dark:text-blue-300 font-medium">扫描说明</div>
              <div className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                <ul className="list-disc list-inside space-y-1">
                  <li className={isInitialized ? 'line-through opacity-60' : 'font-semibold'}>
                    {isInitialized ? '✅ 已完成' : '⚠️ 必须'} 首次使用请先执行"初始化配置"
                  </li>
                  <li>初始化配置会依次执行4个AT命令，大约需要5-10秒</li>
                  <li>小区扫描需要1-2分钟时间，请耐心等待</li>
                  <li>扫描过程中会重启5G芯片，可能会短暂断网</li>
                  <li>扫描完成后会自动恢复网络连接</li>
                </ul>
              </div>
              
              {isInitialized && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">✅</span>
                    <span>初始化配置已完成，可以开始小区扫描</span>
                  </div>
                  {lastInitTime && (
                    <div className="text-xs opacity-75 mt-1">
                      初始化时间: {lastInitTime}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 扫描结果 */}
      {scanResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              扫描结果 ({scanResults.length} 个小区)
            </h2>
            {lastScanTime && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                扫描时间: {lastScanTime}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('rat')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>网络类型</span>
                      {getSortIcon('rat')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('plmn')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>PLMN</span>
                      {getSortIcon('plmn')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('freq')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>频率 (kHz)</span>
                      {getSortIcon('freq')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('pci')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>PCI</span>
                      {getSortIcon('pci')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('band')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>频段</span>
                      {getSortIcon('band')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('rsrp')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>RSRP (dBm)</span>
                      {getSortIcon('rsrp')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('rsrq')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>RSRQ (dB)</span>
                      {getSortIcon('rsrq')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('sinr')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>SINR (dB)</span>
                      {getSortIcon('sinr')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('scs')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>SCS (kHz)</span>
                      {getSortIcon('scs')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {getSortedResults().map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.rat === 'NR' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          result.rat === 'LTE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {result.rat}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {result.plmn || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {result.freq.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {result.pci}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {result.band}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getSignalColor(result.rsrp)}`}>
                        {result.rsrp}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {result.rsrq.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {result.sinr.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {result.scs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {scanResults.length === 0 && !isScanning && !isInitializing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              暂无扫描结果
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              点击"开始扫描"按钮开始搜索周围的小区信息
            </p>
            <button
              onClick={handleStartScan}
              disabled={!isConnected}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              <span>🔍</span>
              <span>开始扫描</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
