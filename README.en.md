# MT5700M WebUI

🚀 Modern Web Management Interface for MT5700M Cellular Modem Device

A full-featured device management system built with React + TypeScript + Node.js, providing real-time monitoring, device configuration, cell management, and complete functionality.

## ✨ Key Features

### 📊 Real-time Monitoring
- **Signal Strength Monitoring** - Real-time display of key indicators like RSRP, RSRQ, SINR
- **Network Status Monitoring** - 4G/5G network connection status, carrier aggregation information
- **Device Status Monitoring** - Temperature, voltage, operational status and other device health information
- **WebSocket Real-time Updates** - Real-time data push without page refresh

### 🔧 Device Management
- **Device Information View** - IMEI, IMSI, firmware version, hardware information
- **Network Configuration Management** - APN settings, network mode configuration
- **Cell Lock Function** - Manually lock to specific base station cells
- **AT Command Console** - Direct AT command sending for advanced configuration

### 🏢 Cell Management
- **Cell Scanning** - Automatically scan surrounding available base stations
- **Cell Information Display** - Detailed information including PCI, frequency band, signal strength
- **Smart Cell Locking** - Intelligent locking recommendations based on signal quality
- **Custom Cell Management** - Save and manage frequently used cell configurations

### 🔐 Security Authentication
- **User Login System** - Secure user authentication mechanism
- **Password Management** - Support for password changes and security policies
- **Session Management** - JWT token authentication and automatic logout

## 🏗️ Project Architecture

### Technology Stack
```
Frontend Stack:
├── React 18          # Modern UI framework
├── TypeScript        # Type-safe JavaScript
├── TailwindCSS       # Utility-first CSS framework
├── Zustand          # Lightweight state management
├── Socket.IO Client  # WebSocket client
└── Vite             # Fast build tool

Backend Stack:
├── Node.js          # JavaScript runtime
├── Express.js       # Web application framework
├── TypeScript       # Type-safe development
├── Socket.IO        # WebSocket server
├── SerialPort       # Serial communication
├── JWT              # Authentication
└── bcrypt           # Password encryption
```

### System Architecture Diagram
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

### Directory Structure
```
balong-webui-ts/
├── 📁 src/
│   ├── 📁 client/              # Frontend React application
│   │   ├── 📁 components/      # Reusable components
│   │   ├── 📁 pages/          # Page components
│   │   ├── 📁 stores/         # State management
│   │   ├── 📁 hooks/          # Custom Hooks
│   │   └── 📁 utils/          # Utility functions
│   ├── 📁 server/             # Backend Node.js service
│   │   ├── 📁 routes/         # API routes
│   │   ├── 📁 services/       # Business logic services
│   │   ├── 📁 socket/         # WebSocket handling
│   │   └── 📁 middleware/     # Middleware
│   └── 📁 types/              # TypeScript type definitions
├── 📁 public/                 # Static resource files
├── 📁 data/                   # Data storage directory
├── 📁 logs/                   # Log files directory
└── 📄 Configuration files...
```

## 🔑 Default Login Information

```
Username: admin
Password: 88888888
```

> ⚠️ **Security Warning**: Please change the default password immediately after first login to ensure system security!

## 🚀 Quick Start

### Environment Requirements
- Node.js 18.0+
- npm 8.0+ or yarn 1.22+
- Serial port access permissions (Linux requires dialout group permissions)

### Method 1: Script Startup (Recommended)
```bash
# Start service
./start.sh

# Stop service
./stop.sh

# Restart service
./restart.sh

# Check status
./status.sh

# Management menu
./manage.sh
```

### Method 2: npm Command Startup
```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build and start in production mode
npm run build
npm start
```

### Method 3: Docker Container Startup
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Check container status
docker-compose ps

# Stop containers
docker-compose down

# Manual Docker build
docker build -t mt5700m-webui .
docker run -d -p 3000:3000 --device=/dev/ttyUSB0 mt5700m-webui
```

## ⚙️ Configuration

### Environment Variables Configuration
Create `.env` file:
```env
# Server port
PORT=3000

# Serial port configuration
SERIAL_PORT=/dev/ttyUSB0
SERIAL_BAUDRATE=115200

# JWT secret key
JWT_SECRET=your-secret-key-here

# Log level
LOG_LEVEL=info
```

### Serial Port Configuration
```bash
# Linux system serial port permission setup
sudo usermod -a -G dialout $USER

# View available serial ports
ls -la /dev/ttyUSB*

# Test serial port connection
sudo minicom -D /dev/ttyUSB0 -b 115200
```

### Firewall Configuration
```bash
# Ubuntu/Debian
sudo ufw allow 3000

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 📡 API Documentation

### Device Information APIs
```http
GET /api/device/info          # Get basic device information
GET /api/device/signal        # Get signal strength information
GET /api/device/status        # Get device status
```

### Network Management APIs
```http
GET /api/network/status       # Get network connection status
POST /api/network/connect     # Connect to network
POST /api/network/disconnect  # Disconnect from network
```

### Cell Management APIs
```http
GET /api/cells/scan          # Scan surrounding cells
POST /api/cells/lock         # Lock to specified cell
DELETE /api/cells/unlock     # Unlock cell
GET /api/cells/custom        # Get custom cell list
```

### AT Command APIs
```http
POST /api/at/command         # Send AT command
GET /api/at/history          # Get command history
```

### Authentication APIs
```http
POST /api/auth/login         # User login
POST /api/auth/logout        # User logout
POST /api/auth/change-password # Change password
GET /api/auth/status         # Get authentication status
```

## 🔌 WebSocket Events

### Client Listening Events
```javascript
// Signal strength updates
socket.on('signal-update', (data) => {
  console.log('Signal update:', data);
});

// Device status changes
socket.on('device-status', (status) => {
  console.log('Device status:', status);
});

// Network events
socket.on('network-event', (event) => {
  console.log('Network event:', event);
});
```

## 🛠️ Development Guide

### Development Environment Setup
```bash
# Clone project
git clone <repository-url>
cd balong-webui-ts

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

### Available Script Commands
```bash
npm run dev          # Start development server
npm run build        # Build production version
npm start           # Start production server
npm run lint        # Code linting
npm run type-check  # TypeScript type checking
npm test            # Run tests
```

### Code Standards
- Use TypeScript for type-safe development
- Follow ESLint and Prettier code standards
- Use functional components and Hooks for components
- Use Zustand for state management
- Use TailwindCSS for styling

## 🐛 Troubleshooting

### Common Issues

#### 1. Serial Port Connection Failure
```bash
# Check device connection
lsusb | grep -i huawei

# Check serial port permissions
ls -la /dev/ttyUSB*

# Add user to dialout group
sudo usermod -a -G dialout $USER
# Need to re-login for changes to take effect
```

#### 2. Port Occupation Issues
```bash
# Check port occupation
netstat -tulpn | grep :3000

# Kill occupying process
sudo kill -9 <PID>
```

#### 3. Permission Issues
```bash
# Give script execution permissions
chmod +x *.sh

# Check file permissions
ls -la start.sh
```

#### 4. Dependency Installation Failure
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📋 System Requirements

### Minimum Configuration
- CPU: 1 core
- Memory: 512MB
- Storage: 1GB available space
- Network: 100Mbps

### Recommended Configuration
- CPU: 2+ cores
- Memory: 1GB+
- Storage: 2GB+ available space
- Network: 1Gbps

### Supported Operating Systems
- Ubuntu 18.04+
- CentOS 7+
- Debian 9+
- Windows 10+ (WSL2)
- macOS 10.15+

## 🔄 Changelog

### v1.0.0 (2025-07-06)
- ✨ Initial version release
- 🎯 Complete device management functionality
- 📊 Real-time signal monitoring
- 🔐 Security authentication system
- 🐳 Docker containerization support

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Contributing

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

## 🙏 Acknowledgments

Thanks to all developers and users who have contributed to this project!

---

**⭐ If this project helps you, please give us a Star!**
