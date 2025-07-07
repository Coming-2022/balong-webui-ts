import { Router } from 'express';
import { ATClient } from '../services/ATClient';

const router = Router();

// 健康检查端点
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        webui: 'healthy',
        mt5700m: 'unknown'
      }
    };

    // 可选：检查MT5700M设备连接状态
    // 这里可以添加简单的设备连接检查
    
    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// 详细状态检查
router.get('/status', async (req, res) => {
  try {
    const status = {
      application: {
        name: 'MT5700M Balong WebUI',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      configuration: {
        mt5700m_ip: process.env.MT5700M_IP || '192.168.8.1',
        mt5700m_port: process.env.MT5700M_PORT || '20249',
        webui_port: process.env.PORT || '3000'
      }
    };

    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Status check failed'
    });
  }
});

export default router;
