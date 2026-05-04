# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (Next.js on port 3000)
npm run build            # Production build (standandalone output)
npm run lint             # ESLint

# Database
npm run db:migrate       # Create & apply a new Prisma migration
npm run db:push          # Push schema changes without migration (dev only)
npm run db:seed          # Seed built-in templates (prisma/seed.ts)
npm run db:studio        # Open Prisma Studio GUI
npm run db:generate      # Regenerate Prisma Client

# PDF export dependency (one-time)
npx playwright install chromium
```

## Architecture

CareerFlow is a resume management platform with AI Agent integration. Next.js 15 App Router + TypeScript + PostgreSQL (Prisma) + JWT auth.

### Two API layers

- **Internal API** (`app/api/`): Standard CRUD for the web UI. Cookie-based JWT auth via `lib/auth.ts`.
- **Agent API** (`app/api/agent/`): 25 REST endpoints for external AI agents. Bearer token auth via API keys with scoped permissions (`lib/agent-auth.ts`, `lib/permissions.ts`).

### Patch system (key innovation)

Agents never directly modify resumes. Instead they create JSON Patch operations (RFC 6902) stored as `ResumePatch` records with status `pending_review`. Patches go through: `pending_review` → `applied` | `rejected` | `expired`. Applying a patch auto-creates a `ResumeVersion` snapshot. The engine is in `lib/patches.ts`.

### Template & rendering pipeline

- 3 built-in templates seeded on `db:seed`: `clean-cn`, `tech-cn`, `ats-en`
- Users can create custom templates with HTML/CSS
- `lib/resume-renderer.ts` renders resume JSON → HTML using template + variable substitution (`{{variable}}` syntax via `lib/template-variables.ts`)
- `lib/pdf.ts` uses Playwright headless browser to convert rendered HTML → PDF

### Internationalization

`next-intl` with locale-based routing (`/en/...`, `/zh/...`). Config in `i18n/routing.ts`, translations in `messages/en.json` and `messages/zh.json`. Locale middleware in `middleware.ts` also handles JWT auth checks and protected route redirects.

### Auth flow

- **Users**: JWT signed in `lib/auth.ts`, stored in `careerflow_token` httpOnly cookie (7-day expiry). Edge-compatible verification in `middleware.ts` using Web Crypto API.
- **Agents**: API keys generated with `cf_live_` prefix (`lib/api-key.ts`), stored as SHA-256 hashes. Scoped permissions with safe defaults and dangerous scopes requiring explicit grant.

### MCP server

`mcp/server.ts` exposes 11 tools that call the Agent API. Started via `npx tsx mcp/server.ts` with `CAREERFLOW_API_URL` and `CAREERFLOW_API_KEY` env vars.

### Database

8 Prisma models: `User`, `Resume`, `ResumeTemplate`, `ResumeExport`, `ApiKey`, `ResumePatch`, `ResumeVersion`, `AgentAuditLog`. All models use `@@map` for snake_case table names. Resume content stored as JSON in `contentJson` field. Schema validated by `lib/resume-schema.ts` (Zod schemas + TypeScript types).

## Key conventions

- Route groups: `app/[locale]/(protected)/` for authenticated pages, `app/[locale]/(auth)/` for login/register
- Data isolation: every query filters by `userId` — users can only access their own data
- All agent operations create `AgentAuditLog` entries via `lib/audit.ts`
- API route handlers use `NextRequest`/`NextResponse` with manual JWT or API key verification (no NextAuth)
- `lib/prisma.ts` exports a singleton Prisma client — always import from here, never create new instances
- Forms use React Hook Form + Zod resolvers (`@hookform/resolvers`)

## Environment

Required: `DATABASE_URL`, `JWT_SECRET`, `APP_URL`, `API_KEY_SECRET`. Optional: `STORAGE_DIR` (default `./storage`). See `.env.example`.

## 强制要求
回答必须使用简体中文

## 测试账号
邮箱：demo@careerflow.com
密码：Demo1234!
