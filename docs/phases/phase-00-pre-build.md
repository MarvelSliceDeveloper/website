# Phase 0 — Pre-Build Foundation

> ⏱️ **Duration**: Week 0 (1 week)  
> 📌 **Status**: Not Started  
> ⚠️ **This phase is NOT in the original plan — added to address critical gaps**

---

## 🎯 Objective

Set up the development infrastructure, quality gates, and observability layer **before any application code is written**. Every minute invested here saves hours of debugging later.

---

## ✅ Tasks

### 0.1 — Version Control & Branching Strategy

- [ ] Initialize Git repository
- [ ] Define branching strategy:
  - `main` — production-ready code
  - `develop` — integration branch
  - `feature/*` — individual feature branches
  - `hotfix/*` — urgent production fixes
- [ ] Set up `.gitignore` (Node, Next.js, Prisma, IDE files, `.env`)
- [ ] Create PR template with checklist (tests pass, docs updated, no console.logs)
- [ ] Enable branch protection rules on `main` and `develop`

### 0.2 — CI/CD Pipeline

- [ ] Set up GitHub Actions (or equivalent) with the following workflows:
  - **Lint & Type Check**: Runs ESLint + `tsc --noEmit` on every PR
  - **Unit Tests**: Runs Vitest on every PR
  - **E2E Tests**: Runs Playwright on `develop` merges
  - **Build Check**: Ensures `turbo build` completes without errors
  - **Deploy Preview**: Vercel preview deploys for PRs
- [ ] Configure automated deployment:
  - `develop` → staging environment
  - `main` → production environment
- [ ] Set up environment variable management (GitHub Secrets / Vercel env)

### 0.3 — Testing Framework Setup

- [ ] Install and configure **Vitest** for unit/integration tests
  - Configure with TypeScript paths
  - Set up coverage reporting (target: 80%+ for critical modules)
- [ ] Install and configure **Playwright** for E2E tests
  - Create base test fixtures (authenticated user, tenant context)
  - Set up test database seeding/teardown scripts
- [ ] Install **MSW (Mock Service Worker)** for mocking MS Graph API in tests
- [ ] Define testing conventions:
  - Unit tests: `*.test.ts` co-located with source
  - E2E tests: `/tests/e2e/*.spec.ts`
  - Integration tests: `/tests/integration/*.test.ts`

### 0.4 — Code Quality Tools

- [ ] Configure **ESLint** with:
  - `@typescript-eslint/recommended`
  - `eslint-plugin-react-hooks`
  - `eslint-plugin-next` (for Next.js rules)
  - Custom rule: no `any` types
- [ ] Configure **Prettier** with project conventions
- [ ] Set up **Husky** pre-commit hooks:
  - `lint-staged` — lint + format changed files
  - `commitlint` — enforce conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- [ ] Add `.editorconfig` for consistent formatting across IDEs

### 0.5 — Monitoring & Observability

- [ ] Set up **Sentry** for error tracking (frontend + backend)
  - Configure source maps upload in build pipeline
  - Set up error alerts (Slack/email)
- [ ] Set up **structured logging** with `pino` or `winston`
  - JSON format for production
  - Pretty print for development
  - Log levels: `error`, `warn`, `info`, `debug`
  - Include `tenantId`, `userId`, `requestId` in all log entries
- [ ] Set up **health check endpoints** (`/health`, `/ready`)
- [ ] Plan for metrics (Prometheus/Grafana or Datadog) — implement in Phase 11

### 0.6 — Development Environment Docs

- [ ] Create `CONTRIBUTING.md` with:
  - How to set up the project locally
  - How to run tests
  - How to create a PR
  - Code style guidelines
- [ ] Create `docker-compose.yml` outline (PostgreSQL + Redis for local dev)
- [ ] Document required environment variables in `.env.example`

---

## 📦 Deliverables

| Deliverable | Verification |
|-------------|-------------|
| Git repo with branching rules | `main` protected, PR template exists |
| CI/CD pipeline | GitHub Actions run on PR |
| Vitest configured | `pnpm test` runs (even if 0 tests) |
| Playwright configured | `pnpm test:e2e` runs |
| ESLint + Prettier + Husky | Pre-commit hook triggers on commit |
| Sentry project | Error tracking dashboard accessible |
| Structured logging | Logger module created with tenant context |
| `.env.example` | All required vars documented |

---

## ⚠️ Why This Phase Matters

> Without Phase 0, every subsequent phase accumulates technical debt. Teams that skip this step spend **30–40% more time debugging** in later phases because they lack:
> - Automated tests to catch regressions
> - CI to prevent broken merges
> - Structured logs to debug production issues
> - Consistent code quality across developers

