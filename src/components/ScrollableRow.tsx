import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ScrollableRowProps {
  children: React.ReactNode;
  itemWidth?: number; // 每个项目的宽度
  itemGap?: number; // 项目间距
}

export default function ScrollableRow({
  children,
  itemWidth = 200, // 默认项目宽度
  itemGap = 24, // 默认项目间距
}: ScrollableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [childElements, setChildElements] = useState<React.ReactNode[]>([]);

  // 将children转换为数组
  useEffect(() => {
    if (React.isValidElement(children)) {
      setChildElements([children]);
    } else if (Array.isArray(children)) {
      setChildElements(children.filter(React.isValidElement));
    } else {
      setChildElements([]);
    }
  }, [children]);

  // 使用@tanstack/react-virtual实现虚拟滚动
  const virtualizer = useVirtualizer({
    count: childElements.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => itemWidth + itemGap, // 每个项目的宽度 + 间距
    overscan: 5, // 预渲染额外的项目数量
    horizontal: true, // 水平滚动
  });

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = containerRef.current;

      // 计算是否需要左右滚动按钮
      const threshold = 1; // 容差值，避免浮点误差
      const canScrollRight = scrollWidth - (scrollLeft + clientWidth) > threshold;
      const canScrollLeft = scrollLeft > threshold;

      setShowRightScroll(canScrollRight);
      setShowLeftScroll(canScrollLeft);
    }
  };

  // 滚动到指定位置
  const scrollTo = (offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: offset,
        behavior: 'smooth',
      });
    }
  };

  const handleScrollRightClick = () => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8; // 滚动容器宽度的80%
      scrollTo(containerRef.current.scrollLeft + scrollAmount);
    }
  };

  const handleScrollLeftClick = () => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8; // 滚动容器宽度的80%
      scrollTo(Math.max(0, containerRef.current.scrollLeft - scrollAmount));
    }
  };

  useEffect(() => {
    checkScroll();

    // 监听滚动事件
    const handleScroll = () => checkScroll();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [virtualizer.getTotalSize()]); // 依赖总大小变化

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className='relative'
      onMouseEnter={() => {
        setIsHovered(true);
        checkScroll();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 虚拟滚动容器 */}
      <div
        ref={containerRef}
        className='flex overflow-x-auto scrollbar-hide py-1 sm:py-2 pb-12 sm:pb-14 px-4 sm:px-6'
        style={{
          // 确保容器有足够的宽度来容纳所有项目
          width: '100%',
          overflowX: 'auto',
          position: 'relative',
        }}
      >
        {/* 虚拟滚动内容容器 */}
        <div
          className='flex space-x-6'
          style={{
            width: `${virtualizer.getTotalSize()}px`,
            height: '100%',
            position: 'relative',
          }}
        >
          {/* 渲染可见的项目 */}
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const child = childElements[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: `${itemWidth}px`,
                  transform: `translateX(${virtualItem.start}px)`,
                  flexShrink: 0,
                }}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>

      {/* 左侧滚动按钮 */}
      {showLeftScroll && (
        <div
          className={`hidden sm:flex absolute left-0 top-0 bottom-0 w-16 items-center justify-center z-[600] transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'transparent',
            pointerEvents: 'none',
          }}
        >
          <div
            className='absolute inset-0 flex items-center justify-center'
            style={{
              top: '40%',
              bottom: '60%',
              left: '-4.5rem',
              pointerEvents: 'auto',
            }}
          >
            <button
              onClick={handleScrollLeftClick}
              className='w-12 h-12 bg-white/95 rounded-full shadow-lg flex items-center justify-center hover:bg-white border border-gray-200 transition-transform hover:scale-105 dark:bg-gray-800/90 dark:hover:bg-gray-700 dark:border-gray-600'
              aria-label="向左滚动"
            >
              <ChevronLeft className='w-6 h-6 text-gray-600 dark:text-gray-300' />
            </button>
          </div>
        </div>
      )}

      {/* 右侧滚动按钮 */}
      {showRightScroll && (
        <div
          className={`hidden sm:flex absolute right-0 top-0 bottom-0 w-16 items-center justify-center z-[600] transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'transparent',
            pointerEvents: 'none',
          }}
        >
          <div
            className='absolute inset-0 flex items-center justify-center'
            style={{
              top: '40%',
              bottom: '60%',
              right: '-4.5rem',
              pointerEvents: 'auto',
            }}
          >
            <button
              onClick={handleScrollRightClick}
              className='w-12 h-12 bg-white/95 rounded-full shadow-lg flex items-center justify-center hover:bg-white border border-gray-200 transition-transform hover:scale-105 dark:bg-gray-800/90 dark:hover:bg-gray-700 dark:border-gray-600'
              aria-label="向右滚动"
            >
              <ChevronRight className='w-6 h-6 text-gray-600 dark:text-gray-300' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
