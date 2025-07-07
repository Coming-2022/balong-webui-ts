# MT5700M Balong WebUI - 生产环境
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置 npm 使用淘宝镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装基本依赖
RUN apk add --no-cache curl

# 复制package文件（优先复制，利用Docker层缓存）
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci && npm cache clean --force

# 复制构建所需的所有文件
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

# 复制环境文件（如果存在）
COPY .env* ./

# 构建应用（前端和后端）
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 设置 npm 使用淘宝镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装基本依赖和运行时依赖
RUN apk add --no-cache curl iputils

# 复制package文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --omit=dev && npm cache clean --force

# 从构建阶段复制构建结果
COPY --from=builder /app/dist ./dist

# 复制源代码中的类型定义（运行时需要）
COPY --from=builder /app/src/types ./src/types

# 复制环境文件
COPY --from=builder /app/.env* ./

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 创建必要的目录并设置权限
RUN mkdir -p /app/data /app/logs && \
    chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["node", "dist/server/index.js"]
