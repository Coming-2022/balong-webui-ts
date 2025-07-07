#!/bin/bash

# MT5700M Balong WebUI TypeScript版本启动脚本

set -e

echo "=========================================="
echo "MT5700M Balong WebUI - TypeScript版本"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查Node.js环境
check_node() {
    if ! command -v node &> /dev/null; then
        log_error "未找到Node.js，请先安装Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js版本过低，需要18+，当前版本: $(node -v)"
        exit 1
    fi
    
    log_success "Node.js版本检查通过: $(node -v)"
}

# 检查依赖
check_dependencies() {
    log_info "检查项目依赖..."
    
    if [ ! -d "node_modules" ]; then
        log_info "安装项目依赖..."
        npm install
        if [ $? -ne 0 ]; then
            log_error "依赖安装失败"
            exit 1
        fi
    fi
    
    log_success "依赖检查完成"
}

# 检查环境配置
check_env() {
    log_info "检查环境配置..."
    
    if [ ! -f ".env" ]; then
        log_warning "未找到.env文件，复制.env.example..."
        cp .env.example .env
    fi
    
    # 读取配置
    source .env 2>/dev/null || true
    
    DEVICE_IP=${DEVICE_IP:-192.168.8.1}
    DEVICE_PORT=${DEVICE_PORT:-20249}
    
    log_info "设备配置: ${DEVICE_IP}:${DEVICE_PORT}"
}

# 检查设备连接
check_device() {
    log_info "检查MT5700M设备连接..."
    
    if ping -c 1 -W 3 "$DEVICE_IP" &> /dev/null; then
        log_success "设备连接正常: $DEVICE_IP"
    else
        log_warning "无法ping通设备IP: $DEVICE_IP"
        log_warning "请确保:"
        log_warning "1. MT5700M设备已正确连接"
        log_warning "2. 设备IP地址为 $DEVICE_IP"
        log_warning "3. AT网络端口已开启"
        
        read -p "是否继续启动? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 构建服务器端
    log_info "构建服务器端代码..."
    npm run build:server
    
    # 构建客户端
    log_info "构建客户端代码..."
    npm run build:client
    
    log_success "项目构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 清理旧的PID文件和socket文件
    rm -f /tmp/mt5700m_*.pid
    rm -f /tmp/at_socket.sock
    
    # 创建日志目录
    mkdir -p logs
    
    # 启动服务器
    log_info "启动MT5700M WebUI服务器..."
    
    if [ "$NODE_ENV" = "development" ]; then
        # 开发模式
        log_info "启动开发模式..."
        npm run dev
    else
        # 生产模式
        log_info "启动生产模式..."
        npm start &
        SERVER_PID=$!
        echo $SERVER_PID > /tmp/mt5700m_webui.pid
        
        # 等待服务器启动
        sleep 3
        
        if ! ps -p $SERVER_PID > /dev/null; then
            log_error "服务器启动失败"
            exit 1
        fi
        
        log_success "服务器启动成功 (PID: $SERVER_PID)"
        
        echo ""
        echo "=========================================="
        echo "MT5700M Balong WebUI 启动完成!"
        echo "=========================================="
        echo "访问地址: http://localhost:${SERVER_PORT:-3000}"
        echo "设备地址: ${DEVICE_IP}:${DEVICE_PORT}"
        echo "服务器PID: $SERVER_PID"
        echo ""
        echo "按 Ctrl+C 停止服务"
        echo "或运行: ./scripts/stop.sh"
        echo "=========================================="
        
        # 等待用户中断
        trap 'echo ""; echo "正在停止服务..."; kill $SERVER_PID 2>/dev/null; rm -f /tmp/mt5700m_*.pid /tmp/at_socket.sock; echo "服务已停止"; exit 0' INT
        
        # 监控进程状态
        while true; do
            if ! ps -p $SERVER_PID > /dev/null; then
                log_error "服务器进程异常退出"
                break
            fi
            sleep 5
        done
        
        # 清理
        rm -f /tmp/mt5700m_*.pid /tmp/at_socket.sock
        log_info "服务已停止"
    fi
}

# 主函数
main() {
    # 检查是否在项目根目录
    if [ ! -f "package.json" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 执行检查和启动流程
    check_node
    check_dependencies
    check_env
    check_device
    
    # 根据参数决定是否构建
    if [ "$1" = "--build" ] || [ "$NODE_ENV" = "production" ]; then
        build_project
    fi
    
    start_services
}

# 显示帮助信息
show_help() {
    echo "MT5700M Balong WebUI 启动脚本"
    echo ""
    echo "用法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --build    构建项目后启动"
    echo "  --help     显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  NODE_ENV   设置为 'production' 启用生产模式"
    echo ""
    echo "示例:"
    echo "  $0                    # 开发模式启动"
    echo "  $0 --build           # 构建后启动"
    echo "  NODE_ENV=production $0 --build  # 生产模式构建启动"
}

# 处理命令行参数
case "$1" in
    --help|-h)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
