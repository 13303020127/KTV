# Cloudflare Pages 部署指南

本指南详细介绍了如何将 KatelyaTV 部署到 Cloudflare Pages 平台。

## 前提条件

- Cloudflare 账户
- GitHub 账户
- 基本的命令行操作知识

## 步骤 1: Fork 仓库

1. 访问 GitHub 上的项目仓库
2. 点击右上角的 "Fork" 按钮，将仓库复制到你的 GitHub 账户

## 步骤 2: 创建 Cloudflare D1 数据库

1. 登录 Cloudflare 控制台
2. 导航到 "D1" 服务
3. 点击 "创建数据库"
4. 为数据库命名（例如：`katelyatv`）
5. 记住数据库 ID，稍后将在配置中使用

## 步骤 3: 初始化数据库

1. 使用 Cloudflare CLI 初始化数据库：
   ```bash
   wrangler d1 execute katelyatv --file=scripts/d1-init.sql
   ```

## 步骤 4: 配置 Cloudflare Pages

1. 登录 Cloudflare 控制台
2. 导航到 "Pages" 服务
3. 点击 "连接到 Git"
4. 选择你的 GitHub 账户和项目仓库
5. 点击 "开始设置"

### 构建配置

- **项目名称**: 输入你的项目名称
- **构建命令**: `npm install --frozen-lockfile && npm run pages:build`
- **构建输出目录**: `.next`
- **根目录**: `/`

### 环境变量设置

在 "环境变量" 部分添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| NEXT_PUBLIC_STORAGE_TYPE | d1 | 所有环境 |
| NEXT_PUBLIC_SITE_NAME | KatelyaTV | 所有环境 |
| NEXT_PUBLIC_SITE_DESCRIPTION | 高性能影视播放平台 | 所有环境 |

| NODE_ENV | production | 生产环境 |

## 步骤 5: 配置 wrangler.toml

确保你的 wrangler.toml 文件包含以下基本配置：

```toml
name = "katelyatv"
compatibility_date = "2025-09-06"
compatibility_flags = ["nodejs_compat"]

# Cloudflare Pages 配置
pages_build_output_dir = ".next"

[[d1_databases]]
binding = "DB"
database_name = "katelyatv"
database_id = "your-actual-database-id"
```

请将 `your-actual-database-id` 替换为你在步骤 2 中创建的数据库 ID。

### 环境变量配置说明

所有环境变量建议在 Cloudflare Pages 控制台的环境变量设置中配置，而不是在 wrangler.toml 中硬编码。

## 步骤 6: 部署项目

1. 点击 "保存并部署"
2. Cloudflare Pages 将开始构建和部署你的项目
3. 部署过程中会自动运行 `pages:build` 脚本，该脚本包含了 Next.js 构建和 Cloudflare 适配器处理
4. 部署完成后，你可以在 "自定义域" 选项中设置你的自定义域名

## 步骤 7: 验证部署

部署完成后，访问以下端点验证系统是否正常运行：

- 首页: `https://your-domain.pages.dev/`
- 管理配置测试: `https://your-domain.pages.dev/api/test/admin-config`

## 常见问题排查

### 部署失败

1. 检查构建日志，查找具体错误信息
2. 确保所有环境变量设置正确
3. 验证 D1 数据库 ID 是否正确配置
4. 确认 package.json 中的 pages:build 脚本配置正确: `npm run build && npx @cloudflare/next-on-pages`

### API 路由错误

确保所有 API 路由都配置了 Edge Runtime：

```typescript
// 在每个 API 路由文件顶部添加
export const runtime = 'edge';
```

### 数据库连接问题

1. 确认 D1 数据库已正确创建
2. 验证数据库 ID 在 wrangler.toml 中配置正确
3. 检查数据库初始化脚本是否执行成功

### 缓存文件大小限制问题

Cloudflare Pages 对单个文件大小有限制（25 MiB）。如果遇到大型缓存文件问题：

1. 项目已配置自动清理 `.next/cache` 目录
2. 如果仍有问题，可以尝试手动清理更多缓存目录

### Next.js 适配器问题

1. 确保使用正确的适配器命令格式
2. 检查 package.json 中是否安装了 @cloudflare/next-on-pages 依赖

## 后续维护

- 定期更新依赖版本
- 监控部署日志和错误信息
- 根据需要调整环境变量和配置

## 联系与支持

如有任何问题，请参考项目文档或提交 Issue。