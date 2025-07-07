import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

// 扩展 Request 类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        createdAt: string;
        lastLogin?: string;
      };
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // 检查是否需要认证（跳过登录和设置页面）
  public requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 跳过认证的路径
      const skipAuthPaths = [
        '/api/auth/status',
        '/api/auth/login',
        '/api/auth/setup',
        '/api/health'
      ];

      if (skipAuthPaths.includes(req.path)) {
        return next();
      }

      // 检查是否需要初始设置
      if (await this.authService.needsSetup()) {
        return res.status(401).json({
          success: false,
          needsSetup: true,
          message: '需要完成初始设置'
        });
      }

      // 从 header 或 cookie 中获取 token
      const token = this.extractToken(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: '未提供认证令牌'
        });
      }

      // 验证 token
      const user = await this.authService.verifyToken(token);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '认证令牌无效'
        });
      }

      // 将用户信息添加到请求对象
      req.user = user;
      next();

    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        message: '认证服务错误'
      });
    }
  };

  private extractToken(req: Request): string | null {
    // 从 Authorization header 中提取 Bearer token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 从 cookie 中提取 token
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }

    return null;
  }
}
