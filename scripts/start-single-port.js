#!/usr/bin/env node

/**
 * 单端口启动脚本
 * 在生产环境中，只启动后端服务器（端口3000）
 * 前端静态文件由后端服务器提供
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动 MT5700M WebUI (单端口模式)');
console.log('📡 访问地址: http://localhost:3000');
console.log('');

// 设置环境变量
process.env.NODE_ENV = 'production';
process.env.SINGLE_PORT_MODE = 'true';

// 启动后端服务器
const serverProcess = spawn('node', ['dist/server/index.js'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env: process.env
});

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务器...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

serverProcess.on('exit', (code) => {
  console.log(`\n服务器进程退出，代码: ${code}`);
  process.exit(code);
});
