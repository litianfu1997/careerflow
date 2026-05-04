# CareerFlow

Resume management platform with AI Agent integration, built with Next.js App Router.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + bcrypt, httpOnly cookie, 7-day expiry
- **UI**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **PDF**: Playwright headless browser
- **Export**: JSON / Markdown / PDF
- **Agent API**: REST + Bearer API Key auth
- **MCP**: TypeScript MCP Server (calls REST API)
- **Deploy**: Docker Compose (app + postgres)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)
- Playwright browsers (for PDF export)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Setup database
npx prisma migrate dev --name init

# 4. Seed templates
npm run db:seed

# 5. Install Playwright browsers (for PDF export)
npx playwright install chromium

# 6. Start dev server
npm run dev
```

### Docker

```bash
docker compose up -d
npx prisma migrate deploy
npm run db:seed
```

## Project Structure

```
app/
├── login/                   # Login page
├── register/                # Register page
├── (protected)/
│   ├── dashboard/           # Dashboard
│   ├── resumes/             # Resume CRUD, editor, preview, patches
│   ├── settings/agent/      # API Key management
│   └── admin/               # Admin dashboard
├── api/
│   ├── auth/                # Register, login, logout, me
│   ├── resumes/             # CRUD + duplicate + template + export + import + patches
│   ├── templates/           # Template list/detail
│   ├── render-preview/      # Preview rendering
│   ├── settings/api-keys/   # API Key management
│   ├── agent/               # Agent REST API (25 endpoints)
│   └── admin/               # Admin API
lib/
├── auth.ts                  # JWT sign/verify, cookie, bcrypt
├── prisma.ts                # Prisma client singleton
├── api-key.ts               # Key generation, hash, validation
├── permissions.ts           # Scope validation
├── agent-auth.ts            # Agent authentication middleware
├── audit.ts                 # Audit log
├── patches.ts               # Patch application engine
├── resume-schema.ts         # Zod schema + TypeScript types
├── resume-renderer.ts       # HTML rendering engine + 3 templates
├── markdown.ts              # Markdown renderer
├── pdf.ts                   # Playwright PDF generation
└── utils.ts                 # cn() utility
prisma/
└── schema.prisma            # 8 models
mcp/
└── server.ts                # MCP Server
```

## Built-in Templates

| Name | Description |
|------|-------------|
| `clean-cn` | Chinese clean single-column |
| `tech-cn` | Chinese tech-focused (blue accent) |
| `ats-en` | English ATS-friendly (minimal) |

## Agent API

### Authentication

All Agent API endpoints use Bearer token authentication:

```bash
curl -H "Authorization: Bearer cf_live_xxx" http://localhost:3000/api/agent/me
```

### Scopes

| Scope | Description | Default |
|-------|-------------|---------|
| `resume:read` | Read resumes | Yes |
| `resume:write_patch` | Submit patches | Yes |
| `resume:export` | Export resumes | Yes |
| `resume:version` | View version history | Yes |
| `resume:apply_patch` | Apply patches directly | No (dangerous) |
| `resume:delete` | Delete resumes | No (dangerous) |
| `profile:write` | Modify user profile | No (dangerous) |

### Endpoints

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| GET | `/api/agent/me` | - | Get identity |
| GET | `/api/agent/resumes` | `resume:read` | List resumes |
| GET | `/api/agent/resumes/:id` | `resume:read` | Get resume |
| GET | `/api/agent/resumes/:id/sections` | `resume:read` | Get all sections |
| GET | `/api/agent/resumes/:id/sections/:key` | `resume:read` | Get one section |
| POST | `/api/agent/resumes/:id/patches` | `resume:write_patch` | Create patch |
| GET | `/api/agent/resumes/:id/patches` | `resume:read` | List patches |
| GET | `/api/agent/resumes/:id/patches/:pid` | `resume:read` | Get patch |
| POST | `/api/agent/resumes/:id/patches/:pid/apply` | `resume:apply_patch` | Apply patch |
| POST | `/api/agent/resumes/:id/patches/:pid/reject` | `resume:write_patch` | Reject patch |
| POST | `/api/agent/resumes/:id/clone` | `resume:read` | Clone resume |
| GET | `/api/agent/resumes/:id/versions` | `resume:version` | List versions |
| POST | `/api/agent/resumes/:id/versions/:vid/restore` | `resume:apply_patch` | Restore version |
| GET | `/api/agent/resumes/:id/export/markdown` | `resume:export` | Export Markdown |
| GET | `/api/agent/resumes/:id/export/json` | `resume:export` | Export JSON |
| POST | `/api/agent/resumes/:id/export/pdf` | `resume:export` | Export PDF |

### Patch Format

Patches use JSON Pointer operations:

```json
[
  { "op": "replace", "path": "/basic/name", "value": "New Name" },
  { "op": "add", "path": "/skills/-", "value": { "id": "x", "name": "DevOps", "skills": ["Docker"] } },
  { "op": "remove", "path": "/education/0" }
]
```

### Patch Lifecycle

`pending_review` → `applied` | `rejected` | `expired`

## MCP Server

The MCP server allows AI assistants to interact with resumes through the Agent API.

### Configuration

Add to your MCP client config:

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

### Available Tools

- `list_resumes` - List all resumes
- `get_resume` - Get full resume details
- `get_resume_sections` - Get all sections
- `get_resume_section` - Get a specific section
- `propose_resume_patch` - Propose a patch
- `apply_resume_patch` - Apply a pending patch
- `list_patches` - List patches
- `clone_resume` - Clone a resume
- `list_versions` - View version history
- `export_resume_markdown` - Export as Markdown
- `export_resume_json` - Export as JSON

## Security

1. Users can only access their own data
2. API Keys stored as SHA-256 hashes
3. API Key plaintext shown only once
4. Agent cannot directly overwrite resumes (uses patch system)
5. Patch application requires version save
6. All Agent operations logged in audit trail
7. Dangerous scopes (`resume:apply_patch`, `resume:delete`, `profile:write`) not granted by default
8. PDF export isolated per-user
9. JSON import validated with Zod schema

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `APP_URL` | Yes | Public app URL |
| `API_KEY_SECRET` | Yes | Secret for API key hashing |
| `STORAGE_DIR` | No | File storage directory (default: `./storage`) |

## License

MIT
