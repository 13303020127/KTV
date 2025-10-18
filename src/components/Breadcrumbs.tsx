import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export const Breadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathSegments = pathname.split('/').filter(Boolean);

  // 构建面包屑项目
  const breadcrumbItems: BreadcrumbItem[] = [];
  
  // 添加首页
  breadcrumbItems.push({ label: '首页', href: '/' });

  // 构建路径项
  let currentPath = '';
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    let label = segment;
    
    // 为特定路径提供更友好的标签
    switch (segment) {
      case 'play':
        label = '播放';
        break;
      case 'search':
        label = '搜索';
        const searchQuery = searchParams.get('q');
        if (searchQuery) {
          label = `搜索: ${searchQuery}`;
        }
        break;
      case 'douban':
        label = '豆瓣';
        const type = searchParams.get('type');
        if (type) {
          switch (type) {
            case 'movie':
              label = '电影';
              break;
            case 'tv':
              label = '剧集';
              break;
            case 'show':
              label = '综艺';
              break;
          }
        }
        break;
      case 'settings':
        label = '设置';
        break;
      case 'config':
        label = 'TVBox配置';
        break;
      case 'admin':
        label = '管理';
        break;
      case 'warning':
        label = '警告';
        break;
      case 'login':
        label = '登录';
        break;
    }
    
    breadcrumbItems.push({ label, href: currentPath });
  }

  if (breadcrumbItems.length <= 1) {
    return null; // 只显示首页时隐藏面包屑
  }

  return (
    <div className="flex items-center space-x-2 py-2 px-4 md:px-0 text-sm">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        if (isLast) {
          return (
            <span
              key={index}
              className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px] md:max-w-[400px]"
            >
              {item.label}
            </span>
          );
        }
        
        return (
          <React.Fragment key={index}>
            <Link
              href={item.href}
              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-150 truncate max-w-[150px]"
            >
              {item.label}
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </React.Fragment>
        );
      })}
    </div>
  );
};