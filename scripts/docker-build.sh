#!/bin/bash

# MT5700M WebUI 智能Docker构建脚本
# 只有在代码变化时才重新构建镜像

set -e

# 配置
IMAGE_NAME="mt5700m-webui"
DOCKERFILE_PATH="."
BUILD_CONTEXT="."

# 颜色输出
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

# 计算文件哈希值（排除不影响构建的文件）
calculate_build_hash() {
    # 包含影响构建的文件
    find . -type f \( \
        -name "*.ts" -o \
        -name "*.tsx" -o \
        -name "*.js" -o \
        -name "*.jsx" -o \
        -name "*.json" -o \
        -name "*.css" -o \
        -name "*.html" -o \
        -name "Dockerfile*" -o \
        -name "*.config.*" \
    \) \
    -not -path "./node_modules/*" \
    -not -path "./dist/*" \
    -not -path "./logs/*" \
    -not -path "./data/*" \
    -not -path "./.git/*" \
    -not -path "./scripts/*" \
    | sort | xargs cat 2>/dev/null | sha256sum | cut -d' ' -f1
}

# 获取当前镜像的构建哈希
get_image_build_hash() {
    local image_id=$(docker images -q ${IMAGE_NAME}:latest 2>/dev/null)
    if [ -n "$image_id" ]; then
        docker inspect ${IMAGE_NAME}:latest --format='{{index .Config.Labels "build.hash"}}' 2>/dev/null || echo ""
    else
        echo ""
    fi
}

# 检查是否需要重新构建
need_rebuild() {
    log_info "计算构建哈希值..."
    local current_hash=$(calculate_build_hash)
    local image_hash=$(get_image_build_hash)
    
    log_info "当前代码哈希: $current_hash"
    log_info "镜像构建哈希: $image_hash"
    
    if [ "$current_hash" != "$image_hash" ] || [ -z "$image_hash" ]; then
        log_warning "代码已变化或镜像不存在，需要重新构建镜像"
        return 0  # 需要重建
    else
        log_success "代码未变化，跳过构建"
        return 1  # 不需要重建
    fi
}

# 构建Docker镜像
build_image() {
    local build_hash=$(calculate_build_hash)
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local dockerfile="Dockerfile"
    
    # 检查是否使用简化版Dockerfile
    if [ "$USE_SIMPLE" = "true" ]; then
        dockerfile="Dockerfile.simple"
        log_info "使用简化版Dockerfile"
    fi
    
    log_info "开始构建Docker镜像..."
    log_info "使用Dockerfile: $dockerfile"
    log_info "构建哈希: $build_hash"
    log_info "构建时间: $timestamp"
    
    # 构建镜像，添加标签和元数据
    docker build \
        -f "$dockerfile" \
        --build-arg BUILD_HASH="$build_hash" \
        --build-arg BUILD_TIME="$timestamp" \
        --label "build.hash=$build_hash" \
        --label "build.time=$timestamp" \
        --label "build.version=$(cat package.json | grep '"version"' | cut -d'"' -f4)" \
        -t ${IMAGE_NAME}:latest \
        -t ${IMAGE_NAME}:${timestamp} \
        -t ${IMAGE_NAME}:${build_hash:0:8} \
        ${BUILD_CONTEXT}
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建成功！"
        log_info "镜像标签:"
        log_info "  - ${IMAGE_NAME}:latest"
        log_info "  - ${IMAGE_NAME}:${timestamp}"
        log_info "  - ${IMAGE_NAME}:${build_hash:0:8}"
    else
        log_error "镜像构建失败！"
        exit 1
    fi
}

# 清理旧镜像
cleanup_old_images() {
    log_info "清理旧的未使用镜像..."
    
    # 保留最新的3个版本
    local old_images=$(docker images ${IMAGE_NAME} --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | grep -v "latest" | tail -n +4 | awk '{print $1}')
    
    if [ -n "$old_images" ]; then
        echo "$old_images" | while read image; do
            if [ -n "$image" ] && [ "$image" != "${IMAGE_NAME}:latest" ]; then
                log_info "删除旧镜像: $image"
                docker rmi "$image" 2>/dev/null || true
            fi
        done
    else
        log_info "没有需要清理的旧镜像"
    fi
}

# 显示镜像信息
show_image_info() {
    log_info "当前镜像信息:"
    docker images ${IMAGE_NAME} --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  -f, --force    强制重新构建镜像"
    echo "  -c, --cleanup  构建后清理旧镜像"
    echo "  -s, --simple   使用简化版Dockerfile"
    echo "  -h, --help     显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0              # 智能构建"
    echo "  $0 -f           # 强制重新构建"
    echo "  $0 -s           # 使用简化版构建"
    echo "  $0 -f -c        # 强制构建并清理"
}

# 主函数
main() {
    log_info "MT5700M WebUI Docker 智能构建工具"
    log_info "=================================="
    
    # 检查Docker是否运行
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker未运行或无法访问"
        exit 1
    fi
    
    # 解析命令行参数
    FORCE_BUILD=false
    CLEANUP=false
    USE_SIMPLE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -f|--force)
                FORCE_BUILD=true
                shift
                ;;
            -c|--cleanup)
                CLEANUP=true
                shift
                ;;
            -s|--simple)
                USE_SIMPLE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查是否需要构建
    if [ "$FORCE_BUILD" = true ]; then
        log_warning "强制重新构建模式"
        build_image
    elif need_rebuild; then
        build_image
    else
        log_success "镜像已是最新版本，无需重新构建"
    fi
    
    # 清理旧镜像
    if [ "$CLEANUP" = true ]; then
        cleanup_old_images
    fi
    
    # 显示镜像信息
    show_image_info
    
    log_success "构建流程完成！"
}

# 运行主函数
main "$@"
