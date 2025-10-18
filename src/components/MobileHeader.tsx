'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { addSearchHistory } from '@/lib/db.client';

import { BackButton } from './BackButton';
import { useSite } from './SiteProvider';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { SearchSuggestions } from './SearchSuggestions';

interface MobileHeaderProps {
  showBackButton?: boolean;
}

const MobileHeader = ({ showBackButton = false }: MobileHeaderProps) => {
  const { siteName } = useSite();
  const router = useRouter();

  const handleSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      // 保存搜索历史
      await addSearchHistory(query);
      // 导航到搜索页面
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }, [router]);

  return (
    <header className='md:hidden relative w-full bg-white/70 backdrop-blur-xl border-b border-purple-200/50 shadow-sm dark:bg-gray-900/70 dark:border-purple-700/50'>
      <div className='h-12 flex items-center justify-between px-4'>
        {/* 左侧：返回按钮和设置按钮 */}
        <div className='flex items-center gap-2'>
          {showBackButton && <BackButton />}
        </div>

        {/* 中间：Logo（绝对居中）- 应用彩虹渐变效果 */}
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          <Link
            href='/'
            className='text-2xl font-bold katelya-logo tracking-tight hover:opacity-80 transition-opacity'
          >
            {siteName}
          </Link>
        </div>

        {/* 右侧按钮 */}
        <div className='flex items-center gap-2'>
          <Link href="/search" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Search className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
