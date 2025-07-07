import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { User, LoginRequest, SetupRequest, AuthResponse } from '../../types';

interface UserData {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
  isDefaultPassword: boolean;
}

export class AuthService {
  private readonly userDataPath: string;
  private readonly jwtSecret: string;
  private userData: UserData | null = null;
  
  // 默认账户配置
  private readonly DEFAULT_USERNAME = 'admin';
  private readonly DEFAULT_PASSWORD = '123456';

  constructor() {
    this.userDataPath = path.join(process.cwd(), 'data', 'user.json');
    this.jwtSecret = process.env.JWT_SECRET || 'mt5700m-webui-secret-key-change-in-production';
    this.ensureDataDirectory();
    this.loadUserData();
  }

  private async ensureDataDirectory(): Promise<void> {
    const dataDir = path.dirname(this.userDataPath);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  private async loadUserData(): Promise<void> {
    try {
      const data = await fs.readFile(this.userDataPath, 'utf8');
      this.userData = JSON.parse(data);
      console.log(`✅ 用户数据加载成功: ${this.userData?.username}, 默认密码: ${this.userData?.isDefaultPassword}`);
    } catch (error) {
      console.log('📝 用户数据文件不存在，将使用默认账户');
      this.userData = null;
    }
  }

  private async saveUserData(): Promise<void> {
    if (!this.userData) return;
    
    try {
      await fs.writeFile(this.userDataPath, JSON.stringify(this.userData, null, 2));
      console.log(`✅ 用户数据保存成功: ${this.userData.username}, 默认密码: ${this.userData.isDefaultPassword}`);
    } catch (error) {
      console.error('❌ 用户数据保存失败:', error);
      throw error;
    }
  }

  private generateToken(user: User, isDefaultPassword: boolean): string {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        isDefaultPassword
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  private verifyJwtToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch {
      return null;
    }
  }

  public async checkAuthStatus(): Promise<AuthResponse> {
    console.log(`🔍 检查认证状态: userData=${!!this.userData}, isDefault=${this.userData?.isDefaultPassword}`);
    
    // 如果没有用户数据文件，说明还没有登录过
    if (!this.userData) {
      return {
        success: true,
        needsPasswordChange: false,
        authenticated: false,
        message: '请使用默认账户登录 (admin/123456)'
      };
    }

    return {
      success: true,
      needsPasswordChange: this.userData.isDefaultPassword,
      authenticated: false,
      message: this.userData.isDefaultPassword ? '需要修改默认密码' : '请登录'
    };
  }

  public async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { username, password } = loginData;
      console.log(`🔐 登录尝试: ${username}, 有用户数据: ${!!this.userData}`);

      // 验证用户名
      if (username !== this.DEFAULT_USERNAME) {
        console.log(`❌ 用户名错误: ${username}`);
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      let isValidPassword = false;
      let isDefaultPassword = false;

      // 如果没有用户数据，验证默认密码
      if (!this.userData) {
        console.log('🆕 首次登录，验证默认密码');
        isValidPassword = password === this.DEFAULT_PASSWORD;
        isDefaultPassword = true;
        
        if (isValidPassword) {
          // 首次使用默认密码登录，创建用户数据
          this.userData = {
            id: 'admin',
            username: this.DEFAULT_USERNAME,
            passwordHash: await bcrypt.hash(this.DEFAULT_PASSWORD, 12),
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            isDefaultPassword: true // 重要：标记为默认密码
          };
          await this.saveUserData();
          console.log('✅ 首次登录成功，创建用户数据');
        }
      } else {
        // 验证已保存的密码
        console.log(`🔑 验证已保存密码，默认密码状态: ${this.userData.isDefaultPassword}`);
        isValidPassword = await bcrypt.compare(password, this.userData.passwordHash);
        isDefaultPassword = this.userData.isDefaultPassword;
        
        if (isValidPassword) {
          // 更新最后登录时间
          this.userData.lastLogin = new Date().toISOString();
          await this.saveUserData();
          console.log('✅ 密码验证成功');
        }
      }

      if (!isValidPassword) {
        console.log('❌ 密码验证失败');
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 生成用户对象
      const user: User = {
        id: this.userData!.id,
        username: this.userData!.username,
        createdAt: this.userData!.createdAt,
        lastLogin: this.userData!.lastLogin
      };

      // 生成 token
      const token = this.generateToken(user, isDefaultPassword);

      console.log(`✅ 登录成功: ${user.username}, 需要修改密码: ${isDefaultPassword}`);

      return {
        success: true,
        user,
        token,
        needsPasswordChange: isDefaultPassword,
        message: isDefaultPassword ? '登录成功，请修改默认密码' : '登录成功'
      };

    } catch (error) {
      console.error('❌ 登录错误:', error);
      return {
        success: false,
        message: '登录失败，请重试'
      };
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      console.log('🔄 开始修改密码');
      
      if (!this.userData) {
        return {
          success: false,
          message: '用户数据不存在'
        };
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, this.userData.passwordHash);
      if (!isCurrentPasswordValid) {
        console.log('❌ 当前密码验证失败');
        return {
          success: false,
          message: '当前密码错误'
        };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          message: '新密码长度至少6位'
        };
      }

      // 不能设置为默认密码
      if (newPassword === this.DEFAULT_PASSWORD) {
        return {
          success: false,
          message: '新密码不能与默认密码相同'
        };
      }

      // 更新密码
      this.userData.passwordHash = await bcrypt.hash(newPassword, 12);
      this.userData.isDefaultPassword = false; // 重要：标记为非默认密码
      await this.saveUserData();

      console.log('✅ 密码修改成功');

      return {
        success: true,
        message: '密码修改成功'
      };

    } catch (error) {
      console.error('❌ 密码修改错误:', error);
      return {
        success: false,
        message: '密码修改失败，请重试'
      };
    }
  }

  public async verifyAuth(token: string): Promise<{ user: User | null; needsPasswordChange: boolean }> {
    const decoded = this.verifyJwtToken(token);
    if (!decoded || !this.userData) {
      return { user: null, needsPasswordChange: false };
    }

    const user: User = {
      id: decoded.id,
      username: decoded.username,
      createdAt: this.userData.createdAt,
      lastLogin: this.userData.lastLogin
    };

    // 从数据库获取最新的密码状态，而不是从 token
    const needsPasswordChange = this.userData.isDefaultPassword;

    console.log(`🔍 验证认证: ${user.username}, 需要修改密码: ${needsPasswordChange}`);

    return { 
      user, 
      needsPasswordChange
    };
  }

  // 保留 setup 方法以兼容现有代码
  public async setup(setupData: SetupRequest): Promise<AuthResponse> {
    return {
      success: false,
      message: '此版本不支持注册功能，请使用默认账户 admin/123456 登录'
    };
  }

  // 兼容方法
  public async needsSetup(): Promise<boolean> {
    return false; // 新版本不需要初始设置
  }

  public async hasUser(): Promise<boolean> {
    return this.userData !== null;
  }

  public async verifyToken(token: string): Promise<User | null> {
    const decoded = this.verifyJwtToken(token);
    if (!decoded || !this.userData) {
      return null;
    }

    return {
      id: decoded.id,
      username: decoded.username,
      createdAt: this.userData.createdAt,
      lastLogin: this.userData.lastLogin
    };
  }
}
