'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ReactElement;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新 state 使下一次渲染能够显示降级 UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 可以在这里记录错误信息到服务端
    console.error('组件错误:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRefresh = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { fallbackComponent } = this.props;

    if (hasError) {
      // 如果提供了自定义降级组件，则使用它
      if (fallbackComponent) {
        return fallbackComponent;
      }

      // 自定义错误展示界面
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="mb-4 text-amber-500">
              <AlertTriangle size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              抱歉，页面出现了错误
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error?.message || '未知错误'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all min-w-[120px] sm:min-w-[140px]"
                onClick={this.handleRefresh}
              >
                <RefreshCw size={16} />
                刷新页面
              </button>
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white transition-all min-w-[120px] sm:min-w-[140px]"
                onClick={this.handleGoHome}
              >
                <Home size={16} />
                返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;