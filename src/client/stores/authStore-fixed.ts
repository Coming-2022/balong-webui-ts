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

  // Setters
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setNeedsSetup: (needsSetup: boolean) => void;
  setNeedsPasswordChange: (needsPasswordChange: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  checkAuthStatus: () => Promise<void>;
  login: (loginData: LoginRequest) => Promise<AuthResponse>;
  setup: (setupData: SetupRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<AuthResponse>;
}

// 兼容Zustand v4和v5的写法
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

      // Setters
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setNeedsSetup: (needsSetup) => set({ needsSetup }),
      setNeedsPasswordChange: (needsPasswordChange) => set({ needsPasswordChange }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      // API Actions
      checkAuthStatus: async () => {
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
          
          if (data.success) {
            if (data.authenticated && data.user) {
              set({
                user: data.user,
                isAuthenticated: true,
                needsSetup: false,
                needsPasswordChange: data.needsPasswordChange || false,
                loading: false,
                error: null
              });
            } else if (data.needsSetup) {
              set({
                user: null,
                isAuthenticated: false,
                needsSetup: true,
                needsPasswordChange: false,
                loading: false,
                error: null
              });
            } else {
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
          set({ 
            loading: false, 
            error: error.name === 'AbortError' ? '请求超时' : error.message 
          });
        }
      },

      login: async (loginData: LoginRequest): Promise<AuthResponse> => {
        set({ loading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(loginData),
          });
          
          const data = await response.json();
          
          if (data.success && data.user) {
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
            set({
              loading: false,
              error: data.message || '登录失败'
            });
          }
          
          return data;
        } catch (error: any) {
          const errorMessage = error.message || '登录请求失败';
          set({ loading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      setup: async (setupData: SetupRequest): Promise<AuthResponse> => {
        set({ loading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(setupData),
          });
          
          const data = await response.json();
          
          if (data.success && data.user) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              needsSetup: false,
              needsPasswordChange: false,
              loading: false,
              error: null
            });
          } else {
            set({
              loading: false,
              error: data.message || '初始设置失败'
            });
          }
          
          return data;
        } catch (error: any) {
          const errorMessage = error.message || '设置请求失败';
          set({ loading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      logout: async () => {
        set({ loading: true });
        
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });
        } catch (error) {
          console.error('登出请求失败:', error);
        } finally {
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

      changePassword: async (oldPassword: string, newPassword: string): Promise<AuthResponse> => {
        set({ loading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ oldPassword, newPassword }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            set({
              needsPasswordChange: false,
              loading: false,
              error: null
            });
          } else {
            set({
              loading: false,
              error: data.message || '密码修改失败'
            });
          }
          
          return data;
        } catch (error: any) {
          const errorMessage = error.message || '密码修改请求失败';
          set({ loading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },
    }),
    {
      name: 'mt5700m-auth-store',
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

// 便捷的 hooks
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
  setup: state.setup,
  logout: state.logout,
  changePassword: state.changePassword,
}));
