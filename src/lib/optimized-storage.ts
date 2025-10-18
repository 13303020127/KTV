'use client';

// 压缩工具函数（简单实现）
function compressData(data: any): string {
  try {
    // 移除不必要的空白字符
    const jsonString = JSON.stringify(data);
    // 这里可以集成更高级的压缩算法，如LZString
    return jsonString;
  } catch (error) {
    console.error('数据压缩失败:', error);
    return JSON.stringify(data);
  }
}

// 解压工具函数
function decompressData(compressedData: string): any {
  try {
    return JSON.parse(compressedData);
  } catch (error) {
    console.error('数据解压失败:', error);
    return null;
  }
}

// LRU 缓存项接口
interface LRUCacheItem {
  data: any;
  timestamp: number;
  size: number;
}

// LRU 缓存管理器类
class LRUCacheManager {
  // 最大存储限制（5MB）
  private maxStorageSize = 5 * 1024 * 1024;
  // 元数据键名
  private metadataKey = '__katelyatv_lru_metadata';
  // 当前存储大小
  private currentSize = 0;
  // 缓存项映射
  private cacheItems: Map<string, LRUCacheItem> = new Map();

  constructor() {
    this.initialize();
  }

  // 初始化缓存管理器
  private initialize() {
    try {
      const metadata = localStorage.getItem(this.metadataKey);
      if (metadata) {
        const parsedMetadata = decompressData(metadata);
        this.currentSize = parsedMetadata.currentSize || 0;
        this.cacheItems = new Map(Object.entries(parsedMetadata.cacheItems || {}));
      }
    } catch (error) {
      console.error('初始化缓存管理器失败:', error);
      // 重置状态
      this.reset();
    }
  }

  // 保存元数据
  private saveMetadata() {
    try {
      const metadata = {
        currentSize: this.currentSize,
        cacheItems: Object.fromEntries(this.cacheItems),
      };
      localStorage.setItem(this.metadataKey, compressData(metadata));
    } catch (error) {
      console.error('保存缓存元数据失败:', error);
    }
  }

  // 计算字符串大小（字节）
  private getStringSize(str: string): number {
    // 粗略计算 UTF-16 字符串的字节大小
    return new Blob([str]).size;
  }

  // 执行 LRU 淘汰策略
  private evictLRUItems(requiredSpace: number) {
    // 如果当前大小加上需要的空间不超过限制，不需要淘汰
    if (this.currentSize + requiredSpace <= this.maxStorageSize) {
      return;
    }

    // 按时间戳排序缓存项
    const sortedItems = Array.from(this.cacheItems.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    // 逐个淘汰最老的项目，直到有足够空间
    for (const [key, item] of sortedItems) {
      // 从 localStorage 中删除
      localStorage.removeItem(key);
      // 更新当前大小
      this.currentSize -= item.size;
      // 从映射中删除
      this.cacheItems.delete(key);

      // 检查是否有足够空间
      if (this.currentSize + requiredSpace <= this.maxStorageSize) {
        break;
      }
    }

    // 保存更新后的元数据
    this.saveMetadata();
  }

  // 设置项到 localStorage
  setItem(key: string, value: any): void {
    try {
      // 压缩数据
      const compressedData = compressData(value);
      const dataSize = this.getStringSize(compressedData);

      // 检查是否需要淘汰项目
      this.evictLRUItems(dataSize);

      // 保存数据
      localStorage.setItem(key, compressedData);

      // 更新元数据
      const oldItem = this.cacheItems.get(key);
      if (oldItem) {
        this.currentSize -= oldItem.size;
      }

      const newItem: LRUCacheItem = {
        data: value,
        timestamp: Date.now(),
        size: dataSize,
      };

      this.cacheItems.set(key, newItem);
      this.currentSize += dataSize;

      // 保存更新后的元数据
      this.saveMetadata();
    } catch (error) {
      console.error('保存数据失败:', error);
      // 如果保存失败，尝试强制清理一些空间
      this.forceCleanup();
    }
  }

  // 从 localStorage 获取项
  getItem(key: string): any {
    try {
      const compressedData = localStorage.getItem(key);
      if (compressedData === null) {
        return null;
      }

      // 解压数据
      const data = decompressData(compressedData);

      // 更新访问时间
      const item = this.cacheItems.get(key);
      if (item) {
        item.timestamp = Date.now();
        this.cacheItems.set(key, item);
        this.saveMetadata();
      }

      return data;
    } catch (error) {
      console.error('获取数据失败:', error);
      // 如果获取失败，移除损坏的数据
      this.removeItem(key);
      return null;
    }
  }

  // 从 localStorage 删除项
  removeItem(key: string): void {
    try {
      // 更新元数据
      const item = this.cacheItems.get(key);
      if (item) {
        this.currentSize -= item.size;
        this.cacheItems.delete(key);
        this.saveMetadata();
      }

      // 删除数据
      localStorage.removeItem(key);
    } catch (error) {
      console.error('删除数据失败:', error);
    }
  }

  // 清除所有缓存数据
  clear(): void {
    try {
      // 删除所有缓存项
      for (const key of this.cacheItems.keys()) {
        localStorage.removeItem(key);
      }

      // 重置状态
      this.reset();
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  // 重置状态
  private reset(): void {
    this.currentSize = 0;
    this.cacheItems.clear();
    localStorage.removeItem(this.metadataKey);
  }

  // 强制清理（当存储空间不足时）
  private forceCleanup(): void {
    // 删除最老的一半缓存项
    const sortedItems = Array.from(this.cacheItems.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const itemsToDelete = sortedItems.slice(0, Math.floor(sortedItems.length / 2));
    
    for (const [key, item] of itemsToDelete) {
      localStorage.removeItem(key);
      this.currentSize -= item.size;
      this.cacheItems.delete(key);
    }
    
    this.saveMetadata();
  }

  // 获取当前存储统计信息
  getStorageInfo(): {
    currentSize: number;
    maxSize: number;
    usagePercentage: number;
    itemCount: number;
  } {
    return {
      currentSize: this.currentSize,
      maxSize: this.maxStorageSize,
      usagePercentage: (this.currentSize / this.maxStorageSize) * 100,
      itemCount: this.cacheItems.size,
    };
  }
}

// 导出单例
export const optimizedStorage = new LRUCacheManager();

// 导出工具函数
export function compressString(str: string): string {
  // 简单的字符串压缩实现
  try {
    // 这里可以集成更高级的压缩库
    return str;
  } catch (error) {
    console.error('字符串压缩失败:', error);
    return str;
  }
}

export function decompressString(str: string): string {
  // 简单的字符串解压实现
  try {
    // 对应上面的压缩实现
    return str;
  } catch (error) {
    console.error('字符串解压失败:', error);
    return str;
  }
}