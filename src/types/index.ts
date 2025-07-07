// MT5700M WebUI TypeScript 类型定义

// 认证相关类型
export interface User {
  id: string;
  username: string;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SetupRequest {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  needsSetup?: boolean;
  needsPasswordChange?: boolean;
  authenticated?: boolean;
}

// WebUI配置
export interface WebUIConfig {
  device: {
    serverIp: string;
    serverPort: number;
    bufferSize: number;
    retryDelay: number;
    timeout: number;
  };
  socket: {
    socketFile: string;
  };
  web: {
    host: string;
    port: number;
    cors: boolean;
  };
  monitoring: {
    enabled: boolean;
    interval: number;
    items: string[];
  };
  security: {
    auth: boolean;
    https: boolean;
  };
}

// 设备配置
export interface DeviceConfig {
  serverIp: string;
  serverPort: number;
  bufferSize: number;
  retryDelay: number;
  timeout: number;
}

export interface SocketConfig {
  socketFile: string;
}

// AT命令
export interface ATCommand {
  command: string;
  timestamp: string;
  response?: string;
  error?: string;
}

// API响应类型
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

// 信号数据类型
export interface SignalData {
  sysmode: string;
  rsrp: number | string;
  rsrq: number | string;
  sinr: number | string;
  rssi?: number | string;
  timestamp: string;
}

// 载波组件
export interface CarrierComponent {
  proa: number;
  sysmode: string;
  band_class: string;
  dl_fcn: string;
  dl_freq: string;
  dl_bw: string;
  ul_fcn: string;
  ul_freq: string;
  ul_bw: string;
}

// 5G NR CC状态
export interface NRCCStatus {
  proa?: number;
  sysmode?: number;
  nr_records: CarrierComponent[];
  lte_records: CarrierComponent[];
  nr_count: number;
  lte_count: number;
  aggregationType?: string;  // 载波聚合类型: 'NR-CA', 'LTE-CA', 'EN-DC', 'NR-SA', 'LTE-SA', 'None'
  aggregationInfo?: string;  // 载波聚合描述信息
  totalCarriers?: number;    // 总载波数量
  timestamp?: string;
}

// 设备信息
export interface DeviceInfo {
  manufacturer?: string;
  model?: string;
  revision?: string;
  imei?: string;
  timestamp?: string;
}

// 温度数据
export interface TemperatureData {
  temperature: string;
  raw_value: number;
  timestamp: string;
}

// 芯片温度（别名）
export interface ChipTemperature extends TemperatureData {}

// 锁定状态
export interface LockStatus {
  status: 'locked' | 'unlocked';
  band: string | null;
  arfcn: string | null;
  pci: string | null;
  timestamp: string;
}

// 自定义小区配置
export interface CustomCellConfig {
  id: string;
  name: string;
  band: string;
  arfcn: string;
  pci: string;
  type: '1CC' | '2CC';
  createdAt: string;
  updatedAt: string;
}

export interface CustomCellConfigRequest {
  name: string;
  band: string;
  arfcn: string;
  pci: string;
  type: '1CC' | '2CC';
}

// 小区锁定选项（包含预设和自定义）
export interface CellLockOption {
  id: string;
  name: string;
  command?: string;
  type: '1CC' | '2CC';
  isCustom?: boolean;
  isPreset?: boolean;
  band?: string;
  arfcn?: string;
  pci?: string;
}
export interface CellInfo {
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

// 扫描进度
export interface ScanProgress {
  stage: 'init' | 'scan' | 'completed' | 'restore';
  message: string;
  progress: number;
}

// 扫描结果
export interface ScanResult {
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

// 扫描完成数据
export interface ScanCompleteData {
  success: boolean;
  results: ScanResult[];
  count: number;
  duration?: number;  // 添加duration属性
  timestamp: string;
}

// 扫描错误数据
export interface ScanErrorData {
  stage: string;
  message: string;
  error: string;
}

// Socket.IO 事件类型定义
export interface ServerToClientEvents {
  // 设备状态更新
  deviceUpdate: (data: {
    connected?: boolean;
    signal?: SignalData;
    temperature?: TemperatureData;
    nrccStatus?: NRCCStatus;
    lockStatus?: LockStatus;
    monitoring?: boolean;
    restarting?: boolean;
  }) => void;

  // 信号更新
  signalUpdate: (data: SignalData) => void;

  // 温度更新
  temperatureUpdate: (data: TemperatureData) => void;

  // 锁定状态更新
  lockStatusUpdate: (data: LockStatus) => void;

  // 扫描进度
  scanProgress: (progress: ScanProgress) => void;

  // 扫描完成
  scanComplete: (data: ScanCompleteData) => void;

  // 扫描完成（新增）
  scanCompleted: (progress: ScanProgress) => void;

  // 网络恢复进度（新增）
  networkRestoreProgress: (progress: ScanProgress) => void;

  // 网络恢复完成（新增）
  networkRestoreComplete: (progress: ScanProgress) => void;

  // 网络恢复错误（新增）
  networkRestoreError: (data: ScanErrorData) => void;

  // 扫描错误
  scanError: (data: ScanErrorData) => void;

  // 通用错误
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  // 发送AT命令
  sendCommand: (command: string, callback: (response: APIResponse) => void) => void;

  // 获取信号数据
  getSignal: (callback: (response: APIResponse<SignalData>) => void) => void;

  // 获取5G状态
  get5GStatus: (callback: (response: APIResponse<NRCCStatus>) => void) => void;

  // 锁定小区
  lockCell: (cellId: string, callback: (response: APIResponse) => void) => void;

  // 解锁小区
  unlockCell: (callback: (response: APIResponse) => void) => void;

  // 初始化配置
  initConfiguration: (callback: (response: APIResponse) => void) => void;

  // 开始扫描
  startScan: (callback: (response: APIResponse) => void) => void;

  // 获取扫描状态
  getScanStatus: (callback: (response: APIResponse) => void) => void;

  // 恢复网络连接（新增）
  restoreNetwork: (callback: (response: APIResponse) => void) => void;

  // 启用/禁用监控
  enableMonitoring: (enabled: boolean) => void;

  // 测试事件
  test: (data: any, callback: (response: APIResponse) => void) => void;
}

// 历史记录
export interface SignalHistory {
  timestamp: Date;
  rsrp: number | null;
  rsrq: number | null;
  sinr: number | null;
}

// 监控数据
export interface MonitoringData {
  signal?: SignalData;
  temperature?: TemperatureData;
  nrccStatus?: NRCCStatus;
  lockStatus?: LockStatus;
  monitoring: boolean;
  timestamp: string;
}
