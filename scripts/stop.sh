#!/bin/bash

# MT5700M Balong WebUI TypeScript版本停止脚本

set -e

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

echo "=========================================="
echo "MT5700M Balong WebUI 停止脚本"
echo "=========================================="

# 停止WebUI服务器
stop_webui() {
    if [ -f "/tmp/mt5700m_webui.pid" ]; then
        WEBUI_PID=$(cat /tmp/mt5700m_webui.pid)
        if ps -p $WEBUI_PID > /dev/null; then
            log_info "停止WebUI服务器 (PID: $WEBUI_PID)..."
            kill $WEBUI_PID
            sleep 2
            if ps -p $WEBUI_PID > /dev/null; then
                log_warning "强制停止WebUI服务器..."
                kill -9 $WEBUI_PID
            fi
            log_success "WebUI服务器已停止"
        else
            log_warning "WebUI服务器进程不存在"
        fi
        rm -f /tmp/mt5700m_webui.pid
    else
        log_info "未找到WebUI服务器PID文件"
    fi
}

# 清理socket文件
cleanup_sockets() {
    if [ -f "/tmp/at_socket.sock" ]; then
        log_info "清理socket文件..."
        rm -f /tmp/at_socket.sock
        log_success "Socket文件已清理"
    fi
}

# 查找并停止可能残留的进程
cleanup_processes() {
    log_info "检查残留进程..."
    
    # 查找Node.js进程
    NODE_PIDS=$(ps aux | grep -E "(dist/server|src/server)" | grep -v grep | awk '{print $2}')
    if [ ! -z "$NODE_PIDS" ]; then
        log_info "发现残留Node.js进程，正在清理..."
        for pid in $NODE_PIDS; do
            log_info "停止进程 $pid"
            kill $pid 2>/dev/null || true
        done
        sleep 2
        
        # 强制清理
        NODE_PIDS=$(ps aux | grep -E "(dist/server|src/server)" | grep -v grep | awk '{print $2}')
        if [ ! -z "$NODE_PIDS" ]; then
            for pid in $NODE_PIDS; do
                log_warning "强制停止进程 $pid"
                kill -9 $pid 2>/dev/null || true
            done
        fi
    fi
    
    # 查找可能的开发服务器进程
    DEV_PIDS=$(ps aux | grep -E "(vite|ts-node)" | grep -v grep | awk '{print $2}')
    if [ ! -z "$DEV_PIDS" ]; then
        log_info "发现开发服务器进程，正在清理..."
        for pid in $DEV_PIDS; do
            log_info "停止开发进程 $pid"
            kill $pid 2>/dev/null || true
        done
    fi
}

# 清理端口占用
cleanup_ports() {
    log_info "检查端口占用..."
    
    # 检查3000端口
    PORT_3000_PID=$(lsof -ti:3000 2>/dev/null || true)
    if [ ! -z "$PORT_3000_PID" ]; then
        log_info "清理3000端口占用 (PID: $PORT_3000_PID)"
        kill $PORT_3000_PID 2>/dev/null || true
    fi
    
    # 检查3001端口（Vite开发服务器）
    PORT_3001_PID=$(lsof -ti:3001 2>/dev/null || true)
    if [ ! -z "$PORT_3001_PID" ]; then
        log_info "清理3001端口占用 (PID: $PORT_3001_PID)"
        kill $PORT_3001_PID 2>/dev/null || true
    fi
}

# 显示状态
show_status() {
    log_info "检查服务状态..."
    
    # 检查PID文件
    if [ -f "/tmp/mt5700m_webui.pid" ]; then
        PID=$(cat /tmp/mt5700m_webui.pid)
        if ps -p $PID > /dev/null; then
            log_warning "WebUI服务器仍在运行 (PID: $PID)"
        else
            log_info "WebUI服务器已停止"
        fi
    else
        log_info "WebUI服务器已停止"
    fi
    
    # 检查端口
    if lsof -i:3000 &>/dev/null; then
        log_warning "端口3000仍被占用"
        lsof -i:3000
    else
        log_info "端口3000已释放"
    fi
    
    if lsof -i:3001 &>/dev/null; then
        log_warning "端口3001仍被占用"
        lsof -i:3001
    else
        log_info "端口3001已释放"
    fi
}

# 主函数
main() {
    case "$1" in
        --force|-f)
            log_info "强制停止模式"
            cleanup_processes
            cleanup_ports
            cleanup_sockets
            ;;
        --status|-s)
            show_status
            exit 0
            ;;
        --help|-h)
            echo "MT5700M Balong WebUI 停止脚本"
            echo ""
            echo "用法:"
            echo "  $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --force, -f    强制停止所有相关进程"
            echo "  --status, -s   显示服务状态"
            echo "  --help, -h     显示此帮助信息"
            echo ""
            exit 0
            ;;
        *)
            stop_webui
            cleanup_sockets
            cleanup_processes
            ;;
    esac
    
    log_success "清理完成"
}

# 执行主函数
main "$@"

echo "=========================================="
echo "MT5700M Balong WebUI 已完全停止"
echo "=========================================="
