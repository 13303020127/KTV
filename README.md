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

在 Cloudflare Pages 设置中配置以下环境变量：

```
NEXT_PUBLIC_STORAGE_TYPE=d1
NEXT_PUBLIC_SITE_NAME=KatelyaTV
NEXT_PUBLIC_SITE_DESCRIPTION=高性能影视播放平台
NEXTAUTH_SECRET=your_nextauth_secret_here_32_chars_min
NEXTAUTH_URL=https://your-domain.pages.dev
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

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 注意事项

1. 确保所有 API 路由都配置了 Edge Runtime
2. 部署前验证 wrangler.toml 配置正确
3. 确保环境变量设置完整
4. 定期更新依赖以确保安全性

## 许可证

MIT