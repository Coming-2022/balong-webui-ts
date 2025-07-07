// 🔧 认证修复工具函数

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  needsLogin?: boolean;
  needsSetup?: boolean;
}

// 🔧 增强的API请求函数，自动处理认证
export async function apiRequest<T = any>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // 确保包含认证信息
    const defaultOptions: RequestInit = {
      credentials: 'include', // 包含cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // 尝试从localStorage获取token
    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    console.log(`🌐 API请求: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    // 处理认证错误
    if (response.status === 401) {
      console.warn('❌ 认证失败:', data.message);
      
      if (data.needsLogin) {
        // 清除无效token
        localStorage.removeItem('auth_token');
        
        // 可以触发登录弹窗或跳转
        window.dispatchEvent(new CustomEvent('auth:login-required', {
          detail: { message: data.message, path: url }
        }));
      }
      
      if (data.needsSetup) {
        // 跳转到设置页面
        window.dispatchEvent(new CustomEvent('auth:setup-required', {
          detail: { message: data.message }
        }));
      }
    }

    return data;
  } catch (error) {
    console.error('❌ API请求失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败'
    };
  }
}

// 🔧 专用的设备API请求函数
export async function deviceApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(`/api/device/${endpoint}`, options);
}

// 🔧 专用的小区管理API请求函数
export async function cellApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(`/api/cell/${endpoint}`, options);
}

// 🔧 专用的网络API请求函数
export async function networkApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(`/api/network/${endpoint}`, options);
}

// 🔧 快速ping检查
export async function quickPingCheck(host = '223.5.5.5'): Promise<ApiResponse> {
  return networkApiRequest('ping', {
    method: 'POST',
    body: JSON.stringify({
      host,
      count: 2, // 优化：只ping 2次
      timeout: 3
    })
  });
}

// 🔧 获取5G状态
export async function get5GStatus(): Promise<ApiResponse> {
  return deviceApiRequest('5g-status');
}

// 🔧 获取小区锁定状态
export async function getCellLockStatus(): Promise<ApiResponse> {
  return cellApiRequest('lock-status');
}

// 🔧 锁定小区
export async function lockCell(band: string, arfcn: string, pci: string): Promise<ApiResponse> {
  return cellApiRequest('lock', {
    method: 'POST',
    body: JSON.stringify({ band, arfcn, pci })
  });
}

// 🔧 解锁小区
export async function unlockCell(): Promise<ApiResponse> {
  return cellApiRequest('unlock', {
    method: 'POST'
  });
}

// 🔧 检查认证状态
export async function checkAuthStatus(): Promise<ApiResponse> {
  return apiRequest('/api/auth/check');
}

// 🔧 登录
export async function login(username: string, password: string): Promise<ApiResponse> {
  const response = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  // 保存token
  if (response.success && response.data?.token) {
    localStorage.setItem('auth_token', response.data.token);
    console.log('✅ 登录成功，token已保存');
  }
  
  return response;
}

// 🔧 登出
export async function logout(): Promise<void> {
  localStorage.removeItem('auth_token');
  
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.warn('登出请求失败，但本地token已清除');
  }
  
  console.log('✅ 已登出');
}

// 🔧 自动重试机制
export async function apiRequestWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  maxRetries = 2
): Promise<ApiResponse<T>> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const result = await apiRequest<T>(url, options);
      
      // 如果成功或者是认证错误（不需要重试），直接返回
      if (result.success || result.error?.includes('认证') || result.error?.includes('授权')) {
        return result;
      }
      
      // 如果是最后一次尝试，返回结果
      if (i === maxRetries) {
        return result;
      }
      
      // 等待一下再重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      
    } catch (error) {
      lastError = error;
      
      if (i === maxRetries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '请求失败'
        };
      }
      
      // 等待一下再重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : '请求失败'
  };
}

// 🔧 批量API请求
export async function batchApiRequest<T = any>(
  requests: Array<{ url: string; options?: RequestInit }>
): Promise<Array<ApiResponse<T>>> {
  const promises = requests.map(({ url, options }) => 
    apiRequest<T>(url, options).catch(error => ({
      success: false,
      error: error.message
    }))
  );
  
  return Promise.all(promises);
}
