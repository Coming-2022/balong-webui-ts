#!/bin/bash

# MT5700M Balong WebUI 重启脚本
# 重启Docker Compose服务

set -e

echo "🔄 重启 MT5700M Balong WebUI..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ 错误: Docker未运行，请先启动Docker"
    exit 1
fi

# 检查docker-compose.yml是否存在
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: docker-compose.yml文件不存在"
    exit 1
fi

# 显示当前状态
echo "📊 当前服务状态:"
docker-compose ps 2>/dev/null || echo "没有运行的服务"

# 重启服务
echo "🔄 重启服务..."
docker-compose restart

# 等待服务启动
echo "⏳ 等待服务重启..."
sleep 3

# 检查服务状态
if docker-compose ps | grep -q "Up"; then
    echo "✅ 服务重启成功!"
    echo ""
    echo "📊 服务状态:"
    docker-compose ps
    echo ""
    echo "🌐 访问地址: http://localhost:3000"
else
    echo "❌ 服务重启失败!"
    echo "📋 查看错误日志:"
    docker-compose logs --tail=50
    exit 1
fi
