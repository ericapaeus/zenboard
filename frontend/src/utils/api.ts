// API 响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// 请求配置类型
export interface RequestConfig extends RequestInit {
  skipAuth?: boolean; // 是否跳过认证
  returnRawResponse?: boolean; // 是否返回原始响应
}

// 环境变量配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 认证错误处理函数
export const authErrorHandler = {
  onRefresh: (newAccessToken: string, newRefreshToken: string) => {
    console.log('Token refreshed:', { newAccessToken, newRefreshToken });
  },
  onLogout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('isLogin');
    window.location.href = '/login';
  },
};

// Token 刷新状态管理
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (reason?: Error) => void;
}> = [];

// 处理队列中的请求
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * 基础请求函数
 */
const fetchBase = async (
  endpoint: string,
  options?: RequestInit,
): Promise<Response> => {
  const requestHeaders = new Headers(options?.headers);

  // 设置默认 Content-Type
  if (!options?.headers || !(options.headers as Record<string, string>)['Content-Type']) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: requestHeaders,
  });

  return response;
};

/**
 * 将 Response 转换为 ApiResponse
 */
const responseToApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  try {
    const jsonResponse: ApiResponse<T> = await response.json();
    return jsonResponse;
  } catch (e) {
    console.error('Error parsing API response:', e);
    throw new Error('API 响应解析失败');
  }
};

/**
 * 公共接口请求（无需认证）
 */
export const fetchPublic = async <T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> => {
  const response = await fetchBase(endpoint, options);
  return responseToApiResponse<T>(response);
};

/**
 * 认证接口请求（需要 token）
 */
export const fetchAuthenticated = async <T>(
  endpoint: string,
  options?: RequestConfig,
  retry: boolean = false // 内部重试标记
): Promise<ApiResponse<T> | Response> => {
  let token = localStorage.getItem('access_token');
  const requestHeaders = new Headers(options?.headers);

  // 添加认证头
  if (token && !options?.skipAuth) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response: Response = await fetchBase(endpoint, {
    ...options,
    headers: requestHeaders,
  });

  // 处理 401 错误和 token 刷新
  if (response.status === 401 && !retry && !options?.skipAuth) {
    if (isRefreshing) {
      // 如果正在刷新，将请求加入队列
      return new Promise<string | null>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newToken => {
        // 队列中的请求使用新 token 重试
        return fetchAuthenticated<T>(endpoint, {
          ...options,
          headers: { ...requestHeaders, 'Authorization': `Bearer ${newToken}` }
        }, true);
      }).catch((err: unknown) => {
        return Promise.reject(err as Error);
      });
    }

    isRefreshing = true;
    const storedRefreshToken = localStorage.getItem('refresh_token');
    
    if (!storedRefreshToken) {
      authErrorHandler.onLogout();
      processQueue(new Error('No refresh token found, user needs to re-login.'));
      throw new Error('No refresh token found, user needs to re-login.');
    }

    try {
      // 刷新 token
      const refreshData = await fetchPublic<{
        access_token: string;
        refresh_token: string;
        token_type: string;
      }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (!refreshData.success || refreshData.code !== 200) {
        throw new Error(refreshData.message || 'Failed to refresh access token');
      }

      const { access_token: newAccessToken, refresh_token: newRefreshToken } = refreshData.data;

      // 更新本地存储的 token
      localStorage.setItem('access_token', newAccessToken);
      localStorage.setItem('refresh_token', newRefreshToken);
      token = newAccessToken;

      authErrorHandler.onRefresh(newAccessToken, newRefreshToken);
      processQueue(null, token);

      // 重试原始请求
      return fetchAuthenticated<T>(endpoint, {
        ...options,
        headers: { ...requestHeaders, 'Authorization': `Bearer ${token}` }
      }, true);

    } catch (refreshError: unknown) {
      console.error('Failed to refresh access token:', refreshError);
      authErrorHandler.onLogout();
      processQueue(refreshError as Error);
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  // 返回原始响应或解析后的数据
  if (options?.returnRawResponse) {
    return response;
  }

  return responseToApiResponse<T>(response);
};

/**
 * 通用请求函数
 */
export const apiRequest = async <T>(
  endpoint: string,
  options?: RequestConfig,
): Promise<ApiResponse<T>> => {
  if (options?.skipAuth) {
    return fetchPublic<T>(endpoint, options);
  } else {
    return fetchAuthenticated<T>(endpoint, options) as Promise<ApiResponse<T>>;
  }
};

/**
 * 便捷的 HTTP 方法
 */
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),
}; 