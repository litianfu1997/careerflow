# CareerFlow 代理指导

**项目**: Resume 管理平台 + AI Agent 集成  
**技术栈**: Next.js 15 | TypeScript | PostgreSQL (Prisma) | JWT 认证  
**指导版本**: 基于 CLAUDE.md

## 快速开始

```bash
npm run dev              # 启动开发服务器（Next.js 端口 3000）
npm run build            # 生产构建
npm run db:push          # 推送 schema 变更（开发环境）
npm run db:migrate       # 创建并应用 Prisma 迁移
npm run db:seed          # 种子内置模板
npx playwright install chromium  # 一次性安装 PDF 依赖
```

## 架构概览

### 核心创新：Patch 系统

**Agent 永不直接修改 Resume**。相反，它们创建 JSON Patch 操作（RFC 6902），存储为 `ResumePatch` 记录：

```
pending_review → applied | rejected | expired
```

- 应用 Patch 自动创建 `ResumeVersion` 快照
- 引擎位于 `lib/patches.ts`
- 所有 Agent 操作通过 `lib/audit.ts` 创建 `AgentAuditLog` 条目

### 两层 API

| 层级 | 用途 | 认证 | 端点 |
|-----|------|------|------|
| **内部 API** | Web UI CRUD | Cookie JWT | `app/api/` |
| **Agent API** | 外部 Agent REST | Bearer Token（API Key） | `app/api/agent/` |

Agent API 有 25 个端点，权限通过 `lib/agent-auth.ts` 和 `lib/permissions.ts` 管理。

### 数据库模型（8 个）

```
User → Resume ↔ ResumeTemplate
       ↓
    ResumePatch → ResumeVersion
    AgentAuditLog
    ApiKey
    ResumeExport
```

所有模型使用 `@@map` 映射到 snake_case 表名。Resume 内容存储为 `contentJson` JSON 字段。

### 渲染管道

1. **模板系统**: 3 个内置模板（`clean-cn`, `tech-cn`, `ats-en`）
2. **渲染**: `lib/resume-renderer.ts` → HTML（变量替换 `{{variable}}`）
3. **导出**: `lib/pdf.ts` 用 Playwright 转换为 PDF

### MCP 服务器

`mcp/server.ts` 暴露 11 个工具，调用 Agent API。启动方式：
```bash
npx tsx mcp/server.ts
# 需要环境变量: CAREERFLOW_API_URL, CAREERFLOW_API_KEY
```

## 关键约定

### 路由与认证

- **受保护页面**: `app/[locale]/(protected)/` - 需要认证
- **认证页面**: `app/[locale]/(auth)/` - 登录/注册
- **中间件**: `middleware.ts` 处理 JWT 验证和国际化

### 数据隔离

**规则**: 每个查询必须过滤 `userId` — 用户只能访问自己的数据

```typescript
// ✅ 正确
const resumes = await prisma.resume.findMany({
  where: { userId: session.userId }
});

// ❌ 错误
const resumes = await prisma.resume.findMany(); // 安全漏洞！
```

### Prisma 客户端

始终从 `lib/prisma.ts` 导入单例实例：
```typescript
import { prisma } from '@/lib/prisma';
```

### 认证

- **用户**: JWT 在 `lib/auth.ts` 签名，存储在 `careerflow_token` httpOnly cookie（7 天过期）
- **Agent**: API Key 使用 `cf_live_` 前缀，存储 SHA-256 哈希，权限有安全默认值

### 国际化

使用 `next-intl`，配置在 `i18n/routing.ts`：
- 翻译文件: `messages/en.json`, `messages/zh.json`
- 路由: `/en/...`, `/zh/...`

### Schema 验证

所有 Resume 内容通过 `lib/resume-schema.ts` 验证（Zod + TypeScript 类型）。

## 常见任务

### 添加新的 API 端点

1. **内部 API** (`app/api/[locale]/...`): 使用 `NextRequest`/`NextResponse`
2. **Agent API** (`app/api/agent/...`): 使用 `lib/agent-auth.ts` 验证 Bearer token
3. **两者**: 验证数据隔离 + 创建审计日志

### 修改 Resume 数据结构

1. 更新 `lib/resume-schema.ts` 中的 Zod schema
2. 运行 `npm run db:migrate` 创建迁移（如需数据库变更）
3. 如果 Agent 需要支持此字段，在 Patch 系统中添加验证

### 创建新的 Patch 操作

Patch 存储在 `ResumePatch.operationsJson` 中，格式：
```json
{
  "op": "replace|add|remove",
  "path": "/sections/0/title",
  "value": "新标题"
}
```

通过 `lib/patches.ts` 中的 `applyPatch()` 应用。

## 环境配置

**必需**:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
APP_URL=http://localhost:3000
API_KEY_SECRET=your-api-secret
```

**可选**:
```
STORAGE_DIR=./storage  # 默认值
```

见 `.env.example`

## 测试账号

```
邮箱: demo@careerflow.com
密码: Demo1234!
```

## 潜在陷阱

⚠️ **确保每个数据库查询都包含 `userId` 过滤**  
⚠️ **Agent 修改总是创建 Patch，不是直接更新**  
⚠️ **API Key 存储为哈希，无法检索 — 用户只能保存一次**  
⚠️ **Resume 导出是异步的 — 轮询 `ResumeExport.status`**

## 相关文档

- `CLAUDE.md` - 详细技术参考
- `prisma/schema.prisma` - 完整数据库 schema
- `lib/resume-schema.ts` - Resume 数据结构定义
