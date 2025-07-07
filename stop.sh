#!/bin/bash

# MT5700M Balong WebUI 停止脚本
# 停止Docker Compose服务

set -e

echo "🛑 停止 MT5700M Balong WebUI..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ 错误: Docker未运行"
    exit 1
fi

# 检查docker-compose.yml是否存在
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误: docker-compose.yml文件不存在"
    exit 1
fi

# 显示当前运行的服务
echo "📊 当前服务状态:"
docker-compose ps 2>/dev/null || echo "没有运行的服务"

# 停止服务
echo "🔄 停止服务..."
docker-compose down --remove-orphans

# 可选：清理未使用的镜像和容器
read -p "🗑️  是否清理未使用的Docker资源? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理未使用的Docker资源..."
    docker system prune -f
    echo "✅ 清理完成"
fi

echo "✅ 服务已停止"
