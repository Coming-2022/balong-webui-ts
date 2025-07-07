#!/bin/bash

# MT5700M WebUI 依赖升级脚本
# 分阶段安全升级依赖包

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

# 检查npm是否可用
check_npm() {
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm未安装或不在PATH中"
        exit 1
    fi
}

# 备份package.json
backup_package_json() {
    log_info "备份package.json..."
    cp package.json package.json.backup.$(date +%Y%m%d_%H%M%S)
    log_success "package.json已备份"
}

# 显示当前过时的包
show_outdated() {
    log_info "检查过时的包..."
    npm outdated || true
}

# 安全升级（修复漏洞，无破坏性变更）
safe_upgrade() {
    log_info "执行安全升级..."
    
    # 修复安全漏洞
    log_info "修复安全漏洞..."
    npm audit fix --force || log_warning "部分安全问题可能需要手动处理"
    
    # 升级安全相关包（无破坏性变更）
    log_info "升级安全相关包..."
    npm install helmet@^8.1.0
    npm install bcryptjs@^3.0.2
    npm install zustand@^5.0.6
    
    # 升级开发工具（低风险）
    log_info "升级开发工具..."
    npm install -D concurrently@^9.2.0
    npm install -D eslint-plugin-react-hooks@^5.2.0
    
    log_success "安全升级完成"
}

# 工具链升级（可能需要配置调整）
toolchain_upgrade() {
    log_warning "执行工具链升级（可能需要配置调整）..."
    
    # 升级TypeScript工具链
    log_info "升级TypeScript工具链..."
    npm install -D @typescript-eslint/eslint-plugin@^8.35.1
    npm install -D @typescript-eslint/parser@^8.35.1
    
    # 升级构建工具
    log_info "升级构建工具..."
    npm install -D vite@^7.0.1
    npm install -D eslint@^9.30.1
    
    log_warning "工具链升级完成，可能需要更新配置文件"
    log_info "请检查："
    log_info "- eslint配置可能需要更新到flat config格式"
    log_info "- vite配置可能需要调整"
}

# 框架升级（高风险，需要仔细测试）
framework_upgrade() {
    log_error "框架升级包含破坏性变更，需要谨慎处理！"
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "取消框架升级"
        return
    fi
    
    log_warning "执行框架升级（高风险）..."
    
    # React 19升级
    log_info "升级React到19.x..."
    npm install react@^19.1.0 react-dom@^19.1.0
    npm install -D @types/react@^19.1.8 @types/react-dom@^19.1.6
    
    # Express 5升级
    log_info "升级Express到5.x..."
    npm install express@^5.1.0
    npm install -D @types/express@^5.0.3
    
    # React Router升级
    log_info "升级React Router..."
    npm install react-router-dom@^7.6.3
    
    log_error "框架升级完成，需要进行全面测试！"
    log_warning "可能需要的代码修改："
    log_info "- React 19的新特性和API变更"
    log_info "- Express 5的中间件和路由变更"
    log_info "- React Router 7的路由配置变更"
}

# 测试构建
test_build() {
    log_info "测试构建..."
    if npm run build; then
        log_success "构建测试通过"
    else
        log_error "构建失败，请检查错误信息"
        return 1
    fi
}

# 测试开发服务器
test_dev() {
    log_info "测试开发服务器启动..."
    timeout 30s npm run dev > /dev/null 2>&1 &
    local pid=$!
    sleep 10
    
    if kill -0 $pid 2>/dev/null; then
        kill $pid
        log_success "开发服务器启动测试通过"
    else
        log_error "开发服务器启动失败"
        return 1
    fi
}

# 显示升级后状态
show_status() {
    log_info "升级后状态："
    npm outdated || log_success "所有包都是最新版本"
    
    log_info "安全审计："
    npm audit || log_warning "仍有安全问题需要处理"
}

# 回滚功能
rollback() {
    log_warning "回滚到升级前状态..."
    local backup_file=$(ls -t package.json.backup.* 2>/dev/null | head -1)
    if [ -n "$backup_file" ]; then
        cp "$backup_file" package.json
        npm install
        log_success "已回滚到升级前状态"
    else
        log_error "未找到备份文件，无法回滚"
    fi
}

# 显示帮助
show_help() {
    echo "MT5700M WebUI 依赖升级工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  safe        安全升级（修复漏洞，无破坏性变更）"
    echo "  toolchain   工具链升级（可能需要配置调整）"
    echo "  framework   框架升级（高风险，破坏性变更）"
    echo "  all         执行所有升级（非常危险）"
    echo "  test        测试当前构建"
    echo "  status      显示当前状态"
    echo "  rollback    回滚到升级前状态"
    echo "  help        显示帮助信息"
    echo ""
    echo "推荐升级顺序："
    echo "1. $0 safe      # 安全升级"
    echo "2. $0 test      # 测试"
    echo "3. $0 toolchain # 工具链升级"
    echo "4. $0 test      # 测试"
    echo "5. $0 framework # 框架升级（可选）"
}

# 主函数
main() {
    log_info "MT5700M WebUI 依赖升级工具"
    log_info "================================"
    
    check_npm
    
    case "${1:-help}" in
        safe)
            backup_package_json
            safe_upgrade
            test_build
            show_status
            ;;
        toolchain)
            backup_package_json
            toolchain_upgrade
            test_build
            show_status
            ;;
        framework)
            backup_package_json
            framework_upgrade
            test_build
            show_status
            ;;
        all)
            log_error "执行完整升级（包含所有破坏性变更）"
            read -p "这是一个危险操作，确定继续吗？(y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                backup_package_json
                safe_upgrade
                toolchain_upgrade
                framework_upgrade
                test_build
                show_status
            else
                log_info "取消完整升级"
            fi
            ;;
        test)
            test_build
            test_dev
            ;;
        status)
            show_outdated
            show_status
            ;;
        rollback)
            rollback
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
