'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun, MonitorSmartphone, Grid, ListFilter, Bell, BellOff, BellRinging } from 'lucide-react';
import { useTheme } from 'next-themes';
import { apiService } from '@/lib/api-service';

interface PersonalizationSettingsProps {
  userName: string;
  onUpdate?: () => void;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  layout: 'compact' | 'relaxed';
  notificationFrequency: 'all' | 'important' | 'none';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  layout: 'relaxed',
  notificationFrequency: 'important',
};

export default function PersonalizationSettings({
  userName,
  onUpdate,
}: PersonalizationSettingsProps) {
  const { setTheme: nextSetTheme, theme: currentTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载用户偏好设置
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const settingsData = await apiService.getUserSettings(userName);
        // 假设用户设置中包含preferences字段
        if (settingsData.data?.preferences) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...settingsData.data.preferences,
          });
        }
      } catch (err) {
        console.error('加载用户偏好失败:', err);
        // 使用默认偏好设置
      }
    };

    loadUserPreferences();
  }, [userName]);

  // 保存用户偏好设置
  const savePreferences = async (newPreferences: UserPreferences) => {
    setIsSaving(true);
    setError(null);

    try {
      // 使用updateUserSettings mutation
      const updateMutation = apiService.updateUserSettings();
      await updateMutation.mutateAsync({
        userName,
        settings: { preferences: newPreferences },
      });

      setPreferences(newPreferences);
      onUpdate?.();
    } catch (err) {
      console.error('保存用户偏好失败:', err);
      setError('保存设置失败，请稍后再试');
    } finally {
      setIsSaving(false);
    }
  };

  // 主题切换处理
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    nextSetTheme(theme);
    savePreferences({ ...preferences, theme });
  };

  // 布局偏好处理
  const handleLayoutChange = (layout: 'compact' | 'relaxed') => {
    savePreferences({ ...preferences, layout });
    // 添加或移除全局布局类
    document.documentElement.classList.toggle('layout-compact', layout === 'compact');
    document.documentElement.classList.toggle('layout-relaxed', layout === 'relaxed');
  };

  // 通知频率处理
  const handleNotificationChange = (frequency: 'all' | 'important' | 'none') => {
    savePreferences({ ...preferences, notificationFrequency: frequency });
  };

  // 应用布局类
  useEffect(() => {
    document.documentElement.classList.toggle('layout-compact', preferences.layout === 'compact');
    document.documentElement.classList.toggle('layout-relaxed', preferences.layout === 'relaxed');
    
    return () => {
      // 清理函数
      document.documentElement.classList.remove('layout-compact', 'layout-relaxed');
    };
  }, [preferences.layout]);

  return (
    <div className="space-y-8">
      {/* 主题设置 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          外观主题
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${preferences.theme === 'light' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              transition-all duration-200 min-h-[120px] w-full`}
            aria-pressed={preferences.theme === 'light'}
          >
            <Sun className="w-8 h-8 text-amber-500 mb-3" />
            <span className="font-medium text-gray-900 dark:text-white">亮色模式</span>
          </button>
          
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${preferences.theme === 'dark' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              transition-all duration-200 min-h-[120px] w-full`}
            aria-pressed={preferences.theme === 'dark'}
          >
            <Moon className="w-8 h-8 text-indigo-500 mb-3" />
            <span className="font-medium text-gray-900 dark:text-white">暗色模式</span>
          </button>
          
          <button
            onClick={() => handleThemeChange('system')}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${preferences.theme === 'system' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              transition-all duration-200 min-h-[120px] w-full`}
            aria-pressed={preferences.theme === 'system'}
          >
            <MonitorSmartphone className="w-8 h-8 text-gray-500 mb-3" />
            <span className="font-medium text-gray-900 dark:text-white">跟随系统</span>
          </button>
        </div>
      </div>

      {/* 布局偏好 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          界面布局
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleLayoutChange('compact')}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${preferences.layout === 'compact' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              transition-all duration-200 min-h-[120px] w-full`}
            aria-pressed={preferences.layout === 'compact'}
          >
            <Grid className="w-8 h-8 text-blue-500 mb-3" />
            <span className="font-medium text-gray-900 dark:text-white">紧凑布局</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">适合屏幕空间有限的设备</span>
          </button>
          
          <button
            onClick={() => handleLayoutChange('relaxed')}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${preferences.layout === 'relaxed' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              transition-all duration-200 min-h-[120px] w-full`}
            aria-pressed={preferences.layout === 'relaxed'}
          >
            <ListFilter className="w-8 h-8 text-green-500 mb-3" />
            <span className="font-medium text-gray-900 dark:text-white">宽松布局</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">更宽敞的间距，提升阅读体验</span>
          </button>
        </div>
      </div>

      {/* 通知设置 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          通知偏好
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleNotificationChange('all')}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${preferences.notificationFrequency === 'all' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              transition-all duration-200 min-h-[120px] w-full`}
            aria-pressed={preferences.notificationFrequency === 'all'}
          >
            <Bell className="w-8 h-8 text-red-500 mb-3" />
            <span className="font-medium text-gray-900 dark:text-white">所有通知</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">接收所有系统通知</span>
          </button>
          
          <button
            onClick={() => handleNotificationChange('important')}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${preferences.notificationFrequency === 'important' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              transition-all duration-200 min-h-[120px] w-full`}
            aria-pressed={preferences.notificationFrequency === 'important'}
          >
            <BellRinging className="w-8 h-8 text-amber-500 mb-3" />
            <span className="font-medium text-gray-900 dark:text-white">重要通知</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">仅接收重要系统通知</span>
          </button>
          
          <button
            onClick={() => handleNotificationChange('none')}
            className={`flex flex-col items-center justify-center p-6 rounded-lg border ${preferences.notificationFrequency === 'none' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
              transition-all duration-200 min-h-[120px] w-full`}
            aria-pressed={preferences.notificationFrequency === 'none'}
          >
            <BellOff className="w-8 h-8 text-gray-500 mb-3" />
            <span className="font-medium text-gray-900 dark:text-white">关闭通知</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">不接收任何系统通知</span>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 保存状态指示器 */}
      {isSaving && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-blue-600 dark:text-blue-400 text-sm">正在保存设置...</p>
        </div>
      )}
    </div>
  );
}