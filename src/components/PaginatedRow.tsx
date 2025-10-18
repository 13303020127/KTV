'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useMemo, useState, useEffect } from 'react';

interface PaginatedRowProps {
  children: React.ReactNode[];
  itemsPerPage?: number;
  className?: string;
  onLoadMore?: () => Promise<void>; // 新增：加载更多数据的回调函数
  hasMoreData?: boolean; // 新增：是否还有更多数据可加载
  isLoading?: boolean; // 新增：是否正在加载中
}

export default function PaginatedRow({
  children,
  className = '',
  onLoadMore,
  hasMoreData = true,
  isLoading = false,
}: PaginatedRowProps) {
  // 响应式状态
  const [is2xl, setIs2xl] = useState(false);
  const [isXl, setIsXl] = useState(false);
  const [isLg, setIsLg] = useState(false);
  const [isMd, setIsMd] = useState(false);
  const [isSm, setIsSm] = useState(false);

  // 使用useEffect和window.matchMedia来检测屏幕尺寸变化
  useEffect(() => {
    // 初始化媒体查询对象
    const mediaQuery2xl = window.matchMedia('(min-width: 1536px)');
    const mediaQueryXl = window.matchMedia('(min-width: 1280px)');
    const mediaQueryLg = window.matchMedia('(min-width: 1024px)');
    const mediaQueryMd = window.matchMedia('(min-width: 768px)');
    const mediaQuerySm = window.matchMedia('(min-width: 640px)');

    // 设置初始值
    setIs2xl(mediaQuery2xl.matches);
    setIsXl(mediaQueryXl.matches);
    setIsLg(mediaQueryLg.matches);
    setIsMd(mediaQueryMd.matches);
    setIsSm(mediaQuerySm.matches);

    // 创建事件监听器
    const handle2xlChange = (e: MediaQueryListEvent) => setIs2xl(e.matches);
    const handleXlChange = (e: MediaQueryListEvent) => setIsXl(e.matches);
    const handleLgChange = (e: MediaQueryListEvent) => setIsLg(e.matches);
    const handleMdChange = (e: MediaQueryListEvent) => setIsMd(e.matches);
    const handleSmChange = (e: MediaQueryListEvent) => setIsSm(e.matches);

    // 添加事件监听器
    mediaQuery2xl.addEventListener('change', handle2xlChange);
    mediaQueryXl.addEventListener('change', handleXlChange);
    mediaQueryLg.addEventListener('change', handleLgChange);
    mediaQueryMd.addEventListener('change', handleMdChange);
    mediaQuerySm.addEventListener('change', handleSmChange);

    // 清理函数
    return () => {
      mediaQuery2xl.removeEventListener('change', handle2xlChange);
      mediaQueryXl.removeEventListener('change', handleXlChange);
      mediaQueryLg.removeEventListener('change', handleLgChange);
      mediaQueryMd.removeEventListener('change', handleMdChange);
      mediaQuerySm.removeEventListener('change', handleSmChange);
    };
  }, []);
  
  // 根据屏幕尺寸自动调整每页显示的项目数量
  const itemsPerPage = useMemo(() => {
    if (is2xl) return 14; // 2xl屏幕显示2行7列
    if (isXl) return 12;  // xl屏幕显示2行6列
    if (isLg) return 10;  // lg屏幕显示2行5列
    if (isMd) return 8;   // md屏幕显示2行4列
    if (isSm) return 6;   // sm屏幕显示2行3列
    return 4;             // 移动端显示2行2列
  }, [is2xl, isXl, isLg, isMd, isSm]);
  const [startIndex, setStartIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const uniqueId = useId(); // 为每个实例生成唯一ID

  // 获取当前显示的项目 - 支持无限向前浏览
  const currentItems = useMemo(() => {
    const endIndex = startIndex + itemsPerPage;
    // 如果超出范围，循环显示
    if (endIndex <= children.length) {
      return children.slice(startIndex, endIndex);
    } else {
      // 当超出范围时，从头开始循环
      const firstPart = children.slice(startIndex);
      const secondPart = children.slice(0, endIndex - children.length);
      return [...firstPart, ...secondPart];
    }
  }, [children, startIndex, itemsPerPage]);

  // 向前翻页 - 禁止超出第一页
  const handlePrevPage = () => {
    setStartIndex((prev) => {
      const newIndex = prev - itemsPerPage;
      return newIndex < 0 ? 0 : newIndex; // 不允许小于0
    });
  };

  // 向后翻页 - 支持动态加载更多数据
  const handleNextPage = async () => {
    const newIndex = startIndex + itemsPerPage;
    
    // 如果即将超出当前数据范围，且有更多数据可加载，且有加载回调函数
    if (newIndex >= children.length && hasMoreData && onLoadMore && !isLoading) {
      try {
        await onLoadMore(); // 加载更多数据
        // 加载完成后，直接设置到下一页
        setStartIndex(newIndex);
      } catch (error) {
        // 静默处理加载错误，保持用户体验
      }
    } else if (newIndex < children.length) {
      // 如果还在当前数据范围内，直接翻页
      setStartIndex(newIndex);
    } else {
      // 如果没有更多数据可加载，循环回到第一页
      setStartIndex(0);
    }
  };

  // 检查是否可以向前翻页
  const canGoPrev = startIndex > 0;
  // 检查是否可以向后翻页：有更多数据或者当前不在最后一页
  const canGoNext = children.length > itemsPerPage && (startIndex + itemsPerPage < children.length || hasMoreData || startIndex + itemsPerPage >= children.length);

  // 如果没有足够的内容需要分页，就不显示按钮
  const needsPagination = children.length > itemsPerPage;

  return (
    <div
      className={`relative ${className}`}
      data-paginated-row={uniqueId}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 内容区域 - 移除group类以避免悬停效果冲突 */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5 relative w-full'>
        {currentItems}

        {/* 改进的导航按钮 - 仅在容器悬停时显示 */}
        {needsPagination && (
          <>
            {/* 左箭头按钮 - 只有不在第一页时才显示 */}
            {canGoPrev && (
              <button
                onClick={handlePrevPage}
                className={`absolute -left-12 z-20 w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  // 确保按钮在两行中间
                  top: 'calc(50% - 20px)',
                }}
                aria-label='上一页'
              >
                <ChevronLeft className='w-5 h-5 text-white' />
              </button>
            )}

            {/* 右箭头按钮 - 总是显示，支持动态加载 */}
            {canGoNext && (
              <button
                onClick={handleNextPage}
                disabled={isLoading}
                className={`absolute -right-12 z-20 w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  // 确保按钮在两行中间
                  top: 'calc(50% - 20px)',
                }}
                aria-label={isLoading ? '加载中...' : '下一页'}
              >
                {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                ) : (
                  <ChevronRight className='w-5 h-5 text-white' />
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* 移除页码指示器 - 不再需要 */}
    </div>
  );
}
