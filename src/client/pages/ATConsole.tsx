import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAppStore } from '../stores/appStore';

interface CommandHistory {
  command: string;
  response?: string;
  error?: string;
  timestamp: string;
}

export default function ATConsole() {
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { sendCommand, isConnected } = useSocket();
  const { addCommand } = useAppStore();

  // 快捷命令
  const quickCommands = [
    { name: '设备信息', command: 'ATI', icon: '📋' },
    { name: '信号强度', command: 'AT^HCSQ?', icon: '📶' },
    { name: '5G频率信息', command: 'AT^HFREQINFO?', icon: '📊' },
    { name: '5G锁定状态', command: 'AT^NRFREQLOCK?', icon: '🔒' },
    { name: '芯片温度', command: 'AT^CHIPTEMP?', icon: '🌡️' },
    { name: '网络运营商', command: 'AT+COPS?', icon: '🌐' },
    { name: '注册网络', command: 'AT+COPS=0', icon: '📡' },
    { name: '网络注册查询', command: 'AT+CREG?', icon: '📝' },
    { name: 'SIM卡状态', command: 'AT+CPIN?', icon: '💳' },
    { name: '重启设备', command: 'AT+CFUN=1,1', icon: '🔄' },
  ];

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [commandHistory]);

  // 发送命令
  const handleSendCommand = async (command: string) => {
    if (!command.trim() || isLoading || !isConnected) return;

    setIsLoading(true);
    const timestamp = new Date().toLocaleTimeString();
    
    // 添加到历史记录
    addCommand(command);
    
    try {
      const response = await sendCommand(command);
      const newEntry: CommandHistory = {
        command,
        response: response.data?.response || JSON.stringify(response.data, null, 2),
        timestamp,
      };
      
      setCommandHistory(prev => [...prev, newEntry]);
    } catch (error) {
      const newEntry: CommandHistory = {
        command,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp,
      };
      
      setCommandHistory(prev => [...prev, newEntry]);
    } finally {
      setIsLoading(false);
      setCurrentCommand('');
      setHistoryIndex(-1);
    }
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendCommand(currentCommand);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const commands = useAppStore.getState().commandHistory;
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commands.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commands[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commands[newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };

  // 清空控制台
  const clearConsole = () => {
    setCommandHistory([]);
  };

  // 导出日志
  const exportLog = () => {
    if (commandHistory.length === 0) return;
    
    let logContent = 'MT5700M AT命令日志\n';
    logContent += `导出时间: ${new Date().toLocaleString()}\n`;
    logContent += '='.repeat(50) + '\n\n';
    
    commandHistory.forEach(entry => {
      logContent += `[${entry.timestamp}] $ ${entry.command}\n`;
      if (entry.response) {
        logContent += entry.response + '\n';
      }
      if (entry.error) {
        logContent += `错误: ${entry.error}\n`;
      }
      logContent += '\n';
    });
    
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mt5700m_at_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              📟 AT命令控制台
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              通过Web界面发送AT命令并查看响应结果
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>
      </div>

      {/* 快捷命令面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ⚡ 快捷命令
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickCommands.map((cmd, index) => (
            <button
              key={index}
              onClick={() => handleSendCommand(cmd.command)}
              disabled={isLoading || !isConnected}
              className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl mb-1">{cmd.icon}</span>
              <span className="text-xs text-center text-gray-700 dark:text-gray-300">
                {cmd.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 命令输入区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          ⌨️ 命令输入
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={currentCommand}
                onChange={(e) => setCurrentCommand(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入AT命令，例如：ATI"
                disabled={isLoading || !isConnected}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !isConnected || !currentCommand.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>📤</span>
              )}
              <span>发送</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            使用上下箭头键浏览命令历史记录
          </p>
        </form>
      </div>

      {/* 控制台输出 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            🖥️ 控制台输出
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={exportLog}
              disabled={commandHistory.length === 0}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📥 导出日志
            </button>
            <button
              onClick={clearConsole}
              disabled={commandHistory.length === 0}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ 清空
            </button>
          </div>
        </div>
        
        <div
          ref={consoleRef}
          className="h-96 overflow-y-auto p-4 bg-gray-900 text-green-400 font-mono text-sm"
        >
          {commandHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              控制台输出将显示在这里...
            </div>
          ) : (
            <div className="space-y-3">
              {commandHistory.map((entry, index) => (
                <div key={index} className="border-b border-gray-700 pb-2">
                  <div className="text-blue-400">
                    <span className="text-gray-500">[{entry.timestamp}]</span>
                    <span className="text-yellow-400 mx-2">$</span>
                    <span>{entry.command}</span>
                  </div>
                  {entry.response && (
                    <div className="text-green-400 mt-1 whitespace-pre-wrap">
                      {entry.response}
                    </div>
                  )}
                  {entry.error && (
                    <div className="text-red-400 mt-1">
                      错误: {entry.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
