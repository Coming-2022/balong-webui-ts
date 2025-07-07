import type { WebUIConfig } from '../types';

// 从环境变量读取配置，提供默认值
export const config: WebUIConfig = {
  device: {
    serverIp: process.env.DEVICE_IP || '192.168.8.1',
    serverPort: parseInt(process.env.DEVICE_PORT || '20249'),
    bufferSize: parseInt(process.env.BUFFER_SIZE || '8192'),
    retryDelay: parseInt(process.env.RETRY_DELAY || '3'),
    timeout: parseInt(process.env.TIMEOUT || '120')
  },
  
  socket: {
    socketFile: process.env.SOCKET_FILE || '/tmp/at_socket.sock'
  },
  
  web: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: parseInt(process.env.SERVER_PORT || '3000'),
    cors: process.env.ENABLE_CORS === 'true'
  },
  
  monitoring: {
    enabled: process.env.ENABLE_MONITORING === 'true',
    interval: parseInt(process.env.MONITORING_INTERVAL || '30000'),
    items: (process.env.MONITORING_ITEMS || 'signal,temperature,5g_status').split(',')
  },
  
  security: {
    auth: process.env.ENABLE_AUTH === 'true',
    https: process.env.ENABLE_HTTPS === 'true'
  }
};

// AT命令配置
export const AT_COMMANDS = {
  view_5g_nr_cc_status: "AT^HFREQINFO?",
  view_signal: "AT^HCSQ?",
  restart_cellular: "AT+CFUN=1,1",
  check_lock_status: "AT^NRFREQLOCK?",
  lock_cell_16: 'AT^NRFREQLOCK=2,0,1,"78","627264","1","16"',
  lock_cell_334_627264: 'AT^NRFREQLOCK=2,0,1,"78","627264","1","334"',
  lock_cell_334_633984: 'AT^NRFREQLOCK=2,0,1,"78","633984","1","334"',
  lock_cell_579_627264: 'AT^NRFREQLOCK=2,0,1,"78","627264","1","579"',
  lock_cell_579_633984: 'AT^NRFREQLOCK=2,0,1,"78","633984","1","579"',
  lock_cell_default: 'AT^NRFREQLOCK=2,0,1,"78","627264","1","579"',
  unlock_cell: "AT^NRFREQLOCK=0",
  chip_temp: "AT^CHIPTEMP?",
  device_info: "ATI",
  cell_scan_init: [
    "AT^C5GOPTION=1,1,1",
    "AT^LTEFREQLOCK=0", 
    "AT^NRFREQLOCK=0",
    "AT^SYSCFGEX=\"0803\",3FFFFFFF,1,2,7FFFFFFFFFFFFFFF,,"
  ],
  cell_scan: "AT^CELLSCAN=3",
  cops_detach: "AT+COPS=2",
  cops_attach: "AT+COPS=0"
} as const;

// 小区锁定选项
export const CELL_LOCK_OPTIONS = [
  {
    id: 'cell_16',
    name: 'Cell 16 (ARFCN 627264)',
    command: 'lock_cell_16',
    type: '1CC' as const
  },
  {
    id: 'cell_579_627264', 
    name: 'Cell 579 (ARFCN 627264)',
    command: 'lock_cell_579_627264',
    type: '2CC' as const
  },
  {
    id: 'cell_334_627264',
    name: 'Cell 334 (ARFCN 627264)', 
    command: 'lock_cell_334_627264',
    type: '2CC' as const
  },
  {
    id: 'cell_334_633984',
    name: 'Cell 334 (ARFCN 633984)',
    command: 'lock_cell_334_633984', 
    type: '2CC' as const
  }
];

// 验证配置
export function validateConfig(): void {
  const errors: string[] = [];
  
  if (!config.device.serverIp) {
    errors.push('DEVICE_IP is required');
  }
  
  if (config.device.serverPort < 1 || config.device.serverPort > 65535) {
    errors.push('DEVICE_PORT must be between 1 and 65535');
  }
  
  if (config.web.port < 1 || config.web.port > 65535) {
    errors.push('SERVER_PORT must be between 1 and 65535');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
