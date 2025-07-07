import React, { useState, useEffect } from 'react';

interface SignalMonitorProps {
  user: any;
}

export default function SignalMonitor({ user }: SignalMonitorProps) {
  const [signalData, setSignalData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadSignalData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/signal', { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setSignalData(data.data);
      } else {
        // 使用模拟数据
        setSignalData({
          rsrp: -85,
          rsrq: -12,
          sinr: '15.0 dB',
          sysmode: 'NR'
        });
      }
    } catch (error) {
      console.error('信号数据加载失败:', error);
      setSignalData({
        rsrp: -85,
        rsrq: -12,
        sinr: '15.0 dB',
        sysmode: 'NR'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignalData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadSignalData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getSignalQuality = (rsrp: number) => {
    if (rsrp >= -80) return { color: 'text-green-500', text: '优秀', width: '90%' };
    if (rsrp >= -90) return { color: 'text-blue-500', text: '良好', width: '70%' };
    if (rsrp >= -100) return { color: 'text-yellow-500', text: '一般', width: '50%' };
    return { color: 'text-red-500', text: '较差', width: '30%' };
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">信号监控</h2>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">自动刷新</span>
          </label>
          <button
            onClick={loadSignalData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '刷新中...' : '🔄 刷新'}
          </button>
        </div>
      </div>

      {/* 信号强度仪表盘 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RSRP */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {signalData.rsrp ? `${signalData.rsrp} dBm` : '--'}
            </div>
            <div className="text-sm text-gray-600 mb-4">RSRP (信号强度)</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getSignalQuality(signalData.rsrp || -100).color.replace('text-', 'bg-')}`}
                style={{ width: getSignalQuality(signalData.rsrp || -100).width }}
              ></div>
            </div>
            <div className={`text-sm mt-2 ${getSignalQuality(signalData.rsrp || -100).color}`}>
              {getSignalQuality(signalData.rsrp || -100).text}
            </div>
          </div>
        </div>

        {/* RSRQ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {signalData.rsrq ? `${signalData.rsrq} dB` : '--'}
            </div>
            <div className="text-sm text-gray-600 mb-4">RSRQ (信号质量)</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="text-sm mt-2 text-green-500">良好</div>
          </div>
        </div>

        {/* SINR */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {signalData.sinr || '--'}
            </div>
            <div className="text-sm text-gray-600 mb-4">SINR (信噪比)</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
            <div className="text-sm mt-2 text-purple-500">优秀</div>
          </div>
        </div>
      </div>

      {/* 详细信息表格 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">详细信息</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">参数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前值</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RSRP</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signalData.rsrp || '--'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">dBm</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSignalQuality(signalData.rsrp || -100).color.replace('text-', 'bg-').replace('-500', '-100')} ${getSignalQuality(signalData.rsrp || -100).color}`}>
                    {getSignalQuality(signalData.rsrp || -100).text}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RSRQ</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signalData.rsrq || '--'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">dB</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    良好
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SINR</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signalData.sinr || '--'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">dB</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    优秀
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">系统模式</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signalData.sysmode || '--'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">--</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    5G
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
