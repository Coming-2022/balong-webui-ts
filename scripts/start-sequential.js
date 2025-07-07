#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 开始顺序启动 MT5700M WebUI...\n');

// 检查后端健康状态
function checkBackendHealth(retries = 15) {
  return new Promise((resolve, reject) => {
    const checkHealth = (attempt) => {
      const req = http.get('http://localhost:3002/api/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(data);
              if (json.success) {
                console.log('✅ 后端服务器健康检查通过');
                resolve(true);
                return;
              }
            } catch (e) {
              // JSON解析失败，继续重试
            }
          }
          
          if (attempt < retries) {
            console.log(`⏳ 后端服务器未就绪 (${attempt}/${retries})，2秒后重试...`);
            setTimeout(() => checkHealth(attempt + 1), 2000);
          } else {
            reject(new Error('后端服务器健康检查超时'));
          }
        });
      });

      req.on('error', (err) => {
        if (attempt < retries) {
          console.log(`⏳ 等待后端服务器启动 (${attempt}/${retries})...`);
          setTimeout(() => checkHealth(attempt + 1), 2000);
        } else {
          reject(new Error('后端服务器启动失败'));
        }
      });

      req.setTimeout(3000, () => {
        req.destroy();
        if (attempt < retries) {
          setTimeout(() => checkHealth(attempt + 1), 2000);
        } else {
          reject(new Error('后端服务器连接超时'));
        }
      });
    };

    checkHealth(1);
  });
}

// 启动后端服务器
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🔧 启动后端服务器...');
    
    const backend = spawn('npm', ['run', 'server:dev'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let backendReady = false;

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[后端] ${output}`);
      
      // 检查后端是否已启动成功
      if (output.includes('MT5700M WebUI服务器启动成功') && !backendReady) {
        backendReady = true;
        console.log('✅ 后端服务器启动完成');
        resolve(backend);
      }
    });

    backend.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(`[后端错误] ${output}`);
    });

    backend.on('error', (error) => {
      console.error('❌ 后端服务器启动失败:', error.message);
      reject(error);
    });

    backend.on('exit', (code) => {
      if (code !== 0 && !backendReady) {
        reject(new Error(`后端服务器异常退出，代码: ${code}`));
      }
    });

    // 超时检查 - 如果10秒内没有看到启动成功消息，直接进行健康检查
    setTimeout(() => {
      if (!backendReady) {
        console.log('⏰ 后端启动检测超时，开始健康检查...');
        checkBackendHealth()
          .then(() => {
            backendReady = true;
            resolve(backend);
          })
          .catch(reject);
      }
    }, 10000);
  });
}

// 启动前端服务器
function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🎨 启动前端服务器...');
    
    const frontend = spawn('npm', ['run', 'client:dev'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let frontendReady = false;

    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(`[前端] ${output}`);
      
      // 检查前端是否已启动成功
      if (output.includes('ready in') && !frontendReady) {
        frontendReady = true;
        console.log('✅ 前端服务器启动完成');
        resolve(frontend);
      }
    });

    frontend.stderr.on('data', (data) => {
      const output = data.toString();
      // 过滤掉代理错误，因为这些在后端就绪后会自动恢复
      if (!output.includes('proxy error')) {
        process.stderr.write(`[前端] ${output}`);
      }
    });

    frontend.on('error', (error) => {
      console.error('❌ 前端服务器启动失败:', error.message);
      reject(error);
    });

    frontend.on('exit', (code) => {
      if (code !== 0 && !frontendReady) {
        reject(new Error(`前端服务器异常退出，代码: ${code}`));
      }
    });
  });
}

// 主启动流程
async function main() {
  let backendProcess, frontendProcess;

  try {
    // 1. 启动后端
    backendProcess = await startBackend();
    
    // 2. 等待后端完全就绪
    await checkBackendHealth();
    
    // 3. 启动前端
    frontendProcess = await startFrontend();
    
    console.log('\n🎉 所有服务启动完成！');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    MT5700M Balong WebUI                      ║');
    console.log('║                      启动成功                                ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  🌐 前端访问: http://localhost:3001                        ║');
    console.log('║  🔧 后端API:  http://localhost:3000                        ║');
    console.log('║  📊 状态监控: 实时WebSocket连接已建立                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ 启动失败:', error.message);
    
    // 清理进程
    if (backendProcess) {
      console.log('🧹 清理后端进程...');
      backendProcess.kill('SIGTERM');
    }
    if (frontendProcess) {
      console.log('🧹 清理前端进程...');
      frontendProcess.kill('SIGTERM');
    }
    
    process.exit(1);
  }

  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n🛑 收到退出信号，正在关闭服务...');
    
    if (frontendProcess) {
      console.log('🧹 关闭前端服务器...');
      frontendProcess.kill('SIGTERM');
    }
    
    if (backendProcess) {
      console.log('🧹 关闭后端服务器...');
      backendProcess.kill('SIGTERM');
    }
    
    setTimeout(() => {
      console.log('👋 服务已关闭');
      process.exit(0);
    }, 2000);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务...');
    if (backendProcess) backendProcess.kill('SIGTERM');
    if (frontendProcess) frontendProcess.kill('SIGTERM');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('💥 启动脚本异常:', error);
  process.exit(1);
});
