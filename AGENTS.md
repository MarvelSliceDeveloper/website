# LMS Portal - Agent Instructions

## Project Overview
Monorepo with Express API (`apps/api`) + Next.js Web (`apps/web`) + shared packages (`packages/*`). Uses pnpm + Turborepo.

## Commands (run from repo root)

### Development
```bash
pnpm install                    # Install deps
docker-compose up -d            # Start Postgres (5433) + Redis (6379)
pnpm prisma:reset               # Reset DB + seed (uses prisma db push + seed)
pnpm dev                        # Start API (4000) + Web (3000) via Turbo
```

### Testing
```bash
pnpm test                       # Unit tests (vitest) via Turbo
pnpm test:integration           # Integration tests
pnpm test:e2e                   # E2E tests (Playwright)
pnpm test:all                   # All test suites
```

### Code Quality
```bash
pnpm lint                       # Lint all packages
pnpm lint:fix                   # Auto-fix lint
pnpm typecheck                  # Typecheck all packages
pnpm format                     # Prettier format
pnpm format:check               # Check formatting
```

### Build & Prisma
```bash
pnpm build                      # Build all packages
pnpm prisma:migrate             # Run migrations (dev)
pnpm prisma:seed                # Seed database only
pnpm prisma:studio              # Open Prisma Studio
pnpm prisma:generate            # Regenerate Prisma client
pnpm clean                      # Clean build outputs
```

## Key Configuration
- **Node**: >=20, **pnpm**: >=8 (uses corepack)
- **Postgres**: `localhost:5433` (docker maps 5433->5432)
- **Redis**: `localhost:6379`
- **API URL**: `http://localhost:4000` (health: `/health`)
- **Web URL**: `http://localhost:3000`
- **Prisma**: Uses `prisma db push --force-reset` + seed (not `migrate dev`) — migrations in repo may be stale
- **Env**: Copy `.env.example` → `.env`, set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (32+ chars), `TOKEN_ENCRYPTION_KEY` (32 chars), `API_URL`, `WEB_URL`

## Monorepo Structure
```
apps/api      # Express + Prisma + Zod
  src/index.ts         # Entry point
  prisma/schema.prisma # DB schema
  prisma/seed.ts       # Seed script (ts-node)
apps/web      # Next.js 16 + React 19 + Tailwind 4
  src/app/             # App Router pages
  src/components/      # React components
packages/config # Shared Zod schemas
packages/types  # Shared TS types
packages/utils  # Shared utilities
```

## Key Dependencies
- **API**: Express, Prisma, Zod, bcryptjs, jsonwebtoken, pino, multer, express-rate-limit
- **Web**: Next.js 16, React 19, Tailwind 4, Tiptap, FullCalendar, Recharts, Sonner
- **Auth**: JWT + cookies, Microsoft OAuth (Teams/Graph), bcrypt
- **Payments**: Razorpay
- **Testing**: Vitest (unit/integration), Playwright (E2E)

## Seed Users (after `pnpm prisma:reset`)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.local | admin123 |
| Instructor | instructor@lms.local | instructor123 |
| Student | student@lms.local | student123 |

## Testing Notes
- Unit/integration: `vitest` in `apps/api` (configured in package.json)
- E2E: Playwright (config not in repo root)
- Run `pnpm test:all` in CI

## Git Workflow (from CONTRIBUTING.md)
- `main` = production, `develop` = integration branch
- Branch prefixes: `feature/`, `fix/`, `hotfix/`
- PR requirements: `pnpm test:all`, `pnpm lint`, `pnpm typecheck` pass
- Conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Format with `pnpm format` before commit

## Common Gotchas
- **Postgres port**: Use `5433` in `DATABASE_URL` (docker-compose maps 5433→5432)
- **Prisma env**: If Prisma can't find `DATABASE_URL`, ensure `.env` is in repo root (copy to `apps/api/` if needed)
- **Prisma migrations**: Repo uses `db push --force-reset` + seed instead of `migrate dev`; migration files may be stale
- **No pre-commit hooks**: No Husky config found — run `pnpm format` manually
- **No CI workflows**: No `.github/workflows/` found