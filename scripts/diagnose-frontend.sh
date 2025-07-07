#!/bin/bash

# 前端诊断脚本

set -e

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

log_info "MT5700M WebUI 前端诊断工具"
log_info "================================"

# 1. 检查服务器状态
log_info "1. 检查服务器状态..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    log_success "API服务器正常"
else
    log_error "API服务器无响应"
    exit 1
fi

# 2. 检查前端页面
log_info "2. 检查前端页面..."
if curl -s http://localhost:3000/ | grep -q "<!DOCTYPE html>"; then
    log_success "前端页面正常返回"
else
    log_error "前端页面异常"
    exit 1
fi

# 3. 检查静态资源
log_info "3. 检查静态资源..."
ASSETS=$(curl -s http://localhost:3000/ | grep -o '/assets/[^"]*' | head -5)
for asset in $ASSETS; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$asset | grep -q "200"; then
        log_success "资源正常: $asset"
    else
        log_error "资源异常: $asset"
    fi
done

# 4. 检查Socket.IO
log_info "4. 检查Socket.IO连接..."
if curl -s "http://localhost:3000/socket.io/?EIO=4&transport=polling" | grep -q "sid"; then
    log_success "Socket.IO服务正常"
else
    log_error "Socket.IO服务异常"
fi

# 5. 检查API端点
log_info "5. 检查关键API端点..."
ENDPOINTS=(
    "/api/health"
    "/api/auth/status"
    "/api/device/info"
    "/api/signal"
)

for endpoint in "${ENDPOINTS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$endpoint)
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "401" ]]; then
        log_success "API端点正常: $endpoint (HTTP $HTTP_CODE)"
    else
        log_warning "API端点异常: $endpoint (HTTP $HTTP_CODE)"
    fi
done

# 6. 检查容器日志中的错误
log_info "6. 检查最近的错误日志..."
if command -v docker-compose >/dev/null 2>&1; then
    ERROR_COUNT=$(docker-compose logs --tail=50 2>/dev/null | grep -i "error" | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        log_warning "发现 $ERROR_COUNT 个错误日志条目"
        log_info "最近的错误："
        docker-compose logs --tail=10 2>/dev/null | grep -i "error" | tail -3
    else
        log_success "没有发现错误日志"
    fi
fi

# 7. 生成诊断报告
log_info "7. 生成诊断报告..."
cat > /tmp/frontend-diagnosis.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "server_status": "$(curl -s http://localhost:3000/api/health | jq -r '.message' 2>/dev/null || echo 'unknown')",
  "frontend_accessible": $(curl -s http://localhost:3000/ | grep -q "<!DOCTYPE html>" && echo "true" || echo "false"),
  "socketio_available": $(curl -s "http://localhost:3000/socket.io/?EIO=4&transport=polling" | grep -q "sid" && echo "true" || echo "false"),
  "container_running": $(docker-compose ps -q | wc -l)
}
EOF

log_success "诊断完成！报告保存到: /tmp/frontend-diagnosis.json"

# 8. 提供解决建议
log_info "8. 问题解决建议..."
log_info "如果页面一直转圈，可能的原因："
log_info "- 前端JavaScript执行错误"
log_info "- Socket.IO连接超时"
log_info "- API请求阻塞"
log_info "- 设备连接问题导致前端等待"

log_info ""
log_info "建议的解决步骤："
log_info "1. 检查浏览器开发者工具的Console和Network标签"
log_info "2. 尝试禁用设备连接: 修改环境变量 ENABLE_DEVICE_CONNECTION=false"
log_info "3. 重启服务: docker-compose restart"
log_info "4. 查看详细日志: docker-compose logs -f"

echo ""
log_success "诊断脚本执行完成！"
