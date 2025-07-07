import { Router } from 'express';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);
const router = Router();

interface PingResult {
  success: boolean;
  host: string;
  packetsSent: number;
  packetsReceived: number;
  packetLoss: number;
  avgTime?: number;
  minTime?: number;
  maxTime?: number;
  error?: string;
}

// 优化的Ping网络连通性检测 - 默认2次ping
router.post('/ping', async (req, res) => {
  try {
    // 🚀 优化：默认ping次数改为2次，超时时间改为3秒
    const { host = '223.5.5.5', count = 2, timeout = 3 } = req.body;
    
    console.log(`🌍 收到ping请求: ${host}, 次数: ${count} (优化版)`);
    
    // 验证输入参数
    if (!host || typeof host !== 'string') {
      return res.status(400).json({
        success: false,
        error: '主机地址不能为空',
        timestamp: new Date().toISOString()
      });
    }

    // 限制ping次数范围 (1-5次)
    const validCount = Math.max(1, Math.min(5, parseInt(count.toString()) || 2));
    const validTimeout = Math.max(1, Math.min(10, parseInt(timeout.toString()) || 3));

    // 简单的主机名/IP验证
    const hostPattern = /^[a-zA-Z0-9.-]+$/;
    if (!hostPattern.test(host)) {
      return res.status(400).json({
        success: false,
        error: '无效的主机地址格式',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`📡 开始快速ping检测: ${host}, 次数: ${validCount}, 超时: ${validTimeout}s`);
    
    // 构建优化的ping命令
    const pingCommand = process.platform === 'darwin' 
      ? `ping -c ${validCount} -W ${validTimeout * 1000} ${host}`  // macOS
      : `ping -c ${validCount} -W ${validTimeout} ${host}`;        // Linux
    
    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(pingCommand, {
        timeout: (validTimeout + 1) * 1000 // 给命令执行留出额外时间
      });
      
      const duration = Date.now() - startTime;
      
      // 解析ping输出
      const result = parsePingOutput(stdout, host, validCount);
      
      console.log(`✅ 快速Ping检测完成: ${host}, 耗时: ${duration}ms, 成功率: ${100 - result.packetLoss}%`);
      
      res.json({
        success: true,
        data: {
          ...result,
          duration,
          command: pingCommand,
          optimized: true // 标记为优化版本
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (execError: any) {
      // ping命令执行失败
      const duration = Date.now() - startTime;
      
      console.log(`⚠️ 快速Ping检测失败: ${host}, 错误: ${execError.message}, 耗时: ${duration}ms`);
      
      // 尝试解析错误输出中的信息
      const errorOutput = execError.stdout || execError.stderr || '';
      const result = parsePingOutput(errorOutput, host, validCount, true);
      
      res.json({
        success: false,
        data: {
          ...result,
          duration,
          error: execError.message,
          optimized: true
        },
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ Ping API错误:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Ping检测失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 快速网络连通性检查 - 只ping 1次
router.get('/connectivity/quick', async (req, res) => {
  try {
    console.log('🚀 执行快速网络连通性检查');
    
    const startTime = Date.now();
    
    // 并发检查多个DNS服务器，每个只ping 1次
    const checks = await Promise.allSettled([
      // 检查阿里DNS - 1次ping
      execAsync('ping -c 1 -W 2000 223.5.5.5').then(() => ({ name: '阿里DNS', host: '223.5.5.5', status: 'ok' })),
      // 检查百度DNS - 1次ping  
      execAsync('ping -c 1 -W 2000 180.76.76.76').then(() => ({ name: '百度DNS', host: '180.76.76.76', status: 'ok' })),
      // 检查Google DNS - 1次ping
      execAsync('ping -c 1 -W 2000 8.8.8.8').then(() => ({ name: 'Google DNS', host: '8.8.8.8', status: 'ok' }))
    ]);
    
    const duration = Date.now() - startTime;
    
    // 统计结果
    const results = checks.map((check, index) => {
      const hosts = ['223.5.5.5', '180.76.76.76', '8.8.8.8'];
      const names = ['阿里DNS', '百度DNS', 'Google DNS'];
      
      if (check.status === 'fulfilled') {
        return check.value;
      } else {
        return {
          name: names[index],
          host: hosts[index],
          status: 'failed',
          error: check.reason?.message || '连接失败'
        };
      }
    });
    
    const successCount = results.filter(r => r.status === 'ok').length;
    const totalCount = results.length;
    const successRate = (successCount / totalCount) * 100;
    
    console.log(`✅ 快速连通性检查完成: ${successCount}/${totalCount} 成功, 耗时: ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        connected: successCount > 0,
        successRate,
        successCount,
        totalCount,
        duration,
        results,
        optimized: true,
        mode: 'quick' // 快速模式标记
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 快速连通性检查失败:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '网络检查失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 标准网络连通性检查 - 2次ping提高准确性
router.get('/connectivity/standard', async (req, res) => {
  try {
    console.log('📊 执行标准网络连通性检查');
    
    const startTime = Date.now();
    
    // 并发检查多个DNS服务器，每个ping 2次
    const checks = await Promise.allSettled([
      execAsync('ping -c 2 -W 3000 223.5.5.5').then(() => ({ name: '阿里DNS', host: '223.5.5.5', status: 'ok' })),
      execAsync('ping -c 2 -W 3000 180.76.76.76').then(() => ({ name: '百度DNS', host: '180.76.76.76', status: 'ok' })),
      execAsync('ping -c 2 -W 3000 8.8.8.8').then(() => ({ name: 'Google DNS', host: '8.8.8.8', status: 'ok' }))
    ]);
    
    const duration = Date.now() - startTime;
    
    // 统计结果
    const results = checks.map((check, index) => {
      const hosts = ['223.5.5.5', '180.76.76.76', '8.8.8.8'];
      const names = ['阿里DNS', '百度DNS', 'Google DNS'];
      
      if (check.status === 'fulfilled') {
        return check.value;
      } else {
        return {
          name: names[index],
          host: hosts[index],
          status: 'failed',
          error: check.reason?.message || '连接失败'
        };
      }
    });
    
    const successCount = results.filter(r => r.status === 'ok').length;
    const totalCount = results.length;
    const successRate = (successCount / totalCount) * 100;
    
    console.log(`✅ 标准连通性检查完成: ${successCount}/${totalCount} 成功, 耗时: ${duration}ms`);
    
    res.json({
      success: true,
      data: {
        connected: successCount > 0,
        successRate,
        successCount,
        totalCount,
        duration,
        results,
        optimized: true,
        mode: 'standard' // 标准模式标记
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 标准连通性检查失败:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '网络检查失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 解析ping命令输出 - 优化版本
function parsePingOutput(output: string, host: string, expectedCount: number, isError = false): PingResult {
  const result: PingResult = {
    success: false,
    host,
    packetsSent: expectedCount,
    packetsReceived: 0,
    packetLoss: 100
  };

  if (!output) {
    result.error = '无ping输出';
    return result;
  }

  try {
    // 查找统计信息行 (适配中英文输出)
    const statsPattern = /(\d+) packets transmitted, (\d+) (?:packets )?received, (?:.*?)(\d+(?:\.\d+)?)% packet loss/i;
    const statsMatch = output.match(statsPattern);
    
    if (statsMatch) {
      result.packetsSent = parseInt(statsMatch[1]);
      result.packetsReceived = parseInt(statsMatch[2]);
      result.packetLoss = parseFloat(statsMatch[3]);
      result.success = result.packetLoss < 100;
    }
    
    // 查找时间统计 (rtt min/avg/max/mdev)
    const timePattern = /rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/[\d.]+ ms/i;
    const timeMatch = output.match(timePattern);
    
    if (timeMatch) {
      result.minTime = parseFloat(timeMatch[1]);
      result.avgTime = parseFloat(timeMatch[2]);
      result.maxTime = parseFloat(timeMatch[3]);
    }
    
    // 如果没有找到统计信息但有成功的ping响应，尝试手动计算
    if (!statsMatch && !isError) {
      const pingLines = output.split('\n').filter(line => 
        line.includes('bytes from') && line.includes('time=')
      );
      
      if (pingLines.length > 0) {
        result.packetsReceived = pingLines.length;
        result.packetLoss = ((expectedCount - pingLines.length) / expectedCount) * 100;
        result.success = result.packetLoss < 100;
        
        // 计算平均时间
        const times = pingLines.map(line => {
          const timeMatch = line.match(/time=([\d.]+)/);
          return timeMatch ? parseFloat(timeMatch[1]) : 0;
        }).filter(time => time > 0);
        
        if (times.length > 0) {
          result.avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
          result.minTime = Math.min(...times);
          result.maxTime = Math.max(...times);
        }
      }
    }
    
  } catch (parseError) {
    console.warn('⚠️ 解析ping输出失败:', parseError);
    result.error = '输出解析失败';
  }
  
  return result;
}

export default router;
