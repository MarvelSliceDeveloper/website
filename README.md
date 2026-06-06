# LMS Portal

Unified Learning Management System monorepo with an Express API and a Next.js web app.

## Monorepo layout
- apps/api - Express API + Prisma
- apps/web - Next.js frontend
- packages/* - shared config, types, utilities

## Prerequisites
- Node.js >= 20
- pnpm >= 8
- Docker Desktop (for Postgres + Redis)
- Git

## Setup (Windows PowerShell)
All commands are run from the repo root.

```powershell
git clone <YOUR_REPO_URL>
Set-Location LMS
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
Copy-Item .env.example .env
# Edit .env and set DATABASE_URL and other secrets
# Start Postgres + Redis
docker-compose up -d
# Rebuild the Prisma schema from `schema.prisma` and seed data
pnpm prisma:reset
# Start API + Web dev servers
pnpm dev
```

## Setup (macOS/Linux)
All commands are run from the repo root.

```bash
git clone <YOUR_REPO_URL>
cd LMS
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
cp .env.example .env
# Edit .env and set DATABASE_URL and other secrets
# Start Postgres + Redis
docker-compose up -d
# Rebuild the Prisma schema from `schema.prisma` and seed data
pnpm prisma:reset
# Start API + Web dev servers
pnpm dev
```

## Environment configuration
Create a root .env file from .env.example and fill in your values.

Required for local dev:
- DATABASE_URL (Postgres connection string)
- REDIS_URL
- JWT_SECRET (min 32 chars)
- TOKEN_ENCRYPTION_KEY (32 chars)
- API_URL (http://localhost:4000)
- WEB_URL (http://localhost:3000)

Optional but needed for those features:
- Microsoft OAuth (MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID, MS_REDIRECT_URI)
- Razorpay (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET)
- Sentry (SENTRY_DSN)

Frontend env (optional): create apps/web/.env.local

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_USE_MOCK_DATA=false
```

## URLs
- Web app: http://localhost:3000
- API: http://localhost:4000
- API health check: http://localhost:4000/health
- Postgres (Docker): localhost:5433
- Redis (Docker): localhost:6379

## Seed logins
- Admin: admin@lms.local / admin123
- Instructor: instructor@lms.local / instructor123
- Student: student@lms.local / student123

## Useful commands
```bash
pnpm dev
pnpm dev:web
pnpm dev:api
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:all
pnpm prisma:migrate
pnpm prisma:seed
pnpm prisma:studio
```

## Troubleshooting
- Postgres port mismatch: docker-compose maps host 5433 -> container 5432. Make sure DATABASE_URL uses port 5433 when using the provided compose file.
- Prisma env loading: if prisma reports missing DATABASE_URL, ensure the .env file is in the repo root and the variable is set. If needed, copy .env into apps/api/ as well.
- This repo currently uses `pnpm prisma:reset` instead of `pnpm prisma:migrate` because the checked-in migration SQL files are not present.
