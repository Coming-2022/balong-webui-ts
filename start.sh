#!/bin/bash

# MT5700M Balong WebUI 启动脚本
# 使用Docker Compose启动服务

set -e

echo "🚀 启动 MT5700M Balong WebUI..."

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

# 停止可能存在的旧容器
echo "🔄 停止旧容器..."
docker-compose down --remove-orphans 2>/dev/null || true

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
if docker-compose ps | grep -q "Up"; then
    echo "✅ 服务启动成功!"
    echo ""
    echo "📊 服务状态:"
    docker-compose ps
    echo ""
    echo "🌐 访问地址: http://localhost:3000"
    echo "📋 查看日志: docker-compose logs -f"
    echo "🛑 停止服务: ./stop.sh"
else
    echo "❌ 服务启动失败!"
    echo "📋 查看错误日志:"
    docker-compose logs
    exit 1
fi
