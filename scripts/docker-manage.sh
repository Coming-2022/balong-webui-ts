#!/bin/bash

# MT5700M WebUI Docker 管理脚本

set -e

# 配置
COMPOSE_FILE="docker-compose.yml"
SERVICE_NAME="mt5700m-webui"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查服务状态
check_status() {
    log_info "检查服务状态..."
    docker-compose -f $COMPOSE_FILE ps
}

# 智能启动服务
start_service() {
    log_info "启动MT5700M WebUI服务..."
    
    # 先检查是否需要重新构建
    if ./scripts/docker-build.sh; then
        log_info "使用最新镜像启动服务..."
        docker-compose -f $COMPOSE_FILE up -d
        
        # 等待服务启动
        log_info "等待服务启动..."
        sleep 10
        
        # 检查健康状态
        if docker-compose -f $COMPOSE_FILE ps | grep -q "healthy\|Up"; then
            log_success "服务启动成功！"
            log_info "访问地址: http://localhost:3000"
            log_info "默认账户: admin/123456"
        else
            log_error "服务启动失败，请检查日志"
            docker-compose -f $COMPOSE_FILE logs --tail=50
        fi
    else
        log_error "镜像构建失败，无法启动服务"
        exit 1
    fi
}

# 停止服务
stop_service() {
    log_info "停止MT5700M WebUI服务..."
    docker-compose -f $COMPOSE_FILE down
    log_success "服务已停止"
}

# 重启服务
restart_service() {
    log_info "重启MT5700M WebUI服务..."
    stop_service
    start_service
}

# 查看日志
show_logs() {
    local lines=${1:-100}
    log_info "显示服务日志（最近${lines}行）..."
    docker-compose -f $COMPOSE_FILE logs --tail=$lines -f
}

# 进入容器
enter_container() {
    log_info "进入容器..."
    docker-compose -f $COMPOSE_FILE exec $SERVICE_NAME sh
}

# 更新服务
update_service() {
    log_info "更新MT5700M WebUI服务..."
    
    # 强制重新构建
    ./scripts/docker-build.sh --force
    
    # 重启服务
    restart_service
    
    # 清理旧镜像
    ./scripts/docker-build.sh --cleanup
    
    log_success "服务更新完成！"
}

# 清理资源
cleanup() {
    log_info "清理Docker资源..."
    
    # 停止服务
    docker-compose -f $COMPOSE_FILE down
    
    # 清理旧镜像
    ./scripts/docker-build.sh --cleanup
    
    # 清理未使用的资源
    docker system prune -f
    
    log_success "清理完成"
}

# 显示帮助
show_help() {
    echo "MT5700M WebUI Docker 管理工具"
    echo ""
    echo "用法: $0 <命令> [选项]"
    echo ""
    echo "命令:"
    echo "  start     启动服务（智能构建）"
    echo "  stop      停止服务"
    echo "  restart   重启服务"
    echo "  status    查看服务状态"
    echo "  logs      查看服务日志"
    echo "  shell     进入容器"
    echo "  update    更新服务（强制重新构建）"
    echo "  cleanup   清理Docker资源"
    echo "  help      显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start          # 启动服务"
    echo "  $0 logs 50        # 查看最近50行日志"
    echo "  $0 update         # 更新服务"
}

# 主函数
main() {
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
            check_status
            ;;
        logs)
            show_logs ${2:-100}
            ;;
        shell)
            enter_container
            ;;
        update)
            update_service
            ;;
        cleanup)
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 检查依赖
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker未安装或不在PATH中"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    log_error "docker-compose未安装或不在PATH中"
    exit 1
fi

# 运行主函数
main "$@"
