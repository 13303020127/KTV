'use client';

import React from 'react';
import { ReactQueryProvider } from '@/lib/react-query-provider';

interface ClientProvidersProps {
  children: React.ReactNode;
}

// 客户端提供者组件，用于包装所有客户端需要的提供者
export function ClientProviders({ children }: ClientProvidersProps) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}