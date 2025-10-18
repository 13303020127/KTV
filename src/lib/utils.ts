/* eslint-disable @typescript-eslint/no-explicit-any,no-console */

// 临时添加hls.js类型声明
declare module 'hls.js' {
  class Hls {
    constructor(config?: any);
    loadSource(url: string): void;
    attachMedia(media: HTMLMediaElement): void;
    on(event: string, listener: (...args: any[]) => any): void;
    destroy(): void;
    currentLevel: number;
    levels: any[];
    startLoad(startTime: number): void;
    stopLoad(): void;
    recoverMediaError(): void;
  }
}

import Hls from 'hls.js';

/**
 * 获取图片代理 URL 设置
 */
export function getImageProxyUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 本地未开启图片代理，则不使用代理
  const enableImageProxy = localStorage.getItem('enableImageProxy');
  if (enableImageProxy !== null) {
    if (!JSON.parse(enableImageProxy) as boolean) {
      return null;
    }
  }

  const localImageProxy = localStorage.getItem('imageProxyUrl');
  if (localImageProxy != null) {
    return localImageProxy.trim() ? localImageProxy.trim() : null;
  }

  // 如果未设置，则使用全局对象
  const serverImageProxy = (window as any).RUNTIME_CONFIG?.IMAGE_PROXY;
  return serverImageProxy && serverImageProxy.trim()
    ? serverImageProxy.trim()
    : null;
}

/**
 * 获取设备像素比和布局相关信息，用于生成合适尺寸的图片URL
 */
function getDeviceImageConfig() {
  if (typeof window === 'undefined') {
    return { width: 300, height: 450, dpr: 1 };
  }
  
  const dpr = window.devicePixelRatio || 1;
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  // 根据设备类型和屏幕宽度计算合适的图片尺寸
  let baseWidth = 300;
  let baseHeight = 450;
  
  if (isMobile) {
    baseWidth = 200;
    baseHeight = 300;
  } else if (isTablet) {
    baseWidth = 250;
    baseHeight = 375;
  }
  
  // 考虑设备像素比，但限制最大清晰度以避免过大图片
  const maxDpr = 2;
  const effectiveDpr = Math.min(dpr, maxDpr);
  
  return {
    width: Math.floor(baseWidth * effectiveDpr),
    height: Math.floor(baseHeight * effectiveDpr),
    dpr: effectiveDpr
  };
}

/**
 * 向图片URL添加尺寸参数
 * 支持常见的图片CDN格式：cloudinary、imgix、阿里云OSS、腾讯云COS等
 */
function addImageSizeParams(url: string, width: number, height: number): string {
  // 检查是否已经包含尺寸参数
  if (url.includes('w=') || url.includes('width=') || url.includes('resize=')) {
    return url;
  }
  
  // 支持的CDN模式
  const cdnPatterns = [
    // Cloudinary
    { pattern: /res\.cloudinary\.com/, param: `/w_${width},h_${height}/` },
    // Imgix
    { pattern: /imgix\.net/, param: `?w=${width}&h=${height}&fit=crop` },
    // 阿里云OSS
    { pattern: /aliyuncs\.com/, param: `?x-oss-process=image/resize,m_fill,w_${width},h_${height}` },
    // 腾讯云COS
    { pattern: /myqcloud\.com/, param: `?imageMogr2/thumbnail/${width}x${height}>/` },
    // 七牛云
    { pattern: /qiniudn\.com/, param: `?imageView2/1/w/${width}/h/${height}` }
  ];
  
  // 检查URL是否匹配已知的CDN模式
  for (const { pattern, param } of cdnPatterns) {
    if (pattern.test(url)) {
      // 对于Cloudinary，需要特殊处理URL格式
      if (pattern.toString().includes('cloudinary')) {
        const parts = url.split('/');
        // 在资源类型(upload/image等)和资源ID之间插入参数
        const resourceTypeIndex = parts.findIndex(part => part === 'upload' || part === 'image' || part === 'video');
        if (resourceTypeIndex > 0) {
          parts.splice(resourceTypeIndex + 1, 0, param.slice(1, -1)); // 移除首尾的斜杠
          return parts.join('/');
        }
      }
      // 对于其他CDN，添加查询参数
      return url.includes('?') ? `${url}&${param.slice(1)}` : url + param;
    }
  }
  
  // 如果不是已知CDN，返回原始URL
  return url;
}

/**
 * 处理图片 URL，如果设置了图片代理则使用代理，并根据设备和布局添加适当的尺寸参数
 */
export function processImageUrl(originalUrl: string): string {
  // 如果URL为空，返回默认的占位图片
  if (!originalUrl || originalUrl.trim() === '') {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iNTAwIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjEiPjxjaXJjbGUgY3g9IjE1MCIgY3k9IjI1MCIgcj0iMTUwIiBmaWxsPSIjMDAwIi8+PC9zdmc+';
  }
  
  const proxyUrl = getImageProxyUrl();
  let url = originalUrl;
  
  // 如果是浏览器环境，根据设备和布局添加合适的尺寸参数
  if (typeof window !== 'undefined') {
    const { width, height } = getDeviceImageConfig();
    url = addImageSizeParams(url, width, height);
  }
  
  // 如果设置了代理，使用代理URL
  if (proxyUrl) {
    return `${proxyUrl}${encodeURIComponent(url)}`;
  }
  
  return url;
}

/**
 * 获取豆瓣代理 URL 设置
 */
export function getDoubanProxyUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 本地未开启豆瓣代理，则不使用代理
  const enableDoubanProxy = localStorage.getItem('enableDoubanProxy');
  if (enableDoubanProxy !== null) {
    if (!JSON.parse(enableDoubanProxy) as boolean) {
      return null;
    }
  }

  const localDoubanProxy = localStorage.getItem('doubanProxyUrl');
  if (localDoubanProxy != null) {
    return localDoubanProxy.trim() ? localDoubanProxy.trim() : null;
  }

  // 如果未设置，则使用全局对象
  const serverDoubanProxy = (window as any).RUNTIME_CONFIG?.DOUBAN_PROXY;
  return serverDoubanProxy && serverDoubanProxy.trim()
    ? serverDoubanProxy.trim()
    : null;
}

/**
 * 处理豆瓣 URL，如果设置了豆瓣代理则使用代理
 */
export function processDoubanUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;

  const proxyUrl = getDoubanProxyUrl();
  if (!proxyUrl) return originalUrl;

  return `${proxyUrl}${encodeURIComponent(originalUrl)}`;
}

export function cleanHtmlTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '\n') // 将 HTML 标签替换为换行
    .replace(/\n+/g, '\n') // 将多个连续换行合并为一个
    .replace(/[ \t]+/g, ' ') // 将多个连续空格和制表符合并为一个空格，但保留换行符
    .replace(/^\n+|\n+$/g, '') // 去掉首尾换行
    .replace(/&nbsp;/g, ' ') // 将 &nbsp; 替换为空格
    .trim(); // 去掉首尾空格
}

/**
 * 从m3u8地址获取视频质量等级和网络信息
 * @param m3u8Url m3u8播放列表的URL
 * @returns Promise<{quality: string, loadSpeed: string, pingTime: number}> 视频质量等级和网络信息
 */
export async function getVideoResolutionFromM3u8(m3u8Url: string): Promise<{
  quality: string; // 如720p、1080p等
  loadSpeed: string; // 自动转换为KB/s或MB/s
  pingTime: number; // 网络延迟（毫秒）
}> {
  try {
    // 直接使用m3u8 URL作为视频源，避免CORS问题
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'metadata';

      // 测量网络延迟（ping时间） - 使用m3u8 URL而不是ts文件
      const pingStart = performance.now();
      let pingTime = 0;

      // 测量ping时间（使用m3u8 URL）
      fetch(m3u8Url, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          pingTime = performance.now() - pingStart;
        })
        .catch(() => {
          pingTime = performance.now() - pingStart; // 记录到失败为止的时间
        });

      // 固定使用hls.js加载
      const hls = new Hls();

      // 设置超时处理
      const timeout = setTimeout(() => {
        hls.destroy();
        video.remove();
        reject(new Error('Timeout loading video metadata'));
      }, 4000);

      video.onerror = () => {
        clearTimeout(timeout);
        hls.destroy();
        video.remove();
        reject(new Error('Failed to load video metadata'));
      };

      let actualLoadSpeed = '未知';
      let hasSpeedCalculated = false;
      let hasMetadataLoaded = false;

      let fragmentStartTime = 0;

      // 检查是否可以返回结果
      const checkAndResolve = () => {
        if (
          hasMetadataLoaded &&
          (hasSpeedCalculated || actualLoadSpeed !== '未知')
        ) {
          clearTimeout(timeout);
          const width = video.videoWidth;
          if (width && width > 0) {
            hls.destroy();
            video.remove();

            // 根据视频宽度判断视频质量等级，使用经典分辨率的宽度作为分割点
            const quality =
              width >= 3840
                ? '4K' // 4K: 3840x2160
                : width >= 2560
                ? '2K' // 2K: 2560x1440
                : width >= 1920
                ? '1080p' // 1080p: 1920x1080
                : width >= 1280
                ? '720p' // 720p: 1280x720
                : width >= 854
                ? '480p'
                : 'SD'; // 480p: 854x480

            resolve({
              quality,
              loadSpeed: actualLoadSpeed,
              pingTime: Math.round(pingTime),
            });
          } else {
            // webkit 无法获取尺寸，直接返回
            resolve({
              quality: '未知',
              loadSpeed: actualLoadSpeed,
              pingTime: Math.round(pingTime),
            });
          }
        }
      };

      // 监听片段加载开始
      hls.on(Hls.Events.FRAG_LOADING, () => {
        fragmentStartTime = performance.now();
      });

      // 监听片段加载完成，只需首个分片即可计算速度
      hls.on(Hls.Events.FRAG_LOADED, (event: any, data: any) => {
        if (
          fragmentStartTime > 0 &&
          data &&
          data.payload &&
          !hasSpeedCalculated
        ) {
          const loadTime = performance.now() - fragmentStartTime;
          const size = data.payload.byteLength || 0;

          if (loadTime > 0 && size > 0) {
            const speedKBps = size / 1024 / (loadTime / 1000);

            // 立即计算速度，无需等待更多分片
            const avgSpeedKBps = speedKBps;

            if (avgSpeedKBps >= 1024) {
              actualLoadSpeed = `${(avgSpeedKBps / 1024).toFixed(1)} MB/s`;
            } else {
              actualLoadSpeed = `${avgSpeedKBps.toFixed(1)} KB/s`;
            }
            hasSpeedCalculated = true;
            checkAndResolve(); // 尝试返回结果
          }
        }
      });

      hls.loadSource(m3u8Url);
      hls.attachMedia(video);

      // 监听hls.js错误
      hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        console.error('HLS错误:', data);
        if (data.fatal) {
          clearTimeout(timeout);
          hls.destroy();
          video.remove();
          reject(new Error(`HLS播放失败: ${data.type}`));
        }
      });

      // 监听视频元数据加载完成
      video.onloadedmetadata = () => {
        hasMetadataLoaded = true;
        checkAndResolve(); // 尝试返回结果
      };
    });
  } catch (error) {
    throw new Error(
      `Error getting video resolution: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
