import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

interface PingResult {
  success: boolean;
  host: string;
  packetsSent: number;
  packetsReceived: number;
  packetLoss: number;
  minTime?: number;
  maxTime?: number;
  avgTime?: number;
  rawOutput?: string;
}

// Ping网络连通性检测
router.post('/ping', async (req, res) => {
  try {
    const { host = '223.5.5.5', count = 4, timeout = 5 } = req.body;
    
    console.log(`🌍 收到ping请求: ${host}, 次数: ${count}`);
    
    // 验证输入参数
    if (!host || typeof host !== 'string') {
      return res.status(400).json({
        success: false,
        error: '主机地址不能为空',
        timestamp: new Date().toISOString()
      });
    }
    
    // 验证主机地址格式（简单的IP地址验证）
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!ipRegex.test(host) && !domainRegex.test(host)) {
      return res.status(400).json({
        success: false,
        error: '无效的主机地址格式',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`📡 开始ping检测: ${host}, 次数: ${count}`);
    
    // 构建ping命令（兼容Linux和macOS）
    const pingCommand = process.platform === 'darwin' 
      ? `ping -c ${count} -W ${timeout * 1000} ${host}`  // macOS
      : `ping -c ${count} -W ${timeout} ${host}`;        // Linux
    
    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(pingCommand, {
        timeout: (timeout + 2) * 1000 // 给命令执行留出额外时间
      });
      
      const duration = Date.now() - startTime;
      
      // 解析ping输出
      const result = parsePingOutput(stdout, host, count);
      
      console.log(`✅ Ping检测完成: ${host}, 耗时: ${duration}ms, 成功率: ${100 - result.packetLoss}%`);
      
      res.json({
        success: true,
        data: {
          ...result,
          duration,
          rawOutput: stdout
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (execError: any) {
      // ping命令执行失败（可能是网络不通或主机不可达）
      const duration = Date.now() - startTime;
      
      console.log(`⚠️ Ping检测失败: ${host}, 错误: ${execError.message}`);
      
      // 尝试解析错误输出中的信息
      const errorOutput = execError.stdout || execError.stderr || '';
      const result = parsePingOutput(errorOutput, host, count, true);
      
      res.json({
        success: true,
        data: {
          ...result,
          duration,
          rawOutput: errorOutput
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

// 解析ping命令输出
function parsePingOutput(output: string, host: string, expectedCount: number, isError = false): PingResult {
  const result: PingResult = {
    success: false,
    host,
    packetsSent: expectedCount,
    packetsReceived: 0,
    packetLoss: 100
  };
  
  try {
    // 解析统计信息
    // Linux/macOS格式: "4 packets transmitted, 4 received, 0% packet loss"
    const statsMatch = output.match(/(\d+) packets transmitted,\s*(\d+) received,.*?(\d+(?:\.\d+)?)% packet loss/);
    
    if (statsMatch) {
      result.packetsSent = parseInt(statsMatch[1]);
      result.packetsReceived = parseInt(statsMatch[2]);
      result.packetLoss = parseFloat(statsMatch[3]);
      result.success = result.packetLoss < 100;
    }
    
    // 解析时间统计
    // 格式: "round-trip min/avg/max/stddev = 23.123/25.456/28.789/1.234 ms"
    const timeMatch = output.match(/round-trip min\/avg\/max\/stddev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/[\d.]+ ms/);
    
    if (timeMatch) {
      result.minTime = parseFloat(timeMatch[1]);
      result.avgTime = parseFloat(timeMatch[2]);
      result.maxTime = parseFloat(timeMatch[3]);
    } else {
      // 尝试其他格式
      // 格式: "rtt min/avg/max/mdev = 23.123/25.456/28.789/1.234 ms"
      const rttMatch = output.match(/rtt min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)\/[\d.]+ ms/);
      
      if (rttMatch) {
        result.minTime = parseFloat(rttMatch[1]);
        result.avgTime = parseFloat(rttMatch[2]);
        result.maxTime = parseFloat(rttMatch[3]);
      }
    }
    
    // 如果没有找到统计信息但有成功的ping响应，尝试计算
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
  }
  
  return result;
}

// 网络状态检查
router.get('/status', async (req, res) => {
  try {
    console.log('🔍 执行网络状态检查');
    
    // 检查多个网络指标
    const checks = await Promise.allSettled([
      // 检查阿里DNS
      execAsync('ping -c 1 -W 2000 223.5.5.5').then(() => ({ name: '阿里DNS', status: 'ok' })),
      // 检查百度DNS
      execAsync('ping -c 1 -W 2000 180.76.76.76').then(() => ({ name: '百度DNS', status: 'ok' })),
      // 检查Google DNS
      execAsync('ping -c 1 -W 2000 8.8.8.8').then(() => ({ name: 'Google DNS', status: 'ok' }))
    ]);
    
    const results = checks.map((check, index) => {
      const names = ['阿里DNS', '百度DNS', 'Google DNS'];
      return {
        name: names[index],
        status: check.status === 'fulfilled' ? 'ok' : 'failed',
        error: check.status === 'rejected' ? check.reason?.message : undefined
      };
    });
    
    const successCount = results.filter(r => r.status === 'ok').length;
    const overallStatus = successCount > 0 ? 'ok' : 'failed';
    
    console.log(`✅ 网络状态检查完成: ${successCount}/${results.length} 成功`);
    
    res.json({
      success: true,
      data: {
        overall: overallStatus,
        connectivity: successCount / results.length,
        checks: results
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 网络状态检查失败:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '网络状态检查失败',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
