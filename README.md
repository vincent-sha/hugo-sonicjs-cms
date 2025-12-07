# 我的 SonicJS 应用

一个使用 [SonicJS](https://sonicjs.com) 构建、运行在 Cloudflare 边缘平台上的现代无头 CMS（Headless CMS）。

## 快速开始

### 前置条件

- Node.js 18 或更高版本
- 一个 Cloudflare 账户（免费套餐就能很好地使用）
- Wrangler CLI（随依赖项一起安装）

### 安装

1. **安装依赖：**
   ```bash
   npm install
   ```

2. **创建 D1 数据库：**
   ```bash
   npx wrangler d1 create my-sonicjs-db
   ```

   从输出中复制 `database_id` 并在 `wrangler.toml` 中更新它。

3. **创建 R2 存储桶：**
   ```bash
   npx wrangler r2 bucket create my-sonicjs-media
   ```

4. **运行迁移：**
   ```bash
   npm run db:migrate:local
   ```

5. **启动开发服务器：**
   ```bash
   npm run dev
   ```

6. **打开浏览器：**
   访问 `http://localhost:8787/admin` 以进入管理界面。

   使用在项目设置期间提供的管理员凭据登录。

## 项目结构

```
my-sonicjs-app/
├── src/
│   ├── collections/          # 内容类型定义
│   │   └── blog-posts.collection.ts
│   └── index.ts             # 应用程序入口
├── wrangler.toml            # Cloudflare Workers 配置
├── package.json
└── tsconfig.json
```

## 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run deploy` - 部署到 Cloudflare
- `npm run db:migrate` - 在生产数据库上运行迁移
- `npm run db:migrate:local` - 在本地运行迁移
- `npm run type-check` - 检查 TypeScript 类型
- `npm run test` - 运行测试
 - `npm run seed` - 创建默认管理员（seed-admin）
 - `npm run reset:admin` - 重置指定用户密码（请参考下方说明）

## 创建集合（Collections）

集合用于定义你的内容类型。请在 `src/collections/` 中新建一个文件：

```typescript
// src/collections/products.collection.ts
import type { CollectionConfig } from '@sonicjs-cms/core'

export default {
  name: 'products',
  label: 'Products',
  fields: {
    name: { type: 'text', required: true },
    price: { type: 'number', required: true },
    description: { type: 'markdown' }
  }
} satisfies CollectionConfig
```

## API 访问

你的集合会自动通过 REST API 暴露：

- `GET /api/content/blog-posts` - 列出所有博客文章
- `GET /api/content/blog-posts/:id` - 获取单条文章
- `POST /api/content/blog-posts` - 创建文章（需要认证）
- `PUT /api/content/blog-posts/:id` - 更新文章（需要认证）
- `DELETE /api/content/blog-posts/:id` - 删除文章（需要认证）

## 部署

1. **登录 Cloudflare：**
   ```bash
   npx wrangler login
   ```

2. **部署你的应用：**
   ```bash
   npm run deploy
   ```

3. **在生产环境运行迁移：**
   ```bash
   npm run db:migrate
   ```

## 文档

- [SonicJS 文档](https://sonicjs.com)
- [集合配置文档](https://sonicjs.com/collections)
- [插件开发](https://sonicjs.com/plugins)
- [API 参考](https://sonicjs.com/api)

## 支持

- [GitHub Issues](https://github.com/lane711/sonicjs/issues)
- [Discord 社区](https://discord.gg/8bMy6bv3sZ)
- [文档](https://sonicjs.com)

## 许可证

MIT

## 管理员密码重置（管理员工具）

若你需要重置管理员或任意用户的密码，可使用仓库内的脚本 `reset-admin-password.ts`：

1) 在本地运行 `wrangler dev`，确保 D1 绑定与 `wrangler.toml` 已正确配置。

2) 通过 npm 脚本运行重置脚本：
```bash
# 示例：将用户的密码重置为 `NewP@ssw0rd`（在实际环境中请使用更安全的密码）
npm run reset:admin -- --email vincentshajing@gmail.com --password 'NewP@ssw0rd'
```

3) 此脚本会使用和 `seed-admin.ts` 一致的哈希逻辑（SHA-256，password + salt-change-in-production）来更新 `users.passwordHash` 字段。

注意事项：
- `salt-change-in-production` 是示例盐；在生产环境请替换为更安全的盐与凭证管理方式。
- 请确保 `wrangler.toml` 中 `DB` 绑定已经正确配置；脚本通过 `getPlatformProxy()` 访问本地或 dev 的 D1 实例。
- 如果用户不存在，脚本会返回错误并退出；若你希望添加用户，请使用 `npm run seed` 或在数据库中手动插入用户记录。

