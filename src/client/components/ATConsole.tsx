import React, { useState } from 'react';

interface ATConsoleProps {
  user: any;
}

export default function ATConsole({ user }: ATConsoleProps) {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState<string[]>([
    '[系统] MT5700M AT控制台已就绪'
  ]);
  const [loading, setLoading] = useState(false);

  const sendCommand = async () => {
    if (!command.trim()) return;

    setLoading(true);
    const timestamp = new Date().toLocaleTimeString();
    
    // 添加发送的命令到输出
    setOutput(prev => [...prev, `[${timestamp}] > ${command}`]);

    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ command })
      });

      const data = await response.json();
      
      if (data.success) {
        setOutput(prev => [...prev, `[${timestamp}] < ${data.data.response || JSON.stringify(data.data)}`]);
      } else {
        setOutput(prev => [...prev, `[${timestamp}] 错误: ${data.message}`]);
      }
    } catch (error) {
      setOutput(prev => [...prev, `[${timestamp}] 网络错误: ${error.message}`]);
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  const clearConsole = () => {
    setOutput(['[系统] 控制台已清空']);
  };

  const quickCommands = [
    { label: 'ATI (设备信息)', command: 'ATI' },
    { label: 'AT+CSQ (信号质量)', command: 'AT+CSQ' },
    { label: 'AT+CPIN? (SIM状态)', command: 'AT+CPIN?' },
    { label: 'AT+COPS? (运营商)', command: 'AT+COPS?' },
    { label: 'AT^HCSQ? (信号强度)', command: 'AT^HCSQ?' },
    { label: 'AT^TEMP? (温度)', command: 'AT^TEMP?' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">AT控制台</h2>
        <button
          onClick={clearConsole}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          🗑️ 清空控制台
        </button>
      </div>

      {/* 快捷命令 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">常用命令</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickCommands.map((cmd, index) => (
            <button
              key={index}
              onClick={() => setCommand(cmd.command)}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left"
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>

      {/* 命令输入 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex space-x-4">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendCommand()}
            placeholder="输入AT命令..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={sendCommand}
            disabled={loading || !command.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>

      {/* 控制台输出 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">控制台输出</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
          {output.map((line, index) => (
            <div key={index} className="mb-1">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
