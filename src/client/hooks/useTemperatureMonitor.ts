import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface TemperatureData {
  temperature?: string;
  raw_value?: number;
  timestamp?: string;
}

interface UseTemperatureMonitorOptions {
  realTime?: boolean;
  pollingInterval?: number;
  onTemperatureChange?: (data: TemperatureData) => void;
  onHighTemperature?: (data: TemperatureData) => void;
  highTemperatureThreshold?: number;
}

interface UseTemperatureMonitorReturn {
  temperatureData: TemperatureData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string;
  isRealTime: boolean;
  setRealTime: (enabled: boolean) => void;
  refreshTemperature: () => Promise<void>;
  getTemperatureStatus: () => {
    color: string;
    text: string;
    bgColor: string;
    level: 'normal' | 'warning' | 'danger' | 'unknown';
  };
}

export function useTemperatureMonitor(
  options: UseTemperatureMonitorOptions = {}
): UseTemperatureMonitorReturn {
  const {
    realTime = true,
    pollingInterval = 30000,
    onTemperatureChange,
    onHighTemperature,
    highTemperatureThreshold = 600 // 60°C
  } = options;

  const [temperatureData, setTemperatureData] = useState<TemperatureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const [isRealTime, setIsRealTime] = useState(realTime);
  const [socket, setSocket] = useState<Socket | null>(null);

  // 获取温度数据
  const fetchTemperature = useCallback(async (): Promise<TemperatureData | null> => {
    try {
      const response = await fetch('/api/device/temperature', { 
        credentials: 'include' 
      });
      const data = await response.json();
      
      if (data.success) {
        return {
          ...data.data,
          timestamp: data.timestamp
        };
      } else {
        throw new Error(data.error || '获取温度数据失败');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : '网络请求失败');
    }
  }, []);

  // 手动刷新温度
  const refreshTemperature = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchTemperature();
      if (data) {
        setTemperatureData(data);
        setLastUpdate(new Date().toLocaleTimeString());
        
        // 触发回调
        onTemperatureChange?.(data);
        
        // 检查高温警告
        if (data.raw_value && data.raw_value > highTemperatureThreshold) {
          onHighTemperature?.(data);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      console.error('温度数据获取失败:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchTemperature, onTemperatureChange, onHighTemperature, highTemperatureThreshold]);

  // WebSocket实时监控
  useEffect(() => {
    if (isRealTime) {
      const socketInstance = io();
      setSocket(socketInstance);

      // 监听温度更新
      socketInstance.on('temperatureUpdate', (data: TemperatureData) => {
        console.log('🌡️ 收到实时温度更新:', data);
        setTemperatureData({
          ...data,
          timestamp: new Date().toISOString()
        });
        setLastUpdate(new Date().toLocaleTimeString());
        setError(null);
        
        // 触发回调
        onTemperatureChange?.(data);
        
        // 检查高温警告
        if (data.raw_value && data.raw_value > highTemperatureThreshold) {
          onHighTemperature?.(data);
        }
      });

      // 监听设备状态更新
      socketInstance.on('deviceUpdate', (data: any) => {
        if (data.temperature) {
          const tempData = {
            ...data.temperature,
            timestamp: new Date().toISOString()
          };
          setTemperatureData(tempData);
          setLastUpdate(new Date().toLocaleTimeString());
          onTemperatureChange?.(tempData);
        }
      });

      // 监听错误
      socketInstance.on('error', (errorMsg: string) => {
        if (errorMsg.includes('温度')) {
          setError(errorMsg);
        }
      });

      return () => {
        socketInstance.disconnect();
        setSocket(null);
      };
    }
  }, [isRealTime, onTemperatureChange, onHighTemperature, highTemperatureThreshold]);

  // 定时轮询（当实时监控关闭时）
  useEffect(() => {
    if (!isRealTime && pollingInterval > 0) {
      // 立即获取一次数据
      refreshTemperature();
      
      const interval = setInterval(refreshTemperature, pollingInterval);
      return () => clearInterval(interval);
    }
  }, [isRealTime, pollingInterval, refreshTemperature]);

  // 初始数据加载
  useEffect(() => {
    if (isRealTime) {
      // 实时模式下也先获取一次初始数据
      refreshTemperature();
    }
  }, [isRealTime, refreshTemperature]);

  // 获取温度状态
  const getTemperatureStatus = useCallback(() => {
    if (!temperatureData?.temperature) {
      return {
        color: 'text-gray-500',
        text: '未知',
        bgColor: 'bg-gray-50',
        level: 'unknown' as const
      };
    }

    const value = parseFloat(temperatureData.temperature);
    if (isNaN(value)) {
      return {
        color: 'text-gray-500',
        text: '未知',
        bgColor: 'bg-gray-50',
        level: 'unknown' as const
      };
    }

    if (value < 40) {
      return {
        color: 'text-green-600',
        text: '正常',
        bgColor: 'bg-green-50',
        level: 'normal' as const
      };
    }
    
    if (value < 60) {
      return {
        color: 'text-yellow-600',
        text: '偏高',
        bgColor: 'bg-yellow-50',
        level: 'warning' as const
      };
    }
    
    return {
      color: 'text-red-600',
      text: '过热',
      bgColor: 'bg-red-50',
      level: 'danger' as const
    };
  }, [temperatureData]);

  // 设置实时监控模式
  const setRealTime = useCallback((enabled: boolean) => {
    setIsRealTime(enabled);
    setError(null);
    
    if (enabled) {
      console.log('🔄 启用温度实时监控');
    } else {
      console.log('⏱️ 切换到温度定时轮询');
      // 立即获取一次数据
      refreshTemperature();
    }
  }, [refreshTemperature]);

  return {
    temperatureData,
    loading,
    error,
    lastUpdate,
    isRealTime,
    setRealTime,
    refreshTemperature,
    getTemperatureStatus
  };
}
