import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSearchHistory } from '@/lib/db.client';

interface SearchSuggestionsProps {
  onSearch: (query: string) => void;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // 加载搜索历史
    const loadSearchHistory = async () => {
      const history = await getSearchHistory();
      setSearchHistory(history);
    };
    loadSearchHistory();

    // 点击外部关闭建议框
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-suggestions-container')) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // 根据输入过滤搜索历史
    if (query.trim()) {
      const filtered = searchHistory.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(searchHistory.slice(0, 8)); // 显示最近的8条搜索记录
    }
  }, [query, searchHistory]);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <div className="search-suggestions-container relative w-full max-w-md">
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
            if (e.key === 'Escape') setIsFocused(false);
          }}
          placeholder="搜索电影、剧集..."
          className="w-full pl-10 pr-4 py-2 rounded-full border border-purple-300 dark:border-purple-700 
                     bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm focus:outline-none focus:ring-2 
                     focus:ring-purple-500 transition-all duration-200 shadow-sm"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-full w-full" />
          </button>
        )}
      </div>

      {(isFocused && filteredSuggestions.length > 0) && (
        <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-purple-200 dark:border-purple-900 z-50 max-h-96 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 text-sm"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3 text-gray-500" />
                <span>{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};