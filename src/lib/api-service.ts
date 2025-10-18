'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuthInfoFromBrowserCookie } from './auth';

// API 基础配置
const API_BASE_URL = '/api';

// 缓存键前缀
const CACHE_KEYS = {
  // 热门内容 - 缓存时间较长
  HOT_CONTENT: 'hot_content',
  // 搜索结果 - 缓存时间适中
  SEARCH_RESULTS: 'search_results',
  // 用户数据 - 缓存时间较短
  USER_DATA: 'user_data',
  // 配置数据 - 缓存时间较长
  CONFIG_DATA: 'config_data',
  // 播放记录 - 实时性要求高
  PLAY_RECORDS: 'play_records',
  // 收藏数据 - 实时性要求高
  FAVORITES: 'favorites',
};

// 重试配置接口
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000, // 初始延迟1秒
  maxDelayMs: 10000, // 最大延迟10秒
};

// 带指数退避策略的API请求函数
async function fetchApiWithRetry<T>(
  endpoint: string, 
  options?: RequestInit,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      // 如果不是第一次尝试，添加重试标记到请求头
      const headers = attempt > 0
        ? { ...options?.headers, 'X-Retry-Attempt': attempt.toString() }
        : options?.headers;

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        // 对于某些错误状态码不进行重试（如401、403、404等）
        const shouldNotRetry = [400, 401, 403, 404, 405, 422].includes(response.status);
        
        if (shouldNotRetry || attempt >= retryConfig.maxRetries) {
          throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
        }
      } else {
        return response.json() as Promise<T>;
      }
    } catch (error) {
      // 只对网络错误和需要重试的HTTP错误进行重试
      const isNetworkError = error instanceof TypeError && 
        (error.message === 'Failed to fetch' || 
         error.message.includes('Network'));
      
      lastError = error as Error;
      
      // 如果是最后一次尝试或不是网络错误，则抛出异常
      if (attempt >= retryConfig.maxRetries || !isNetworkError) {
        throw lastError;
      }
    }

    // 计算下次重试的延迟时间（指数退避 + 随机抖动）
    if (attempt < retryConfig.maxRetries) {
      const exponentialDelay = Math.min(
        retryConfig.baseDelayMs * Math.pow(2, attempt),
        retryConfig.maxDelayMs
      );
      // 添加±20%的随机抖动，避免多个请求同时重试
      const jitter = 0.8 + Math.random() * 0.4;
      const delayMs = Math.floor(exponentialDelay * jitter);
      
      console.log(`请求 ${endpoint} 将在 ${delayMs}ms 后重试 (第 ${attempt + 1} 次)`);
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // 所有重试都失败，抛出最后一个错误
  throw lastError || new Error('API 请求失败：所有重试均已耗尽');
}

// 通用获取函数（使用带重试的实现）
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchApiWithRetry<T>(endpoint, options);
}

// API 服务类
class ApiService {
  // 搜索相关 API
  
  // 搜索内容（适中缓存时间）
  search<T>(query: string, category?: string, page = 1) {
    return useQuery({
      queryKey: [CACHE_KEYS.SEARCH_RESULTS, query, category, page],
      queryFn: () => fetchApi<T>(`/search?q=${encodeURIComponent(query)}${category ? `&category=${category}` : ''}&page=${page}`),
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 30 * 60 * 1000, // 30分钟
    });
  }

  // 用户相关 API
  
  // 获取用户设置（短缓存时间）
  getUserSettings<T>(userName: string) {
    return useQuery({
      queryKey: [CACHE_KEYS.USER_DATA, 'settings', userName],
      queryFn: () => fetchApi<T>('/user/settings', {
        headers: {
          'Authorization': `Bearer ${encodeURIComponent(userName)}`,
        },
      }),
      staleTime: 2 * 60 * 1000, // 2分钟
      gcTime: 10 * 60 * 1000, // 10分钟
    });
  }

  // 更新用户设置（无缓存）
  updateUserSettings<T>() {
    return useMutation({
      mutationFn: ({ userName, settings }: { userName: string; settings: any }) => fetchApi<T>('/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(userName)}`,
        },
        body: JSON.stringify({ settings }),
      }),
      // 成功后使相关查询失效
      onSuccess: (_data, variables) => {
        // 在实际使用中可以使用 queryClient.invalidateQueries 使相关查询失效
        // 这里我们依赖组件内部的状态更新
      },
    });
  }

  // 刷新缓存
  refreshCache(userName: string) {
    return useMutation({
      mutationFn: async () => {
        return await fetchApi('/api/search?q=_cache_refresh_', {
          headers: {
            'Authorization': `Bearer ${encodeURIComponent(userName)}`,
          },
        });
      },
    });
  }

  /**
   * 获取用户列表（管理员功能）
   */
  getUsers() {
    return useQuery({
      queryKey: ['admin-users'],
      queryFn: async () => {
        const authInfo = getAuthInfoFromBrowserCookie();
        if (!authInfo?.username) {
          throw new Error('未获取到用户认证信息');
        }

        return await fetchApi('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${encodeURIComponent(authInfo.username)}`,
            'Cache-Control': 'no-cache'
          }
        });
      },
      staleTime: 60 * 1000, // 1分钟
      gcTime: 5 * 60 * 1000, // 5分钟
    });
  }

  /**
   * 更新用户设置（管理员功能）
   */
  updateAdminUserSettings() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ 
        action, 
        username, 
        settings,
        currentUserName 
      }: { 
        action: string; 
        username: string; 
        settings?: any;
        currentUserName: string;
      }) => {
        return await fetchApi('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${encodeURIComponent(currentUserName)}`
          },
          body: JSON.stringify({
            action,
            username,
            settings
          })
        });
      },
      // 更新成功后使相关查询失效
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      }
    });
  }

  // 播放记录相关 API
  
  // 获取播放记录（实时性要求高）
  getPlayRecords<T>() {
    return useQuery({
      queryKey: [CACHE_KEYS.PLAY_RECORDS],
      queryFn: () => fetchApi<T>('/playrecords'),
      staleTime: 1 * 60 * 1000, // 1分钟
      gcTime: 5 * 60 * 1000, // 5分钟
    });
  }

  // 添加播放记录
  addPlayRecord<T>() {
    return useMutation({
      mutationFn: (data: any) => fetchApi<T>('/playrecords', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    });
  }

  // 收藏相关 API
  
  // 获取收藏列表（实时性要求高）
  getFavorites<T>() {
    return useQuery({
      queryKey: [CACHE_KEYS.FAVORITES],
      queryFn: () => fetchApi<T>('/favorites'),
      staleTime: 1 * 60 * 1000, // 1分钟
      gcTime: 5 * 60 * 1000, // 5分钟
    });
  }

  // 添加收藏
  addFavorite<T>() {
    return useMutation({
      mutationFn: (data: any) => fetchApi<T>('/favorites', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    });
  }

  // 热门内容（长缓存时间）
  getHotContent<T>() {
    return useQuery({
      queryKey: [CACHE_KEYS.HOT_CONTENT],
      queryFn: () => fetchApi<T>('/hot-content'),
      staleTime: 30 * 60 * 1000, // 30分钟
      gcTime: 2 * 60 * 60 * 1000, // 2小时
    });
  }

  // 配置相关 API
  
  // 获取站点配置（长缓存时间）
  getConfig<T>() {
    return useQuery({
      queryKey: [CACHE_KEYS.CONFIG_DATA],
      queryFn: () => fetchApi<T>('/config'),
      staleTime: 60 * 60 * 1000, // 1小时
      gcTime: 3 * 60 * 60 * 1000, // 3小时
    });
  }

  /**
   * 修改密码
   */
  changePassword<T>() {
    return useMutation({
      mutationFn: ({ 
        userName, 
        currentPassword, 
        newPassword 
      }: { 
        userName: string; 
        currentPassword: string; 
        newPassword: string;
      }) => fetchApi<T>('/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(userName)}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })
    });
  }
}

// 导出单例
export const apiService = new ApiService();

// 导出缓存键常量供其他地方使用
export { CACHE_KEYS };