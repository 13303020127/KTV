/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import { addSearchHistory, clearSearchHistory, deleteSearchHistory, getSearchHistory, subscribeToDataUpdates } from '@/lib/db.client';
import { SearchResult } from '@/lib/types';

import VideoCard from '@/components/VideoCard';

function SearchPageClient() {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // 加载搜索历史
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const history = await getSearchHistory();
        setSearchHistory(history);
      } catch (error) {
        console.error('加载搜索历史失败:', error);
      }
    };

    loadSearchHistory();

    const unsubscribe = subscribeToDataUpdates('searchHistoryUpdated', () => {
      loadSearchHistory();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 处理URL搜索参数
  useEffect(() => {
    const query = searchParams.get('q') || '';
    if (query) {
      setSearchQuery(query);
      fetchSearchResults(query);
    } else {
      setShowResults(false);
    }
  }, [searchParams]);

  // 获取搜索结果
  const fetchSearchResults = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setShowResults(true);

    // 添加请求超时处理
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    try {
      const authInfo = await getAuthInfoFromBrowserCookie();
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&t=${Date.now()}`,
        {
          headers: {
            Authorization: authInfo ? `Bearer ${authInfo.token}` : '',
          },
          signal: controller.signal,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.regular_results || []);
        
        const currentQuery = searchParams.get('q') || '';
        if (query === currentQuery && query.trim()) {
          await addSearchHistory(query.trim());
        }
      } else {
        console.error('搜索请求失败，状态码:', response.status);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('搜索请求超时');
      } else {
        console.error('搜索失败:', error);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  // 清空搜索
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    router.push('/search');
  };

  // 返回上一页功能
  const handleGoBack = () => {
    router.back();
  };

  // 返回首页功能
  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen">
      <div className="p-4">
        <div className="flex items-center justify-center max-w-3xl mx-auto">
          <button
            onClick={handleGoBack}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 mr-3 shadow-sm"
            aria-label="返回"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-all duration-200 mr-3 shadow-sm"
            aria-label="返回首页"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </button>
          
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setShowResults(false);
                  }
                }}
                placeholder="搜索电影、电视剧..."
                className="w-full h-12 rounded-lg bg-white py-3 pl-12 pr-12 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 border border-gray-200 shadow-md"
              />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          </form>
        </div>
      </div>

      <div className="px-4 py-2">
        {searchHistory.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">
              搜索历史
              <button
                onClick={() => clearSearchHistory()}
                className="ml-3 text-sm text-gray-500 hover:text-red-500"
              >
                清空
              </button>
            </h3>
            <div className="flex overflow-x-auto whitespace-nowrap py-2 -mx-1">
              <div className="inline-flex gap-2 mx-1">
                {searchHistory.slice(0, 5).map((item) => {
                  // 截断过长的搜索词，最多显示20个字符
                  const displayText = item.length > 20 ? `${item.substring(0, 20)}...` : item;
                  
                  return (
                    <div key={item} className="relative group">
                      <button
                        onClick={() => {
                          setSearchQuery(item);
                          router.push(`/search?q=${encodeURIComponent(item.trim())}`);
                        }}
                        className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 whitespace-nowrap"
                        title={item} // 鼠标悬停时显示完整内容
                      >
                        {displayText}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSearchHistory(item);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 opacity-0 group-hover:opacity-100 bg-gray-400 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {!showResults && searchHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无搜索历史
          </div>
        )}
      </div>

      {showResults && (
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4">搜索结果</h3>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 max-w-7xl mx-auto">
                  {searchResults.map((item) => (
                    <VideoCard
                      key={`${item.source}-${item.id}`}
                      id={item.id}
                      title={item.title}
                      poster={item.poster}
                      episodes={item.episodes.length}
                      source={item.source}
                      source_name={item.source_name}
                      from="search"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  未找到相关结果
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
