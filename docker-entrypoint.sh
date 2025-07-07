#!/bin/sh
set -e

# 打印启动信息
echo "🚀 Starting MT5700M Balong WebUI..."
echo "📡 MT5700M Device: ${MT5700M_IP:-192.168.8.1}:${MT5700M_PORT:-20249}"
echo "🌐 WebUI Port: ${PORT:-3000}"
echo "🔧 Environment: ${NODE_ENV:-production}"

# 检查MT5700M设备连接
echo "🔍 Checking MT5700M device connectivity..."
if ping -c 1 -W 5 "${MT5700M_IP:-192.168.8.1}" > /dev/null 2>&1; then
    echo "✅ MT5700M device is reachable"
else
    echo "⚠️  Warning: MT5700M device (${MT5700M_IP:-192.168.8.1}) is not reachable"
    echo "   Please ensure the device is connected and accessible"
fi

# 等待一下让网络稳定
sleep 2

# 执行传入的命令
exec "$@"
