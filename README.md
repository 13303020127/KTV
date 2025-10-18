# KatelyaTV

高性能影视播放平台，支持多种视频源和播放格式。

## 项目简介

KatelyaTV 是一个现代化的影视播放平台，基于 Next.js 开发，支持多种视频源和播放格式，提供优秀的用户体验。

## 功能特性

- 支持多种视频源聚合
- 集成 HLS.js 和 Artplayer 播放器
- 响应式设计，支持移动端和桌面端
- 主题切换功能
- 收藏和播放记录功能
- 去广告功能
- 视频源优选功能

## 技术栈

- **前端框架**: Next.js 14
- **状态管理**: React Query
- **UI组件**: Tailwind CSS, Headless UI
- **视频播放**: Artplayer, HLS.js
- **部署**: Cloudflare Pages + D1 Database

## 部署指南

### 准备工作

1. 确保你有 Cloudflare 账号
2. 创建一个 D1 数据库
3. Fork 本仓库到你的 GitHub 账号

### 配置 Cloudflare Pages

1. 在 Cloudflare Pages 中连接你的 GitHub 仓库
2. 配置构建命令：
   - 构建命令: `npm install --frozen-lockfile && npm run build`
   - 输出目录: `.vercel/output/static`

### 环境变量配置

在 Cloudflare Pages 设置中必须配置以下环境变量：

#### 必须的环境变量

```
# 数据库配置
NEXT_PUBLIC_STORAGE_TYPE=d1  # 存储类型：使用 D1

# 站点访问密码（必须配置，用于访问控制）

# 站点访问密码（必须配置，用于访问控制）
PASSWORD=katelyatv2024  # 请修改为强密码

# 站点基本信息
NEXT_PUBLIC_SITE_NAME=KatelyaTV
NEXT_PUBLIC_SITE_DESCRIPTION=高性能影视播放平台
```

#### 可选的环境变量

```
# Douban API 配置（可选）
# DOUBAN_API_KEY=your_douban_api_key

# 图片代理配置
IMAGE_PROXY_ENABLED=true

# 缓存配置
CACHE_TTL=3600  # 缓存时间，单位秒

# 安全配置
CORS_ORIGIN=*  # CORS 允许的源
RATE_LIMIT_MAX=100  # 速率限制最大值
RATE_LIMIT_WINDOW=60000  # 速率限制窗口，单位毫秒

# 监控配置
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30  # 健康检查间隔，单位秒
LOG_LEVEL=info  # 日志级别：error, warn, info, debug
LOG_FORMAT=json  # 日志格式

# 生产环境标识
NODE_ENV=production
```

### D1 数据库配置

确保在 wrangler.toml 中正确配置了 D1 数据库：

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "katelyatv"
database_id = "your-actual-database-id"
```

## 本地开发

### 安装依赖

```bash
npm install
```

### 环境变量配置

在本地开发时，创建一个 `.env` 文件，配置以下环境变量：

```
# 数据库配置（本地开发建议使用 localStorage）
NEXT_PUBLIC_STORAGE_TYPE=localstorage

# 站点访问密码（本地开发也建议配置）

# 站点访问密码（本地开发也建议配置）
PASSWORD=dev_password_123456

# 站点基本信息
NEXT_PUBLIC_SITE_NAME=KatelyaTV-Dev
NEXT_PUBLIC_SITE_DESCRIPTION=高性能影视播放平台（开发环境）

# 开发环境标识
NODE_ENV=development
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 重要注意事项

### 环境变量安全
1. `PASSWORD` 是敏感信息，请不要硬编码在代码中或提交到版本控制系统
2. 生产环境中务必修改默认密码 `katelyatv2024`，使用强密码

### 部署注意事项
1. 确保所有 API 路由都配置了 Edge Runtime
2. 部署前验证 wrangler.toml 配置正确，特别是 D1 数据库配置
3. 确保所有必须的环境变量都已正确设置
4. 定期更新依赖以确保安全性

### 性能优化
1. 生产环境中建议启用图片代理功能以提高加载速度
2. 根据实际使用情况调整缓存时间和速率限制参数

## 许可证

MIT