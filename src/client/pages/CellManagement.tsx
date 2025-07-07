import React, { useState, useEffect } from 'react';

interface CellConfig {
  id: string;
  name: string;
  band: string;
  arfcn: number;
  pci: number;
  type: '1CC' | '2CC';
  enabled: boolean;
  isDefault: boolean;
}

interface LockStatus {
  isLocked: boolean;
  lockedCells: string[];
  lockMode: 'single' | 'multi' | 'none';
}

export default function CellManagement() {
  // 默认小区配置清单 - 与Python版本at.py中的配置保持一致
  const [defaultCells, setDefaultCells] = useState<CellConfig[]>([
    {
      id: 'default-1',
      name: '小区16 (ARFCN 627264)',
      band: 'n78',
      arfcn: 627264,
      pci: 16,
      type: '1CC',
      enabled: true,
      isDefault: true
    },
    {
      id: 'default-2', 
      name: '小区579 (ARFCN 627264)',
      band: 'n78',
      arfcn: 627264,
      pci: 579,
      type: '2CC',
      enabled: true,
      isDefault: true
    },
    {
      id: 'default-3',
      name: '小区334 (ARFCN 627264)',
      band: 'n78',
      arfcn: 627264,
      pci: 334,
      type: '2CC',
      enabled: true,
      isDefault: true
    },
    {
      id: 'default-4',
      name: '小区334 (ARFCN 633984)',
      band: 'n78',
      arfcn: 633984,
      pci: 334,
      type: '2CC',
      enabled: true,
      isDefault: true
    },
    {
      id: 'default-5',
      name: '小区579 (ARFCN 633984)',
      band: 'n78',
      arfcn: 633984,
      pci: 579,
      type: '2CC',
      enabled: true,
      isDefault: true
    }
  ]);

  const [customCells, setCustomCells] = useState<CellConfig[]>([]);
  const [lockStatus, setLockStatus] = useState<LockStatus>({
    isLocked: false,
    lockedCells: [],
    lockMode: 'none'
  });
  
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCell, setEditingCell] = useState<CellConfig | null>(null);
  
  // 新增/编辑表单数据
  const [formData, setFormData] = useState({
    name: '',
    band: '',
    arfcn: '',
    pci: '',
    type: '1CC' as '1CC' | '2CC'
  });

  // 获取所有小区（默认 + 自定义）
  const getAllCells = () => [...defaultCells, ...customCells];

  // 加载小区锁定状态 - 改进错误处理
  const loadLockStatus = async () => {
    try {
      setLoading(true);
      
      // 调用AT^NRFREQLOCK?命令获取当前锁定状态
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ command: 'AT^NRFREQLOCK?' })
      });
      
      console.log('📋 响应状态:', response.status, response.statusText);
      
      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ 非JSON响应:', textResponse.substring(0, 200));
        throw new Error(`服务器返回了非JSON响应 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 锁定状态响应:', data);
      
      if (data.success && data.data) {
        const lockResponse = data.data.response || '';
        console.log('🔒 锁定状态原始响应:', lockResponse);
        
        let isLocked = false;
        let lockedCells: string[] = [];
        let lockMode: 'single' | 'multi' | 'none' = 'none';
        
        // 简化解析逻辑，参考Python版本
        if (lockResponse.includes('^NRFREQLOCK:')) {
          const lockStatusLines = lockResponse.split('^NRFREQLOCK:')[1].split('\r\n\r\nOK')[0].split('\n');
          console.log('🔒 锁定状态行数:', lockStatusLines.length);
          
          if (lockStatusLines.length > 3) {
            // 有锁定信息 - 参考Python版本的逻辑
            const lockedCellInfo = lockStatusLines[2].trim().replace('\r', '');
            console.log('🔒 锁定小区信息:', lockedCellInfo);
            
            if (lockedCellInfo && lockedCellInfo !== 'None') {
              isLocked = true;
              lockMode = 'single';
              
              // 尝试解析锁定信息中的ARFCN和PCI
              // 格式可能是: 2,0,1,"78","627264","1","579"
              const lockMatch = lockedCellInfo.match(/"(\d+)","(\d+)"/g);
              if (lockMatch && lockMatch.length >= 2) {
                const arfcn = parseInt(lockMatch[1].replace(/"/g, ''));
                const pci = parseInt(lockMatch[2].replace(/"/g, ''));
                
                console.log('🔒 解析的锁定参数:', { arfcn, pci });
                
                // 查找匹配的小区
                const matchedCell = getAllCells().find(cell => 
                  cell.arfcn === arfcn && cell.pci === pci
                );
                
                if (matchedCell) {
                  lockedCells = [matchedCell.id];
                  console.log('✅ 找到匹配的锁定小区:', matchedCell.name);
                } else {
                  console.log('⚠️ 未找到匹配的小区，ARFCN:', arfcn, 'PCI:', pci);
                  // 即使没找到匹配的小区，也标记为已锁定
                  isLocked = true;
                }
              } else {
                // 无法解析具体参数，但确认已锁定
                isLocked = true;
                console.log('🔒 确认已锁定，但无法解析具体参数');
              }
            }
          } else {
            // 无锁定信息
            console.log('🔓 设备未锁定');
            isLocked = false;
          }
        } else {
          console.log('⚠️ 响应中未找到NRFREQLOCK信息');
        }
        
        const newLockStatus = {
          isLocked,
          lockedCells,
          lockMode
        };
        
        setLockStatus(newLockStatus);
        console.log('✅ 更新锁定状态:', newLockStatus);
        
      } else {
        throw new Error(data.error || data.message || '锁定状态命令执行失败');
      }
    } catch (error: any) {
      console.error('❌ 获取锁定状态失败:', error);
      
      // 检查是否是认证问题
      if (error.message.includes('Unexpected token') && error.message.includes('<!DOCTYPE')) {
        setError('认证失败，请刷新页面重新登录');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('未授权访问，请重新登录');
      } else {
        setError(`获取锁定状态失败: ${error.message}`);
      }
      
      // 使用默认状态
      setLockStatus({
        isLocked: false,
        lockedCells: [],
        lockMode: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 锁定选中的小区 - 回退到使用通用命令API
  const lockSelectedCells = async () => {
    if (selectedCells.length === 0) {
      setError('请选择要锁定的小区');
      return;
    }

    if (selectedCells.length > 1) {
      setError('当前只支持锁定单个小区');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const selectedCellConfigs = getAllCells().filter(cell => 
        selectedCells.includes(cell.id)
      );

      const cell = selectedCellConfigs[0];
      console.log('🔒 锁定小区:', cell);

      // 构建锁定命令 - 参考Python版本格式
      const lockCommand = `AT^NRFREQLOCK=2,0,1,"78","${cell.arfcn}","1","${cell.pci}"`;
      console.log('📋 锁定命令:', lockCommand);

      // 使用通用命令API执行锁定
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ command: lockCommand })
      });
      
      console.log('📋 响应状态:', response.status, response.statusText);
      
      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ 非JSON响应:', textResponse.substring(0, 200));
        throw new Error(`服务器返回了非JSON响应 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 锁定命令响应:', data);
      
      if (data.success && data.data && data.data.response && data.data.response.includes('OK')) {
        // 锁定成功，执行重启
        console.log('🔄 锁定成功，重启蜂窝网络...');
        
        const restartResponse = await fetch('/api/command', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ command: 'AT+CFUN=1,1' })
        });
        
        const restartData = await restartResponse.json();
        console.log('🔄 重启响应:', restartData);
        
        // 更新锁定状态
        setLockStatus({
          isLocked: true,
          lockedCells: selectedCells,
          lockMode: 'single'
        });

        setSelectedCells([]);
        alert(`小区锁定成功！\n小区: ${cell.name}\nARFCN: ${cell.arfcn}\nPCI: ${cell.pci}\n\n设备将重启，请等待1-2分钟恢复正常。`);
        
        // 延迟刷新状态
        setTimeout(() => {
          loadLockStatus();
        }, 3000);
        
      } else {
        throw new Error(data.error || data.message || '锁定命令执行失败');
      }
      
    } catch (error: any) {
      console.error('锁定小区失败:', error);
      
      // 检查是否是认证问题
      if (error.message.includes('Unexpected token') && error.message.includes('<!DOCTYPE')) {
        setError('认证失败，请刷新页面重新登录');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('未授权访问，请重新登录');
      } else {
        setError(`锁定失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 解锁小区 - 回退到使用通用命令API
  const unlockCells = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔓 解锁小区');

      // 使用通用命令API执行解锁
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ command: 'AT^NRFREQLOCK=0' })
      });
      
      console.log('📋 响应状态:', response.status, response.statusText);
      
      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ 非JSON响应:', textResponse.substring(0, 200));
        throw new Error(`服务器返回了非JSON响应 (${response.status}): ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 解锁命令响应:', data);
      
      if (data.success && data.data && data.data.response && data.data.response.includes('OK')) {
        // 解锁成功，执行重启
        console.log('🔄 解锁成功，重启蜂窝网络...');
        
        const restartResponse = await fetch('/api/command', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ command: 'AT+CFUN=1,1' })
        });
        
        const restartData = await restartResponse.json();
        console.log('🔄 重启响应:', restartData);
        
        setLockStatus({
          isLocked: false,
          lockedCells: [],
          lockMode: 'none'
        });
        
        alert('小区解锁成功！\n\n设备将重启，请等待1-2分钟恢复正常。');
        
        // 延迟刷新状态
        setTimeout(() => {
          loadLockStatus();
        }, 3000);
        
      } else {
        throw new Error(data.error || data.message || '解锁命令执行失败');
      }
      
    } catch (error: any) {
      console.error('解锁小区失败:', error);
      
      // 检查是否是认证问题
      if (error.message.includes('Unexpected token') && error.message.includes('<!DOCTYPE')) {
        setError('认证失败，请刷新页面重新登录');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('未授权访问，请重新登录');
      } else {
        setError(`解锁失败: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑小区
  const startEditCell = (cell: CellConfig) => {
    setEditingCell(cell);
    setFormData({
      name: cell.name,
      band: cell.band,
      arfcn: cell.arfcn.toString(),
      pci: cell.pci.toString(),
      type: cell.type
    });
    setShowAddForm(true);
    setError('');
  };

  // 保存小区（新增或编辑）
  const saveCell = () => {
    if (!formData.name || !formData.band || !formData.arfcn || !formData.pci) {
      setError('请填写完整的小区信息');
      return;
    }

    const cellData = {
      name: formData.name,
      band: formData.band,
      arfcn: parseInt(formData.arfcn),
      pci: parseInt(formData.pci),
      type: formData.type,
      enabled: true
    };

    if (editingCell) {
      // 编辑现有小区
      if (editingCell.isDefault) {
        // 编辑默认小区
        setDefaultCells(prev => prev.map(cell => 
          cell.id === editingCell.id 
            ? { ...cell, ...cellData }
            : cell
        ));
      } else {
        // 编辑自定义小区
        setCustomCells(prev => prev.map(cell => 
          cell.id === editingCell.id 
            ? { ...cell, ...cellData }
            : cell
        ));
      }
    } else {
      // 新增自定义小区
      const newCell: CellConfig = {
        id: `custom-${Date.now()}`,
        ...cellData,
        isDefault: false
      };
      setCustomCells(prev => [...prev, newCell]);
    }

    // 重置表单
    setFormData({ name: '', band: '', arfcn: '', pci: '', type: '1CC' });
    setShowAddForm(false);
    setEditingCell(null);
    setError('');
  };

  // 删除小区
  const deleteCell = (cellId: string) => {
    if (window.confirm('确定要删除这个小区配置吗？')) {
      const cell = getAllCells().find(c => c.id === cellId);
      
      if (cell?.isDefault) {
        // 删除默认小区
        setDefaultCells(prev => prev.filter(cell => cell.id !== cellId));
      } else {
        // 删除自定义小区
        setCustomCells(prev => prev.filter(cell => cell.id !== cellId));
      }
      
      // 如果删除的小区正在被选中，取消选中
      setSelectedCells(prev => prev.filter(id => id !== cellId));
    }
  };

  // 切换小区启用状态
  const toggleCellEnabled = (cellId: string) => {
    const cell = getAllCells().find(c => c.id === cellId);
    
    if (cell?.isDefault) {
      // 切换默认小区状态
      setDefaultCells(prev => prev.map(cell => 
        cell.id === cellId ? { ...cell, enabled: !cell.enabled } : cell
      ));
    } else {
      // 切换自定义小区状态
      setCustomCells(prev => prev.map(cell => 
        cell.id === cellId ? { ...cell, enabled: !cell.enabled } : cell
      ));
    }
  };

  // 处理小区选择
  const handleCellSelection = (cellId: string) => {
    setSelectedCells(prev => {
      if (prev.includes(cellId)) {
        return prev.filter(id => id !== cellId);
      } else {
        return [...prev, cellId];
      }
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setShowAddForm(false);
    setEditingCell(null);
    setFormData({ name: '', band: '', arfcn: '', pci: '', type: '1CC' });
    setError('');
  };

  // 组件加载时获取状态
  useEffect(() => {
    loadLockStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">小区管理</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            管理和锁定5G/4G小区 - 支持编辑默认小区
          </p>
        </div>
        <div className="flex space-x-3">
          
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <span className="text-red-400 mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 当前锁定状态 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">🔒</span>
          当前锁定状态
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${lockStatus.isLocked ? 'text-red-600' : 'text-green-600'}`}>
              {lockStatus.isLocked ? '🔒 已锁定' : '🔓 未锁定'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">锁定状态</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {lockStatus.lockedCells.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">锁定小区数</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {lockStatus.lockMode === 'single' ? '单小区' : 
               lockStatus.lockMode === 'multi' ? '多小区' : '自动'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">锁定模式</div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={lockSelectedCells}
            disabled={loading || selectedCells.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '处理中...' : `🔒 锁定选中小区 (${selectedCells.length})`}
          </button>
          
          {lockStatus.isLocked && (
            <button
              onClick={unlockCells}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? '处理中...' : '🔓 解锁所有小区'}
            </button>
          )}
        </div>
      </div>
      {/* 默认小区清单 - 现在支持编辑和删除 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="text-2xl mr-2">📋</span>
          默认小区清单
          <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
            可编辑
          </span>
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  选择
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  小区名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  频段
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  频点
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  PCI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {defaultCells.map((cell) => (
                <tr key={cell.id} className={`${
                  lockStatus.lockedCells.includes(cell.id) ? 'bg-red-50 dark:bg-red-900/20' : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCells.includes(cell.id)}
                      onChange={() => handleCellSelection(cell.id)}
                      disabled={!cell.enabled}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {cell.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {cell.band}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {cell.arfcn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {cell.pci}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cell.type === '2CC' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {cell.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cell.enabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {cell.enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => toggleCellEnabled(cell.id)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        cell.enabled 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                      }`}
                    >
                      {cell.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      onClick={() => startEditCell(cell)}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deleteCell(cell.id)}
                      className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-colors"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 自定义小区清单 */}
      {customCells.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">⚙️</span>
            自定义小区清单
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">选择</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">小区名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">频段</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">频点</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PCI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {customCells.map((cell) => (
                  <tr key={cell.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCells.includes(cell.id)}
                        onChange={() => handleCellSelection(cell.id)}
                        disabled={!cell.enabled}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {cell.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{cell.band}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{cell.arfcn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{cell.pci}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        cell.type === '2CC' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {cell.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => toggleCellEnabled(cell.id)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          cell.enabled 
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
                        }`}
                      >
                        {cell.enabled ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => startEditCell(cell)}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteCell(cell.id)}
                        className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition-colors"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 添加/编辑小区表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingCell ? `编辑小区: ${editingCell.name}` : '添加自定义小区'}
            </h3>
            
            {editingCell && editingCell.isDefault && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-blue-400 mr-2">ℹ️</span>
                  <span className="text-blue-700 text-sm">正在编辑默认小区配置</span>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  小区名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="例如：自定义5G站点"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  频段
                </label>
                <input
                  type="text"
                  value={formData.band}
                  onChange={(e) => setFormData(prev => ({ ...prev, band: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="例如：n78, B3, B1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  频点 (ARFCN)
                </label>
                <input
                  type="number"
                  value={formData.arfcn}
                  onChange={(e) => setFormData(prev => ({ ...prev, arfcn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="例如：630000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PCI
                </label>
                <input
                  type="number"
                  value={formData.pci}
                  onChange={(e) => setFormData(prev => ({ ...prev, pci: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="例如：123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as '1CC' | '2CC' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="1CC">1CC (单载波)</option>
                  <option value="2CC">2CC (载波聚合)</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={saveCell}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCell ? '保存修改' : '添加'}
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
