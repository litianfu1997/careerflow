# CareerFlow

简历管理系统，集成了AI Agent功能，基于Next.js App Router构建。

## 技术栈

- **框架**: Next.js 15 (App Router, TypeScript)
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT + bcrypt, httpOnly cookie, 7天过期
- **UI**: Tailwind CSS
- **表单**: React Hook Form + Zod
- **PDF**: Playwright 无头浏览器
- **导出**: JSON / Markdown / PDF
- **Agent API**: REST + Bearer API Key 认证
- **MCP**: TypeScript MCP Server (调用REST API)
- **部署**: Docker Compose (应用 + PostgreSQL)
- **国际化**: next-intl (中文/英文)

## 快速开始

### 前置要求

- Node.js 20+
- PostgreSQL 16+ (或 Docker)
- Playwright 浏览器 (PDF导出)

### 安装

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件设置你的值

# 3. 设置数据库
npx prisma migrate dev --name init

# 4. 种子模板数据
npm run db:seed

# 5. 安装 Playwright 浏览器 (PDF导出)
npx playwright install chromium

# 6. 启动开发服务器
npm run dev
```

### Docker

```bash
docker compose up -d
npx prisma migrate deploy
npm run db:seed
```

## 项目架构

CareerFlow 是一个简历管理平台，具有AI Agent集成。Next.js 15 App Router + TypeScript + PostgreSQL (Prisma) + JWT认证。

### 两个API层

- **内部API** (`app/api/`): 标准的Web UI CRUD。Cookie-based JWT认证通过 `lib/auth.ts`。
- **Agent API** (`app/api/agent/`): 25个REST端点供外部AI agents使用。Bearer token认证通过API密钥，具有范围权限 (`lib/agent-auth.ts`, `lib/permissions.ts`)。

### Patch系统 (关键创新)

Agents不能直接修改简历，而是创建JSON Patch操作 (RFC 6902) 存储为 `ResumePatch` 记录，状态为 `pending_review`。Patches经过: `pending_review` → `applied` | `rejected` | `expired`。应用patch会自动创建 `ResumeVersion` 快照。引擎在 `lib/patches.ts`。

### 模板和渲染管道

- 3个内置模板通过 `db:seed` 种子: `clean-cn`, `tech-cn`, `ats-en`
- 用户可以创建自定义模板使用HTML/CSS
- `lib/resume-renderer.ts` 使用模板 + 变量替换渲染简历JSON → HTML (`{{variable}}` 语法通过 `lib/template-variables.ts`)
- `lib/pdf.ts` 使用Playwright无头浏览器转换渲染HTML → PDF

### 国际化

`next-intl` 使用locale-based路由 (`/en/...`, `/zh/...`)。配置在 `i18n/routing.ts`，翻译在 `messages/en.json` 和 `messages/zh.json`。中间件在 `middleware.ts` 也处理JWT认证检查和受保护路由重定向。

## 项目结构

```
app/
├── [locale]/
│   ├── layout.tsx           # 国际化布局
│   ├── page.tsx             # 首页
│   ├── login/               # 登录页面
│   ├── register/            # 注册页面
│   └── (protected)/
│       ├── layout.tsx       # 受保护路由布局
│       ├── dashboard/       # 仪表板
│       ├── resumes/         # 简历CRUD、编辑器、预览、补丁
│       ├── settings/agent/  # API密钥管理
│       ├── templates/       # 模板管理
│       └── admin/           # 管理员仪表板
├── api/
│   ├── auth/                # 注册、登录、登出、me
│   ├── resumes/             # CRUD + 复制 + 模板 + 导出 + 导入 + 补丁
│   ├── templates/           # 模板列表/详情
│   ├── render-preview/      # 预览渲染
│   ├── settings/api-keys/   # API密钥管理
│   ├── agent/               # Agent REST API (25个端点)
│   └── admin/               # 管理员API
lib/
├── auth.ts                  # JWT签名/验证、cookie、bcrypt
├── prisma.ts                # Prisma客户端单例
├── api-key.ts               # 密钥生成、哈希、验证
├── permissions.ts           # 范围验证
├── agent-auth.ts            # Agent认证中间件
├── audit.ts                 # 审计日志
├── patches.ts               # 补丁应用引擎
├── resume-schema.ts         # Zod模式 + TypeScript类型
├── resume-renderer.ts       # HTML渲染引擎 + 3个模板
├── markdown.ts              # Markdown渲染器
├── pdf.ts                   # Playwright PDF生成
├── template-variables.ts    # 模板变量替换
└── utils.ts                 # cn() 工具函数
prisma/
├── schema.prisma            # 8个模型
└── seed.ts                  # 种子数据
mcp/
└── server.ts                # MCP服务器
components/
├── ui/                      # UI组件 (shadcn/ui)
├── loading-overlay.tsx      # 加载覆盖层
├── loading-page.tsx         # 加载页面
├── loading-spinner.tsx      # 加载旋转器
└── ...
```

## 内置模板

| 名称 | 描述 |
|------|------|
| `clean-cn` | 中文简洁单列 |
| `tech-cn` | 中文技术导向 (蓝色强调) |
| `ats-en` | 英文ATS友好 (极简)
| `ats-en` | English ATS-friendly (minimal) |

## Agent API

### 认证

所有Agent API端点使用Bearer token认证:

```bash
curl -H "Authorization: Bearer cf_live_xxx" http://localhost:3000/api/agent/me
```

### 权限范围

| 范围 | 描述 | 默认 |
|------|------|------|
| `resume:read` | 读取简历 | 是 |
| `resume:write_patch` | 提交补丁 | 是 |
| `resume:export` | 导出简历 | 是 |
| `resume:version` | 查看版本历史 | 是 |
| `resume:apply_patch` | 直接应用补丁 | 否 (危险) |
| `resume:delete` | 删除简历 | 否 (危险) |
| `profile:write` | 修改用户资料 | 否 (危险) |

### 端点

| 方法 | 路径 | 范围 | 描述 |
|------|------|------|------|
| GET | `/api/agent/me` | - | 获取身份 |
| GET | `/api/agent/resumes` | `resume:read` | 列出简历 |
| GET | `/api/agent/resumes/:id` | `resume:read` | 获取简历 |
| GET | `/api/agent/resumes/:id/sections` | `resume:read` | 获取所有部分 |
| GET | `/api/agent/resumes/:id/sections/:key` | `resume:read` | 获取一个部分 |
| POST | `/api/agent/resumes/:id/patches` | `resume:write_patch` | 创建补丁 |
| GET | `/api/agent/resumes/:id/patches` | `resume:read` | 列出补丁 |
| GET | `/api/agent/resumes/:id/patches/:pid` | `resume:read` | 获取补丁 |
| POST | `/api/agent/resumes/:id/patches/:pid/apply` | `resume:apply_patch` | 应用补丁 |
| POST | `/api/agent/resumes/:id/patches/:pid/reject` | `resume:write_patch` | 拒绝补丁 |
| POST | `/api/agent/resumes/:id/clone` | `resume:read` | 克隆简历 |
| GET | `/api/agent/resumes/:id/versions` | `resume:version` | 列出版本 |
| POST | `/api/agent/resumes/:id/versions/:vid/restore` | `resume:apply_patch` | 恢复版本 |
| GET | `/api/agent/resumes/:id/export/markdown` | `resume:export` | 导出Markdown |
| GET | `/api/agent/resumes/:id/export/json` | `resume:export` | 导出JSON |
| POST | `/api/agent/resumes/:id/export/pdf` | `resume:export` | 导出PDF |

### 补丁格式

补丁使用JSON Pointer操作:

```json
[
  { "op": "replace", "path": "/basic/name", "value": "新名字" },
  { "op": "add", "path": "/skills/-", "value": { "id": "x", "name": "DevOps", "skills": ["Docker"] } },
  { "op": "remove", "path": "/education/0" }
]
```

### 补丁生命周期

`pending_review` → `applied` | `rejected` | `expired`

## MCP服务器

MCP服务器允许AI助手通过Agent API与简历交互。

### 配置

添加到你的MCP客户端配置:

```json
{
  "mcpServers": {
    "careerflow": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "env": {
        "CAREERFLOW_API_URL": "http://localhost:3000",
        "CAREERFLOW_API_KEY": "cf_live_your_key_here"
      }
    }
  }
}
```

### 可用工具

- `list_resumes` - 列出所有简历
- `get_resume` - 获取完整简历详情
- `get_resume_sections` - 获取所有部分
- `get_resume_section` - 获取特定部分
- `propose_resume_patch` - 提出补丁
- `apply_resume_patch` - 应用待处理补丁
- `list_patches` - 列出补丁
- `clone_resume` - 克隆简历
- `list_versions` - 查看版本历史
- `export_resume_markdown` - 导出为Markdown
- `export_resume_json` - 导出为JSON

## 安全性

1. 用户只能访问自己的数据
2. API密钥存储为SHA-256哈希
3. API密钥明文仅显示一次
4. Agent不能直接覆盖简历 (使用补丁系统)
5. 补丁应用需要保存版本
6. 所有Agent操作记录在审计日志中
7. 危险范围 (`resume:apply_patch`, `resume:delete`, `profile:write`) 默认不授予
8. PDF导出按用户隔离
9. JSON导入使用Zod模式验证

## 环境变量

| 变量 | 必需 | 描述 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL连接字符串 |
| `JWT_SECRET` | 是 | JWT签名密钥 |
| `APP_URL` | 是 | 公共应用URL |
| `API_KEY_SECRET` | 是 | API密钥哈希密钥 |
| `STORAGE_DIR` | 否 | 文件存储目录 (默认: `./storage`) |

## 测试账号

- **邮箱**: demo@careerflow.com
- **密码**: Demo1234!

## 许可证

MIT
