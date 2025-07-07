import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { LoginRequest, SetupRequest } from '../../types';

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  // 获取认证状态
  router.get('/status', async (req: Request, res: Response) => {
    try {
      // 检查是否已登录
      const token = extractToken(req);
      if (token) {
        const { user, needsPasswordChange } = await authService.verifyAuth(token);
        if (user) {
          return res.json({
            success: true,
            authenticated: true,
            user,
            needsPasswordChange
          });
        }
      }

      // 获取认证状态
      const authStatus = await authService.checkAuthStatus();
      res.json(authStatus);

    } catch (error) {
      console.error('Auth status error:', error);
      res.status(500).json({
        success: false,
        message: '获取认证状态失败'
      });
    }
  });

  // 初始设置
  router.post('/setup', async (req: Request, res: Response) => {
    try {
      const setupData: SetupRequest = req.body;
      const result = await authService.setup(setupData);

      if (result.success && result.token) {
        // 设置 cookie
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json(result);

    } catch (error) {
      console.error('Setup error:', error);
      res.status(500).json({
        success: false,
        message: '设置失败，请重试'
      });
    }
  });

  // 登录
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const loginData: LoginRequest = req.body;
      const result = await authService.login(loginData);

      if (result.success && result.token) {
        // 设置 cookie
        res.cookie('token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json(result);

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: '登录失败，请重试'
      });
    }
  });

  // 登出
  router.post('/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({
      success: true,
      message: '已成功登出'
    });
  });

  // 修改密码
  router.post('/change-password', async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '当前密码和新密码不能为空'
        });
      }

      const result = await authService.changePassword(currentPassword, newPassword);
      res.json(result);

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: '密码修改失败，请重试'
      });
    }
  });

  return router;
}

function extractToken(req: Request): string | null {
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
