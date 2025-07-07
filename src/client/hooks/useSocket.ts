import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import type { 
  ServerToClientEvents, 
  ClientToServerEvents,
  APIResponse,
  SignalData,
  NRCCStatus
} from '../../types';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketReturn {
  socket: SocketType | null;
  isConnected: boolean;
  sendCommand: (command: string) => Promise<APIResponse>;
  getSignal: () => Promise<APIResponse<SignalData>>;
  get5GStatus: () => Promise<APIResponse<NRCCStatus>>;
  lockCell: (cellId: string) => Promise<APIResponse>;
  unlockCell: () => Promise<APIResponse>;
  initConfiguration: () => Promise<APIResponse>;  // 添加初始化配置方法
  startScan: () => Promise<APIResponse>;
  enableMonitoring: (enabled: boolean) => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 创建Socket连接
    const socketInstance = io({
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 180000, // 3分钟超时，足够CELLSCAN完成
    });

    // 连接事件
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // 设备事件
    socketInstance.on('signalUpdate', (data: SignalData) => {
      console.log('Signal update:', data);
    });

    socketInstance.on('deviceUpdate', (data) => {
      console.log('Device update:', data);
    });

    socketInstance.on('temperatureUpdate', (data) => {
      console.log('Temperature update:', data);
    });

    socketInstance.on('lockStatusUpdate', (data) => {
      console.log('Lock status update:', data);
    });

    // 扫描事件
    socketInstance.on('scanProgress', (progress: { stage: string; message: string; progress: number }) => {
      console.log('Scan progress:', progress);
    });

    socketInstance.on('scanComplete', (data) => {
      console.log('Scan complete:', data);
    });

    socketInstance.on('scanError', (error: { stage: string; message: string; error: string }) => {
      console.error('Scan error:', error);
    });

    // 错误事件
    socketInstance.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    // 清理函数
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // 发送AT命令
  const sendCommand = useCallback(
    (command: string): Promise<APIResponse> => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket未连接'));
          return;
        }

        socket.emit('sendCommand', command, (response: APIResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '命令执行失败'));
          }
        });
      });
    },
    [socket, isConnected]
  );

  // 获取信号数据
  const getSignal = useCallback(
    (): Promise<APIResponse<SignalData>> => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket未连接'));
          return;
        }

        socket.emit('getSignal', (response: APIResponse<SignalData>) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '获取信号失败'));
          }
        });
      });
    },
    [socket, isConnected]
  );

  // 获取5G状态
  const get5GStatus = useCallback(
    (): Promise<APIResponse<NRCCStatus>> => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket未连接'));
          return;
        }

        socket.emit('get5GStatus', (response: APIResponse<NRCCStatus>) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '获取5G状态失败'));
          }
        });
      });
    },
    [socket, isConnected]
  );

  // 锁定小区
  const lockCell = useCallback(
    (cellId: string): Promise<APIResponse> => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket未连接'));
          return;
        }

        socket.emit('lockCell', cellId, (response: APIResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '锁定小区失败'));
          }
        });
      });
    },
    [socket, isConnected]
  );

  // 解锁小区
  const unlockCell = useCallback(
    (): Promise<APIResponse> => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket未连接'));
          return;
        }

        socket.emit('unlockCell', (response: APIResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '解锁小区失败'));
          }
        });
      });
    },
    [socket, isConnected]
  );

  // 初始化配置
  const initConfiguration = useCallback(
    (): Promise<APIResponse> => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket未连接'));
          return;
        }

        socket.emit('initConfiguration', (response: APIResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '初始化配置失败'));
          }
        });
      });
    },
    [socket, isConnected]
  );

  // 开始扫描
  const startScan = useCallback(
    (): Promise<APIResponse> => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket未连接'));
          return;
        }

        socket.emit('startScan', (response: APIResponse) => {
          if (response.success) {
            resolve(response);
          } else {
            reject(new Error(response.error || '开始扫描失败'));
          }
        });
      });
    },
    [socket, isConnected]
  );

  // 启用/禁用监控
  const enableMonitoring = useCallback(
    (enabled: boolean) => {
      if (!socket || !isConnected) {
        console.error('Socket未连接');
        return;
      }

      socket.emit('enableMonitoring', enabled);
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    sendCommand,
    getSignal,
    get5GStatus,
    lockCell,
    unlockCell,
    initConfiguration,  // 添加到返回对象
    startScan,
    enableMonitoring,
  };
}
