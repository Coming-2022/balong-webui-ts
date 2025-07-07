import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { 
  SignalData, 
  ChipTemperature, 
  NRCCStatus, 
  LockStatus,
  CellInfo,
  OperationHistory,
  WebUIConfig
} from '../../types';

interface AppState {
  // 连接状态
  connected: boolean;
  loading: boolean;
  error: string | null;

  // 设备数据
  deviceInfo: any;
  signalData: SignalData | null;
  nrccStatus: NRCCStatus | null;
  lockStatus: LockStatus | null;
  temperature: ChipTemperature | null;

  // 扫描数据
  scanResults: CellInfo[];
  scanProgress: number;
  isScanning: boolean;

  // 历史记录
  operationHistory: OperationHistory[];
  commandHistory: string[];

  // 配置
  config: Partial<WebUIConfig>;
  
  // 界面状态
  darkMode: boolean;
  sidebarCollapsed: boolean;
  autoRefresh: boolean;
  refreshInterval: number;

  // Actions
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  setDeviceInfo: (info: any) => void;
  setSignalData: (data: SignalData | null) => void;
  setNRCCStatus: (status: NRCCStatus | null) => void;
  setLockStatus: (status: LockStatus | null) => void;
  setTemperature: (temp: ChipTemperature | null) => void;
  
  setScanResults: (results: CellInfo[]) => void;
  setScanProgress: (progress: number) => void;
  setIsScanning: (scanning: boolean) => void;
  
  addOperation: (operation: OperationHistory) => void;
  addCommand: (command: string) => void;
  clearHistory: () => void;
  
  updateConfig: (config: Partial<WebUIConfig>) => void;
  
  setDarkMode: (dark: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setAutoRefresh: (auto: boolean) => void;
  setRefreshInterval: (interval: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态
      connected: false,
      loading: false,
      error: null,
      
      deviceInfo: null,
      signalData: null,
      nrccStatus: null,
      lockStatus: null,
      temperature: null,
      
      scanResults: [],
      scanProgress: 0,
      isScanning: false,
      
      operationHistory: [],
      commandHistory: [],
      
      config: {
        device: {
          serverIp: '192.168.8.1',
          serverPort: 20249,
          bufferSize: 8192,
          retryDelay: 3,
          timeout: 120
        },
        web: {
          host: '0.0.0.0',
          port: 3000,
          cors: true
        },
        monitoring: {
          enabled: false,
          interval: 30000,
          items: ['signal', 'temperature', '5g_status']
        }
      },
      
      darkMode: false,
      sidebarCollapsed: false,
      autoRefresh: false,
      refreshInterval: 10000,

      // Actions
      setConnected: (connected) => set({ connected }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      setDeviceInfo: (deviceInfo) => set({ deviceInfo }),
      setSignalData: (signalData) => set({ signalData }),
      setNRCCStatus: (nrccStatus) => set({ nrccStatus }),
      setLockStatus: (lockStatus) => set({ lockStatus }),
      setTemperature: (temperature) => set({ temperature }),
      
      setScanResults: (scanResults) => set({ scanResults }),
      setScanProgress: (scanProgress) => set({ scanProgress }),
      setIsScanning: (isScanning) => set({ isScanning }),
      
      addOperation: (operation) => set((state) => ({
        operationHistory: [operation, ...state.operationHistory].slice(0, 100)
      })),
      
      addCommand: (command) => set((state) => ({
        commandHistory: [command, ...state.commandHistory.filter(c => c !== command)].slice(0, 50)
      })),
      
      clearHistory: () => set({
        operationHistory: [],
        commandHistory: []
      }),
      
      updateConfig: (newConfig) => set((state) => ({
        config: { ...state.config, ...newConfig }
      })),
      
      setDarkMode: (darkMode) => {
        set({ darkMode });
        // 立即更新HTML类名
        if (typeof document !== 'undefined') {
          if (darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
    }),
    {
      name: 'mt5700m-webui-store',
      partialize: (state) => ({
        // 只持久化这些状态
        config: state.config,
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        operationHistory: state.operationHistory.slice(0, 20), // 只保存最近20条
        commandHistory: state.commandHistory.slice(0, 20), // 只保存最近20条
      }),
    }
  )
);

// 选择器函数
export const useConnectionStatus = () => useAppStore((state) => ({
  connected: state.connected,
  loading: state.loading,
  error: state.error
}));

export const useDeviceData = () => useAppStore((state) => ({
  deviceInfo: state.deviceInfo,
  signalData: state.signalData,
  nrccStatus: state.nrccStatus,
  lockStatus: state.lockStatus,
  temperature: state.temperature
}));

export const useScanData = () => useAppStore((state) => ({
  scanResults: state.scanResults,
  scanProgress: state.scanProgress,
  isScanning: state.isScanning
}));

export const useHistory = () => useAppStore((state) => ({
  operationHistory: state.operationHistory,
  commandHistory: state.commandHistory,
  addOperation: state.addOperation,
  addCommand: state.addCommand,
  clearHistory: state.clearHistory
}));

export const useUIState = () => useAppStore((state) => ({
  darkMode: state.darkMode,
  sidebarCollapsed: state.sidebarCollapsed,
  autoRefresh: state.autoRefresh,
  refreshInterval: state.refreshInterval,
  setDarkMode: state.setDarkMode,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setAutoRefresh: state.setAutoRefresh,
  setRefreshInterval: state.setRefreshInterval
}));
