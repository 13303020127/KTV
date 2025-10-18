'use client';

import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  DefaultOptions,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 为不同类型的API设置差异化缓存时间
const defaultOptions: DefaultOptions = {
  queries: {
    // 默认缓存时间：5分钟
    staleTime: 5 * 60 * 1000,
    // 后台重新验证
    refetchOnWindowFocus: false,
    // 重试次数
    retry: 2,
  },
  mutations: {
    retry: 1,
  },
};

// 创建查询客户端
const queryClient = new QueryClient({
  defaultOptions,
  // 移除了可能导致问题的queryCache配置
});

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export function ReactQueryProvider({
  children,
}: ReactQueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 仅在开发环境显示DevTools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

// 导出查询客户端以便在其他地方使用
export { queryClient };