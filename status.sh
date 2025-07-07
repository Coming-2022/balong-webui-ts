#!/bin/bash

# MT5700M Balong WebUI 状态查看脚本
# 查看Docker服务运行状态

set -e

echo "📊 MT5700M Balong WebUI 服务状态"
echo "=================================="

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行"
    exit 1
fi

# 检查docker-compose.yml是否存在
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml文件不存在"
    exit 1
fi

# 显示服务状态
echo "🐳 Docker Compose 服务状态:"
docker-compose ps

echo ""
echo "📋 最近日志 (最后20行):"
docker-compose logs --tail=20

echo ""
echo "💾 资源使用情况:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose ps -q) 2>/dev/null || echo "没有运行的容器"

echo ""
echo "🌐 服务端点:"
if docker-compose ps | grep -q "Up"; then
    echo "  • WebUI: http://localhost:3000"
    echo "  • 健康检查: http://localhost:3000/api/health"
else
    echo "  • 服务未运行"
fi

echo ""
echo "🔧 常用命令:"
echo "  • 启动服务: ./start.sh"
echo "  • 停止服务: ./stop.sh"
echo "  • 查看日志: docker-compose logs -f"
echo "  • 重启服务: docker-compose restart"
