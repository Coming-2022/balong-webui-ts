#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 开始延迟启动 MT5700M WebUI...\n');

// 启动后端
console.log('🔧 启动后端服务器...');
const backend = spawn('npm', ['run', 'server:dev'], {
  stdio: 'inherit',
  shell: true
});

// 等待8秒后启动前端
setTimeout(() => {
  console.log('\n🎨 启动前端服务器...');
  const frontend = spawn('npm', ['run', 'client:dev'], {
    stdio: 'inherit',
    shell: true
  });

  // 处理退出信号
  process.on('SIGINT', () => {
    console.log('\n🛑 收到退出信号，正在关闭服务...');
    frontend.kill('SIGTERM');
    backend.kill('SIGTERM');
    setTimeout(() => process.exit(0), 2000);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务...');
    frontend.kill('SIGTERM');
    backend.kill('SIGTERM');
    process.exit(0);
  });

  frontend.on('exit', (code) => {
    if (code !== 0) {
      console.log('❌ 前端服务器异常退出');
      backend.kill('SIGTERM');
      process.exit(1);
    }
  });

}, 8000);

backend.on('exit', (code) => {
  if (code !== 0) {
    console.log('❌ 后端服务器异常退出');
    process.exit(1);
  }
});

console.log('⏰ 后端启动中，8秒后启动前端...');
