#!/bin/bash

# MT5700M Balong WebUI 管理脚本
# 集成启动、停止、重启、状态查看功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${BLUE}MT5700M Balong WebUI 管理脚本${NC}"
    echo "=================================="
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "可用命令:"
    echo -e "  ${GREEN}start${NC}    启动服务"
    echo -e "  ${RED}stop${NC}     停止服务"
    echo -e "  ${YELLOW}restart${NC}  重启服务"
    echo -e "  ${BLUE}status${NC}   查看状态"
    echo -e "  ${BLUE}logs${NC}     查看日志"
    echo -e "  ${BLUE}build${NC}    重新构建镜像"
    echo -e "  ${RED}clean${NC}    清理资源"
    echo -e "  ${BLUE}help${NC}     显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动服务"
    echo "  $0 logs     # 查看实时日志"
    echo "  $0 status   # 查看服务状态"
}

# 检查Docker环境
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ 错误: Docker未运行，请先启动Docker${NC}"
        exit 1
    fi

    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}❌ 错误: docker-compose.yml文件不存在${NC}"
        exit 1
    fi
}

# 启动服务
start_service() {
    echo -e "${GREEN}🚀 启动 MT5700M Balong WebUI...${NC}"
    check_docker
    
    echo "🔄 停止旧容器..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    echo "🔨 构建并启动服务..."
    docker-compose up --build -d
    
    echo "⏳ 等待服务启动..."
    sleep 5
    
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ 服务启动成功!${NC}"
        echo ""
        echo "🌐 访问地址: http://localhost:3000"
    else
        echo -e "${RED}❌ 服务启动失败!${NC}"
        docker-compose logs
        exit 1
    fi
}

# 停止服务
stop_service() {
    echo -e "${RED}🛑 停止 MT5700M Balong WebUI...${NC}"
    check_docker
    
    docker-compose down --remove-orphans
    echo -e "${GREEN}✅ 服务已停止${NC}"
}

# 重启服务
restart_service() {
    echo -e "${YELLOW}🔄 重启 MT5700M Balong WebUI...${NC}"
    check_docker
    
    docker-compose restart
    sleep 3
    
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ 服务重启成功!${NC}"
    else
        echo -e "${RED}❌ 服务重启失败!${NC}"
        exit 1
    fi
}

# 查看状态
show_status() {
    echo -e "${BLUE}📊 MT5700M Balong WebUI 服务状态${NC}"
    echo "=================================="
    check_docker
    
    echo "🐳 Docker Compose 服务状态:"
    docker-compose ps
    
    if docker-compose ps | grep -q "Up"; then
        echo ""
        echo -e "${GREEN}🌐 服务端点:${NC}"
        echo "  • WebUI: http://localhost:3000"
        echo "  • 健康检查: http://localhost:3000/api/health"
    fi
}

# 查看日志
show_logs() {
    echo -e "${BLUE}📋 查看服务日志${NC}"
    check_docker
    
    docker-compose logs -f
}

# 重新构建
rebuild_service() {
    echo -e "${BLUE}🔨 重新构建服务...${NC}"
    check_docker
    
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    echo -e "${GREEN}✅ 重新构建完成${NC}"
}

# 清理资源
clean_resources() {
    echo -e "${RED}🧹 清理Docker资源...${NC}"
    check_docker
    
    docker-compose down --remove-orphans
    docker system prune -f
    
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 主逻辑
case "${1:-help}" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    build)
        rebuild_service
        ;;
    clean)
        clean_resources
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ 未知命令: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
