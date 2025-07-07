import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  lastLogin?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SetupRequest extends LoginRequest {
  confirmPassword?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  needsPasswordChange?: boolean;
}

interface AuthState {
  // 状态
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  needsSetup: boolean;
  needsPasswordChange: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setNeedsSetup: (needsSetup: boolean) => void;
  setNeedsPasswordChange: (needsPasswordChange: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // API Actions
  checkAuthStatus: () => Promise<void>;
  login: (loginData: LoginRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      needsSetup: false,
      needsPasswordChange: false,
      loading: false,
      error: null,

      // 简单的setters
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setNeedsSetup: (needsSetup) => set({ needsSetup }),
      setNeedsPasswordChange: (needsPasswordChange) => set({ needsPasswordChange }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // 简化的认证检查
      checkAuthStatus: async () => {
        const state = get();
        
        // 避免重复检查
        if (state.loading) {
          console.log('🔄 认证检查已在进行中，跳过');
          return;
        }
        
        set({ loading: true, error: null });
        
        try {
          console.log('🔍 开始检查认证状态...');
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch('/api/auth/status', {
            credentials: 'include',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const data = await response.json();
          console.log('📋 认证状态响应:', data);
          
          if (data.success) {
            if (data.authenticated && data.user) {
              console.log('✅ 用户已认证');
              set({
                user: data.user,
                isAuthenticated: true,
                needsSetup: false,
                needsPasswordChange: data.needsPasswordChange || false,
                loading: false,
                error: null
              });
            } else if (data.needsSetup) {
              console.log('🔧 需要初始设置');
              set({
                user: null,
                isAuthenticated: false,
                needsSetup: true,
                needsPasswordChange: false,
                loading: false,
                error: null
              });
            } else {
              console.log('🔓 用户未认证');
              set({
                user: null,
                isAuthenticated: false,
                needsSetup: false,
                needsPasswordChange: false,
                loading: false,
                error: null
              });
            }
          } else {
            throw new Error(data.message || '认证状态检查失败');
          }
        } catch (error: any) {
          console.error('❌ 认证状态检查失败:', error);
          
          const errorMessage = error.name === 'AbortError' ? '请求超时' : error.message;
          set({ 
            loading: false, 
            error: errorMessage,
            // 发生错误时，假设用户未认证
            user: null,
            isAuthenticated: false,
            needsSetup: false,
            needsPasswordChange: false
          });
        }
      },

      // 简化的登录
      login: async (loginData: LoginRequest): Promise<AuthResponse> => {
        set({ loading: true, error: null });
        
        try {
          console.log('🔐 开始登录...');
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(loginData),
          });
          
          const data = await response.json();
          console.log('📋 登录响应:', data);
          
          if (data.success && data.user) {
            console.log('✅ 登录成功');
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              needsSetup: false,
              needsPasswordChange: data.needsPasswordChange || false,
              loading: false,
              error: null
            });
          } else {
            console.log('❌ 登录失败:', data.message);
            set({
              loading: false,
              error: data.message || '登录失败'
            });
          }
          
          return data;
        } catch (error: any) {
          console.error('❌ 登录请求失败:', error);
          const errorMessage = error.message || '登录请求失败';
          set({ loading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      // 简化的登出
      logout: async () => {
        set({ loading: true });
        
        try {
          console.log('🚪 开始登出...');
          
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
          
          console.log('✅ 登出成功');
        } catch (error) {
          console.error('❌ 登出请求失败:', error);
        } finally {
          // 无论请求是否成功，都清除本地状态
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            needsSetup: false,
            needsPasswordChange: false,
            loading: false,
            error: null
          });
        }
      },
    }),
    {
      name: 'mt5700m-auth-store-simple',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        needsSetup: state.needsSetup,
        needsPasswordChange: state.needsPasswordChange,
      }),
    }
  )
);

// 简化的hooks
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
  needsSetup: state.needsSetup,
  needsPasswordChange: state.needsPasswordChange,
  loading: state.loading,
  error: state.error,
}));

export const useAuthActions = () => useAuthStore((state) => ({
  setError: state.setError,
  checkAuthStatus: state.checkAuthStatus,
  login: state.login,
  logout: state.logout,
}));
