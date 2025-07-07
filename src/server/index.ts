// 首先加载环境变量
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';

import { ATClient } from './services/ATClient';
import { DeviceMonitor } from './services/DeviceMonitor';
import { AuthService } from './services/AuthService';
import { CustomCellService } from './services/CustomCellService';
import { AuthMiddleware } from './middleware/auth';
import { setupRoutes } from './routes';
import { createAuthRoutes } from './routes/auth';
import { createCustomCellRoutes } from './routes/customCells';
import networkRoutes from './routes/network';
import { setupSocketHandlers } from './socket';
import { logger } from './utils/logger';
import { config } from './config';

import type { 
  ServerToClientEvents, 
  ClientToServerEvents 
} from '../types';

class MT5700MServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private io: Server<ClientToServerEvents, ServerToClientEvents>;
  private atClient: ATClient;
  private deviceMonitor: DeviceMonitor;
  private authService: AuthService;
  private customCellService: CustomCellService;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    
    // 初始化认证服务
    this.authService = new AuthService();
    this.customCellService = new CustomCellService();
    this.authMiddleware = new AuthMiddleware(this.authService);
    this.io = new Server(this.server, {
      cors: {
        origin: config.web.cors ? "*" : false,
        methods: ["GET", "POST"]
      }
    });

    this.atClient = new ATClient(config.device, config.socket);
    this.deviceMonitor = new DeviceMonitor(this.atClient, this.io);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocket();
  }

  private setupMiddleware(): void {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }));

    // CORS
    if (config.web.cors) {
      this.app.use(cors({
        origin: true,
        credentials: true
      }));
    }

    // 压缩
    this.app.use(compression());

    // Cookie 解析
    this.app.use(cookieParser());

    // JSON解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // 请求日志
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // 静态文件服务 - 必须在API路由之前
    if (process.env.NODE_ENV === 'production') {
      // 生产环境：使用构建后的静态文件
      const clientPath = path.join(__dirname, '../client');
      console.log('Serving static files from:', clientPath);
      this.app.use(express.static(clientPath));
    } else {
      // 开发环境：重定向到前端开发服务器
      this.app.get('/', (req, res) => {
        res.redirect('http://localhost:5173');
      });
    }
  }

  private setupRoutes(): void {
    // 1. 认证路由（不需要认证）
    this.app.use('/api/auth', createAuthRoutes(this.authService));
    
    // 2. 健康检查（不需要认证）
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
      });
    });

    // 3. 临时网络测试路由（不需要认证）- 用于调试
    this.app.post('/api/network-test/ping', async (req, res) => {
      console.log('🧪 收到网络测试请求 (无认证)');
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        const { host = '223.5.5.5', count = 2 } = req.body;
        const pingCommand = process.platform === 'darwin' 
          ? `ping -c ${count} -W 3000 ${host}`
          : `ping -c ${count} -W 3 ${host}`;
        
        const { stdout } = await execAsync(pingCommand, { timeout: 8000 });
        
        res.json({
          success: true,
          message: '网络测试成功 - 无需认证',
          data: { host, output: stdout.split('\n').slice(-3) },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.json({
          success: false,
          message: '网络测试失败但API可访问',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // 4. 网络检测路由（不需要认证）- 必须在认证中间件之前
    console.log('📡 注册网络检测路由 (无需认证)');
    this.app.use('/api/network', networkRoutes);

    // 5. 业务路由（包含认证中间件）
    console.log('🔐 注册业务路由 (需要认证)');
    setupRoutes(this.app, this.atClient);
    
    // 6. 自定义小区配置路由（需要认证）
    this.app.use('/api/custom-cells', createCustomCellRoutes(this.customCellService, this.atClient));

    // SPA路由处理 - 必须在最后，处理所有未匹配的路由
    if (process.env.NODE_ENV === 'production') {
      this.app.get('*', (req, res) => {
        // 跳过API路由和socket.io
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
          return res.status(404).json({ error: 'Not Found' });
        }
        
        const indexPath = path.join(__dirname, '../client/index.html');
        console.log('Serving SPA route from:', indexPath);
        res.sendFile(indexPath);
      });
    }
  }

  private setupSocket(): void {
    setupSocketHandlers(this.io, this.atClient, this.deviceMonitor);
  }

  public async start(): Promise<void> {
    try {
      // 尝试初始化AT客户端，但不阻塞服务器启动
      try {
        await this.atClient.initialize();
        logger.info('AT客户端初始化成功');
        
        // 启动设备监控
        if (config.monitoring.enabled) {
          this.deviceMonitor.start();
          logger.info('设备监控已启动');
        }
      } catch (error) {
        logger.warn('AT客户端初始化失败，服务器将在设备离线模式下启动', error);
        // 不抛出错误，允许服务器继续启动
      }

      // 启动HTTP服务器
      this.server.listen(config.web.port, config.web.host, () => {
        logger.info(`MT5700M WebUI服务器启动成功`, {
          host: config.web.host,
          port: config.web.port,
          env: process.env.NODE_ENV || 'development'
        });
        
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MT5700M Balong WebUI                      ║
║                      TypeScript版本                          ║
╠══════════════════════════════════════════════════════════════╣
║  🌐 访问地址: http://${config.web.host}:${config.web.port.toString().padEnd(28)} ║
║  📡 设备地址: ${config.device.serverIp}:${config.device.serverPort.toString().padEnd(23)} ║
║  🔧 Socket文件: ${config.socket.socketFile.padEnd(25)} ║
║  📊 监控状态: ${(config.monitoring.enabled ? '已启用' : '已禁用').padEnd(26)} ║
╚══════════════════════════════════════════════════════════════╝
        `);
      });

      // 优雅关闭处理
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('服务器启动失败', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`收到${signal}信号，开始优雅关闭...`);

      // 停止接受新连接
      this.server.close(() => {
        logger.info('HTTP服务器已关闭');
      });

      // 关闭Socket.IO
      this.io.close(() => {
        logger.info('Socket.IO服务器已关闭');
      });

      // 停止设备监控
      this.deviceMonitor.stop();
      logger.info('设备监控已停止');

      // 关闭AT客户端
      await this.atClient.close();
      logger.info('AT客户端已关闭');

      logger.info('服务器已优雅关闭');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝', { reason, promise });
      process.exit(1);
    });
  }
}

// 启动服务器
const server = new MT5700MServer();
server.start().catch((error) => {
  logger.error('服务器启动失败', error);
  process.exit(1);
});
