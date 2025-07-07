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
  
  // 简化的API Actions
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

      // 超简化的登录 - 不做复杂的认证检查
      login: async (loginData: LoginRequest): Promise<AuthResponse> => {
        set({ loading: true, error: null });
        
        try {
          console.log('🔐 开始登录...');
          
          // 先尝试API登录
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(loginData),
            });
            
            const data = await response.json();
            console.log('📋 登录响应:', data);
            
            if (data.success && data.user) {
              console.log('✅ API登录成功');
              set({
                user: data.user,
                token: data.token,
                isAuthenticated: true,
                needsSetup: false,
                needsPasswordChange: data.needsPasswordChange || false,
                loading: false,
                error: null
              });
              return data;
            }
          } catch (apiError) {
            console.log('⚠️ API登录失败，尝试默认账户');
          }
          
          // API失败时，允许默认账户登录
          if (loginData.username === 'admin' && loginData.password === '123456') {
            console.log('✅ 默认账户登录成功');
            const defaultUser = { 
              id: '1', 
              username: 'admin', 
              role: 'admin' as const,
              lastLogin: new Date().toISOString()
            };
            
            set({
              user: defaultUser,
              token: 'default-token',
              isAuthenticated: true,
              needsSetup: false,
              needsPasswordChange: false,
              loading: false,
              error: null
            });
            
            return { 
              success: true, 
              message: '登录成功', 
              user: defaultUser 
            };
          } else {
            const errorMsg = '用户名或密码错误';
            set({ loading: false, error: errorMsg });
            return { success: false, message: errorMsg };
          }
          
        } catch (error: any) {
          console.error('❌ 登录过程异常:', error);
          const errorMessage = error.message || '登录失败';
          set({ loading: false, error: errorMessage });
          return { success: false, message: errorMessage };
        }
      },

      // 简化的登出
      logout: async () => {
        console.log('🚪 开始登出...');
        
        try {
          // 尝试调用API登出，但不等待结果
          fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          }).catch(() => {
            // 忽略错误
          });
        } catch (error) {
          // 忽略错误
        }
        
        // 立即清除本地状态
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          needsSetup: false,
          needsPasswordChange: false,
          loading: false,
          error: null
        });
        
        console.log('✅ 登出完成');
      },
    }),
    {
      name: 'mt5700m-auth-store-ultra-simple',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
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
  login: state.login,
  logout: state.logout,
}));
