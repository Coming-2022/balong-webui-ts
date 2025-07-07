# MT5700M WebUI

🚀 现代化的MT5700M蜂窝调制解调器设备Web管理界面

一个基于React + TypeScript + Node.js构建的全功能设备管理系统，提供实时监控、设备配置、小区管理等完整功能。

## ✨ 主要功能

### 📊 实时监控
- **信号强度监控** - 实时显示RSRP、RSRQ、SINR等关键指标
- **网络状态监控** - 4G/5G网络连接状态、载波聚合信息
- **设备状态监控** - 温度、电压、运行状态等设备健康信息
- **WebSocket实时更新** - 无需刷新页面的实时数据推送

### 🔧 设备管理
- **设备信息查看** - IMEI、IMSI、固件版本、硬件信息
- **网络配置管理** - APN设置、网络模式配置
- **小区锁定功能** - 手动锁定特定基站小区
- **AT命令控制台** - 直接发送AT命令进行高级配置

### 🏢 小区管理
- **小区扫描** - 自动扫描周边可用基站
- **小区信息显示** - PCI、频段、信号强度等详细信息
- **智能小区锁定** - 基于信号质量的智能锁定建议
- **自定义小区管理** - 保存和管理常用小区配置

### 🔐 安全认证
- **用户登录系统** - 安全的用户认证机制
- **密码管理** - 支持密码修改和安全策略
- **会话管理** - JWT令牌认证和自动登出

## 🏗️ 项目架构

### 技术栈
```
前端技术栈:
├── React 18          # 现代化UI框架
├── TypeScript        # 类型安全的JavaScript
├── TailwindCSS       # 实用优先的CSS框架
├── Zustand          # 轻量级状态管理
├── Socket.IO Client  # WebSocket客户端
└── Vite             # 快速构建工具

后端技术栈:
├── Node.js          # JavaScript运行时
├── Express.js       # Web应用框架
├── TypeScript       # 类型安全开发
├── Socket.IO        # WebSocket服务端
├── SerialPort       # 串口通信
├── JWT              # 身份认证
└── bcrypt           # 密码加密
```

### 系统架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │◄──►│   WebUI Server  │◄──►│   MT5700M       │
│                 │    │                 │    │   Device        │
│ React Frontend  │    │ Node.js Backend │    │                 │
│ - Dashboard     │    │ - API Routes    │    │ Serial Port     │
│ - Signal Monitor│    │ - WebSocket     │    │ AT Commands     │
│ - Device Info   │    │ - Auth Service  │    │ Status Reports  │
│ - Cell Mgmt     │    │ - AT Client     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 目录结构
```
balong-webui-ts/
├── 📁 src/
│   ├── 📁 client/              # 前端React应用
│   │   ├── 📁 components/      # 可复用组件
│   │   ├── 📁 pages/          # 页面组件
│   │   ├── 📁 stores/         # 状态管理
│   │   ├── 📁 hooks/          # 自定义Hooks
│   │   └── 📁 utils/          # 工具函数
│   ├── 📁 server/             # 后端Node.js服务
│   │   ├── 📁 routes/         # API路由
│   │   ├── 📁 services/       # 业务逻辑服务
│   │   ├── 📁 socket/         # WebSocket处理
│   │   └── 📁 middleware/     # 中间件
│   └── 📁 types/              # TypeScript类型定义
├── 📁 public/                 # 静态资源文件
├── 📁 data/                   # 数据存储目录
├── 📁 logs/                   # 日志文件目录
└── 📄 配置文件...
```

## 🔑 默认登录信息

```
用户名: admin
密码: 88888888
```

> ⚠️ **安全提醒**: 首次登录后请立即修改默认密码以确保系统安全！

## 🚀 快速启动

### 环境要求
- Node.js 18.0+
- npm 8.0+ 或 yarn 1.22+
- 串口访问权限（Linux需要dialout组权限）

### 方式一：脚本启动（推荐）
```bash
# 启动服务
./start.sh

# 停止服务
./stop.sh

# 重启服务
./restart.sh

# 查看状态
./status.sh

# 管理菜单
./manage.sh
```

### 方式二：npm命令启动
```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产模式构建和启动
npm run build
npm start
```

### 方式三：Docker容器启动
```bash
# 使用Docker Compose（推荐）
docker-compose up -d

# 查看容器状态
docker-compose ps

# 停止容器
docker-compose down

# 手动Docker构建
docker build -t mt5700m-webui .
docker run -d -p 3000:3000 --device=/dev/ttyUSB0 mt5700m-webui
```

## ⚙️ 配置说明

### 环境变量配置
创建 `.env` 文件：
```env
# 服务端口
PORT=3000

# 串口配置
SERIAL_PORT=/dev/ttyUSB0
SERIAL_BAUDRATE=115200

# JWT密钥
JWT_SECRET=your-secret-key-here

# 日志级别
LOG_LEVEL=info
```

### 串口配置
```bash
# Linux系统串口权限设置
sudo usermod -a -G dialout $USER

# 查看可用串口
ls -la /dev/ttyUSB*

# 测试串口连接
sudo minicom -D /dev/ttyUSB0 -b 115200
```

### 防火墙配置
```bash
# Ubuntu/Debian
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 📡 API接口文档

### 设备信息接口
```http
GET /api/device/info          # 获取设备基本信息
GET /api/device/signal        # 获取信号强度信息
GET /api/device/status        # 获取设备状态
```

### 网络管理接口
```http
GET /api/network/status       # 获取网络连接状态
POST /api/network/connect     # 连接网络
POST /api/network/disconnect  # 断开网络连接
```

### 小区管理接口
```http
GET /api/cells/scan          # 扫描周边小区
POST /api/cells/lock         # 锁定指定小区
DELETE /api/cells/unlock     # 解锁小区
GET /api/cells/custom        # 获取自定义小区列表
```

### AT命令接口
```http
POST /api/at/command         # 发送AT命令
GET /api/at/history          # 获取命令历史
```

### 认证接口
```http
POST /api/auth/login         # 用户登录
POST /api/auth/logout        # 用户登出
POST /api/auth/change-password # 修改密码
GET /api/auth/status         # 获取认证状态
```

## 🔌 WebSocket事件

### 客户端监听事件
```javascript
// 信号强度更新
socket.on('signal-update', (data) => {
  console.log('信号更新:', data);
});

// 设备状态变化
socket.on('device-status', (status) => {
  console.log('设备状态:', status);
});

// 网络事件
socket.on('network-event', (event) => {
  console.log('网络事件:', event);
});
```

## 🛠️ 开发指南

### 开发环境设置
```bash
# 克隆项目
git clone <repository-url>
cd balong-webui-ts

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 在浏览器中打开
open http://localhost:3000
```

### 可用脚本命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm start           # 启动生产服务器
npm run lint        # 代码检查
npm run type-check  # TypeScript类型检查
npm test            # 运行测试
```

### 代码规范
- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier代码规范
- 组件使用函数式组件和Hooks
- 状态管理使用Zustand
- 样式使用TailwindCSS

## 🐛 故障排除

### 常见问题

#### 1. 串口连接失败
```bash
# 检查设备连接
lsusb | grep -i huawei

# 检查串口权限
ls -la /dev/ttyUSB*

# 添加用户到dialout组
sudo usermod -a -G dialout $USER
# 需要重新登录生效
```

#### 2. 端口占用问题
```bash
# 查看端口占用
netstat -tulpn | grep :3000

# 杀死占用进程
sudo kill -9 <PID>
```

#### 3. 权限问题
```bash
# 给脚本执行权限
chmod +x *.sh

# 检查文件权限
ls -la start.sh
```

#### 4. 依赖安装失败
```bash
# 清除npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

## 📋 系统要求

### 最低配置
- CPU: 1核心
- 内存: 512MB
- 存储: 1GB可用空间
- 网络: 100Mbps

### 推荐配置
- CPU: 2核心+
- 内存: 1GB+
- 存储: 2GB+可用空间
- 网络: 1Gbps

### 支持的操作系统
- Ubuntu 18.04+
- CentOS 7+
- Debian 9+
- Windows 10+ (WSL2)
- macOS 10.15+

## 🔄 更新日志

### v1.0.0 (2025-07-06)
- ✨ 初始版本发布
- 🎯 完整的设备管理功能
- 📊 实时信号监控
- 🔐 安全认证系统
- 🐳 Docker容器化支持

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 技术支持

- 📧 邮件支持: support@example.com
- 🐛 问题反馈: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 文档中心: [Wiki](https://github.com/your-repo/wiki)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**
