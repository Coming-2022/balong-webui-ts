import winston from 'winston';
import path from 'path';

// 日志级别
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 日志颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// 日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// 生产环境格式（JSON）
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// 传输器配置
const transports = [
  // 控制台输出
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? productionFormat : format,
  }),
  
  // 错误日志文件
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: productionFormat,
  }),
  
  // 所有日志文件
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: productionFormat,
  }),
];

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels,
  format: productionFormat,
  transports,
  exitOnError: false,
});

// 开发环境下的额外配置
if (process.env.NODE_ENV === 'development') {
  logger.debug('Logger initialized in development mode');
}

// HTTP请求日志中间件
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `${info.timestamp} HTTP: ${info.message}`,
    ),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'http.log'),
    }),
  ],
});

// 性能监控日志
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'performance.log'),
    }),
  ],
});

// AT命令日志
export const atLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `${info.timestamp} AT: ${info.message}`,
    ),
  ),
  transports: [
    new winston.transports.Console({
      level: 'info', // 控制台只显示info及以上级别
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'at-commands.log'),
    }),
  ],
});

// 工具函数
export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  performanceLogger.info('Performance metric', {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

export const logATCommand = (command: string, response?: string, error?: string) => {
  const logData = {
    command,
    timestamp: new Date().toISOString(),
    ...(response && { response: response.substring(0, 200) }), // 限制响应长度
    ...(error && { error }),
  };
  
  if (error) {
    atLogger.error('AT command failed', logData);
  } else {
    atLogger.debug('AT command executed', logData);
  }
};

// 确保日志目录存在
import fs from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
