# LMS Portal — Command Reference

> Every command you'll need during development, testing, building, and deploying the LMS project.

---

## 📌 Prerequisites

Before running any command, ensure you have these installed:

```bash
# Check Node.js (required: v20+)
node --version

# Check pnpm (required: v8+)
pnpm --version

# Check Docker (required for local DB + Redis)
docker --version
docker-compose --version

# Check Git
git --version

# Install pnpm globally (if not installed)
npm install -g pnpm

# Install Turborepo globally (optional, can use npx)
npm install -g turbo
```

---

## 🚀 Project Setup (First Time)

```bash
# 1. Clone the repository
git clone <your-repo-url> lms-project
cd lms-project

# 2. Install all dependencies (across all workspaces)
pnpm install

# 3. Copy environment variables template
cp .env.example .env

# 4. Start local database + Redis containers
docker-compose up -d

# 5. Verify containers are running
docker ps

# 6. Run database migrations
pnpm prisma:migrate

# 7. Seed the database with sample data
pnpm prisma:seed

# 8. Start the dev server (both frontend + API)
pnpm dev
```

---

## 🖥️ Development Commands

### Starting the Project

```bash
# Start EVERYTHING (frontend + API concurrently via Turborepo)
pnpm dev

# Start ONLY the frontend (Next.js) — runs on http://localhost:3000
pnpm dev:web

# Start ONLY the backend API (Express) — runs on http://localhost:4000
pnpm dev:api

# Start with debug logging enabled
DEBUG=lms:* pnpm dev

# Start API with Node.js inspector (for debugging in VS Code/Chrome)
pnpm dev:api:debug
```

### Turborepo Commands

```bash
# Run dev for all apps
pnpm turbo dev

# Run dev for a specific app
pnpm turbo dev --filter=web
pnpm turbo dev --filter=api

# Build all apps
pnpm turbo build

# Lint all apps
pnpm turbo lint

# Run all tests
pnpm turbo test

# View the Turborepo dependency graph
pnpm turbo run build --graph

# Clear Turborepo cache
pnpm turbo clean
```

---

## 🗄️ Database Commands (Prisma)

### Migrations

```bash
# Create a new migration after changing schema.prisma
pnpm prisma:migrate
# Equivalent to:
# cd apps/api && npx prisma migrate dev --name <migration-name>

# Create a migration with a specific name
cd apps/api
npx prisma migrate dev --name add_quiz_tables

# Apply migrations in production (no prompt)
npx prisma migrate deploy

# Reset database (DROP all tables + re-migrate + re-seed)
# ⚠️ WARNING: This destroys ALL data
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate migration SQL without applying (for review)
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource --script
```

### Prisma Studio (Visual DB Browser)

```bash
# Open Prisma Studio — visual database browser at http://localhost:5555
cd apps/api
npx prisma studio
```

### Prisma Client

```bash
# Regenerate Prisma client (after schema changes)
cd apps/api
npx prisma generate

# Validate schema file for errors
npx prisma validate

# Format schema file
npx prisma format
```

### Seeding

```bash
# Run database seed script
cd apps/api
npx prisma db seed

# Or from root
pnpm prisma:seed
```

### Direct Database Access

```bash
# Open PostgreSQL CLI (via Docker)
docker exec -it lms-postgres psql -U lms_user -d lms_dev

# Common psql commands inside the shell:
#   \dt           — list all tables
#   \d "User"     — describe User table
#   \l            — list databases
#   SELECT * FROM "Tenant" LIMIT 5;
#   \q            — quit

# Export database dump
docker exec -t lms-postgres pg_dump -U lms_user lms_dev > backup.sql

# Import database dump
docker exec -i lms-postgres psql -U lms_user lms_dev < backup.sql
```

---

## 🧪 Testing Commands

### Unit Tests (Vitest)

```bash
# Run ALL unit tests
pnpm test

# Run tests for a specific app
pnpm test:web          # frontend tests
pnpm test:api          # backend tests

# Run tests in watch mode (re-run on file change)
pnpm test:watch

# Run a specific test file
cd apps/api
npx vitest run src/modules/auth/auth.service.test.ts

# Run tests matching a pattern
npx vitest run --grep "should hash password"

# Run tests with coverage report
pnpm test:coverage

# View coverage report in browser (opens HTML report)
# After running test:coverage, open:
#   apps/api/coverage/index.html
#   apps/web/coverage/index.html
```

### Integration Tests

```bash
# Run integration tests (requires database running)
pnpm test:integration

# Run a specific integration test
cd tests/integration
npx vitest run auth.integration.test.ts
```

### End-to-End Tests (Playwright)

```bash
# Run ALL E2E tests (headless)
pnpm test:e2e

# Run E2E tests with browser visible (headed mode)
pnpm test:e2e:headed
# Equivalent to:
# npx playwright test --headed

# Run a specific E2E test file
npx playwright test tests/e2e/auth.spec.ts

# Run E2E tests for a specific project (browser)
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Open Playwright Test UI (interactive runner)
npx playwright test --ui

# Generate E2E tests by recording browser actions
npx playwright codegen http://localhost:3000

# Show last E2E test report
npx playwright show-report

# Update E2E test snapshots
npx playwright test --update-snapshots

# Debug a specific E2E test (step-by-step)
npx playwright test tests/e2e/auth.spec.ts --debug
```

### Test Utilities

```bash
# Run all tests (unit + integration + E2E)
pnpm test:all

# Check test coverage across the project
pnpm test:coverage

# Run tests in CI mode (no watch, exit on failure)
CI=true pnpm test
```

---

## 🔍 Code Quality Commands

### Linting

```bash
# Lint all files
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Lint specific app
pnpm turbo lint --filter=web
pnpm turbo lint --filter=api

# Lint only staged files (runs automatically via Husky pre-commit)
npx lint-staged
```

### Type Checking

```bash
# Type check all apps (no emit, just check for errors)
pnpm typecheck
# Equivalent to:
# pnpm turbo typecheck

# Type check specific app
cd apps/web && npx tsc --noEmit
cd apps/api && npx tsc --noEmit

# Type check with verbose output
npx tsc --noEmit --listFiles
```

### Formatting

```bash
# Format all files with Prettier
pnpm format

# Check formatting without changing files
pnpm format:check
# Equivalent to:
# npx prettier --check "**/*.{ts,tsx,js,jsx,json,css,md}"

# Format a specific file
npx prettier --write src/modules/auth/auth.service.ts
```

### Dependency Audit

```bash
# Check for security vulnerabilities in dependencies
pnpm audit

# Fix auto-fixable vulnerabilities
pnpm audit --fix

# Check for outdated packages
pnpm outdated

# Update all packages to latest compatible versions
pnpm update

# Update a specific package
pnpm update prisma --latest
```

---

## 🏗️ Build Commands

```bash
# Build ALL apps for production
pnpm build

# Build specific app
pnpm build:web       # Next.js production build
pnpm build:api       # TypeScript compilation

# Build shared packages only
pnpm turbo build --filter=@lms/types
pnpm turbo build --filter=@lms/config
pnpm turbo build --filter=@lms/utils

# Analyze Next.js bundle size
cd apps/web
ANALYZE=true npx next build

# Preview production build locally (Next.js)
cd apps/web
npx next start        # runs on http://localhost:3000

# Preview production build locally (API)
cd apps/api
node dist/index.js    # runs on http://localhost:4000
```

---

## 🐳 Docker Commands

### Local Development Containers

```bash
# Start PostgreSQL + Redis containers
docker-compose up -d

# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers + data
# ⚠️ WARNING: This destroys ALL local database data
docker-compose down -v

# View container logs
docker-compose logs -f          # all containers
docker-compose logs -f postgres # only postgres
docker-compose logs -f redis    # only redis

# Check container status
docker-compose ps

# Restart a specific container
docker-compose restart postgres
docker-compose restart redis
```

### Production Docker

```bash
# Build production Docker image for API
docker build -t lms-api:latest -f apps/api/Dockerfile .

# Run production Docker image locally
docker run -p 4000:4000 --env-file .env lms-api:latest

# Tag and push to container registry
docker tag lms-api:latest your-registry.com/lms-api:latest
docker push your-registry.com/lms-api:latest
```

### Redis CLI

```bash
# Open Redis CLI (via Docker)
docker exec -it lms-redis redis-cli

# Common Redis commands inside the shell:
#   KEYS *                     — list all keys
#   GET session:user123        — get a value
#   DEL session:user123        — delete a key
#   FLUSHALL                   — delete ALL keys (⚠️ careful!)
#   INFO                       — server info
#   MONITOR                    — watch all commands in real-time
#   quit                       — exit

# Check Bull queue status
docker exec -it lms-redis redis-cli LLEN bull:recording-sync:wait
docker exec -it lms-redis redis-cli LLEN bull:calendar-sync:wait
```

---

## 📧 Email Testing

```bash
# Start local email testing server (MailHog) — optional
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# View caught emails at http://localhost:8025
# Configure SMTP in .env:
#   SMTP_HOST=localhost
#   SMTP_PORT=1025
```

---

## 🔐 Security Commands

```bash
# Run dependency vulnerability audit
pnpm audit

# Check for secrets accidentally committed to git
npx secretlint "**/*"

# Run OWASP ZAP scan against staging (before launch)
# Install ZAP first: https://www.zaproxy.org/
docker run -t zaproxy/zap-stable zap-baseline.py -t http://localhost:3000

# Generate a secure random string (for JWT_SECRET, etc.)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate AES-256 encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Monitoring & Debugging

```bash
# Check API health
curl http://localhost:4000/health

# Check API readiness
curl http://localhost:4000/ready

# View application logs (if using PM2 in production)
pm2 logs lms-api
pm2 logs lms-api --lines 100

# Monitor PM2 processes
pm2 monit

# View Bull queue dashboard (if bull-board installed)
# Open http://localhost:4000/admin/queues

# Debug memory usage
node --inspect dist/index.js
# Then open chrome://inspect in Chrome
```

---

## 🌐 Microsoft Graph API Testing

```bash
# Start ngrok tunnel for webhook testing
ngrok http 4000
# Copy the HTTPS URL and use it as webhook notification URL

# Alternative: VS Code Dev Tunnels
# Use the VS Code "Ports" panel to forward port 4000

# Test Graph API token manually
curl -X GET "https://graph.microsoft.com/v1.0/me" \
  -H "Authorization: Bearer <your-access-token>"

# Test calendar endpoint
curl -X GET "https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=2026-05-01T00:00:00Z&endDateTime=2026-05-31T23:59:59Z" \
  -H "Authorization: Bearer <your-access-token>"

# Create a test online meeting
curl -X POST "https://graph.microsoft.com/v1.0/me/onlineMeetings" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"startDateTime":"2026-05-15T10:00:00Z","endDateTime":"2026-05-15T11:00:00Z","subject":"Test Meeting"}'
```

---

## 💳 Razorpay Testing

```bash
# Razorpay Test Cards (use in test mode):
#   Success: 4111 1111 1111 1111 (any future expiry, any CVV)
#   Failure: 4000 0000 0000 0002
#
# Razorpay Test UPI:
#   Success: success@razorpay
#   Failure: failure@razorpay

# Test webhook locally (simulate Razorpay webhook)
curl -X POST http://localhost:4000/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: <generated-signature>" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test123","amount":99900,"currency":"INR","status":"captured"}}}}'
```

---

## 📦 Package Management

```bash
# Install a dependency in a specific app
pnpm --filter web add axios
pnpm --filter api add express

# Install a dev dependency
pnpm --filter web add -D @types/react
pnpm --filter api add -D vitest

# Install in shared package
pnpm --filter @lms/types add -D typescript
pnpm --filter @lms/utils add date-fns

# Install in root (affects all workspaces)
pnpm add -w -D turbo

# Remove a dependency
pnpm --filter web remove axios

# List all installed packages for an app
pnpm --filter web list
pnpm --filter api list

# Check why a package is installed
pnpm why <package-name>

# Clean all node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

---

## 🔄 Git Commands (Project-Specific)

```bash
# Create a feature branch
git checkout -b feature/course-crud

# Conventional commit messages (enforced by commitlint)
git commit -m "feat: add course CRUD endpoints"
git commit -m "fix: resolve tenant data leak in enrollment query"
git commit -m "docs: update Phase 8 task list"
git commit -m "test: add unit tests for quiz grading"
git commit -m "refactor: extract Graph client retry logic"
git commit -m "chore: update dependencies"
git commit -m "style: format auth module files"

# Push and create PR
git push origin feature/course-crud

# Sync with develop
git checkout develop
git pull origin develop
git checkout feature/course-crud
git rebase develop

# View recent commits
git log --oneline -20

# View changes in a file
git diff apps/api/src/modules/auth/auth.service.ts

# Stash changes temporarily
git stash
git stash pop

# Tag a release
git tag -a v1.0.0 -m "Production launch"
git push origin v1.0.0
```

---

## 🚀 Deployment Commands

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod

# Set environment variables on Vercel
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production

# View deployment logs
vercel logs <deployment-url>

# Rollback to previous deployment
vercel rollback
```

### EC2/DigitalOcean (API)

```bash
# SSH into production server
ssh user@your-server-ip

# Pull latest code
cd /opt/lms-api
git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build:api

# Run migrations
cd apps/api && npx prisma migrate deploy

# Restart with PM2
pm2 restart lms-api

# Or restart with Docker
docker-compose -f docker-compose.prod.yml up -d --build

# View production logs
pm2 logs lms-api --lines 200
```

---

## 📋 Quick Reference: `package.json` Scripts

These are the scripts expected in the root `package.json`:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:web": "turbo dev --filter=web",
    "dev:api": "turbo dev --filter=api",
    "dev:api:debug": "turbo dev --filter=api -- --inspect",
    "build": "turbo build",
    "build:web": "turbo build --filter=web",
    "build:api": "turbo build --filter=api",
    "lint": "turbo lint",
    "lint:fix": "turbo lint -- --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:web": "turbo test --filter=web",
    "test:api": "turbo test --filter=api",
    "test:watch": "turbo test -- --watch",
    "test:coverage": "turbo test -- --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "pnpm test && pnpm test:integration && pnpm test:e2e",
    "prisma:migrate": "cd apps/api && npx prisma migrate dev",
    "prisma:seed": "cd apps/api && npx prisma db seed",
    "prisma:studio": "cd apps/api && npx prisma studio",
    "prisma:generate": "cd apps/api && npx prisma generate",
    "clean": "turbo clean && rm -rf node_modules"
  }
}
```

---

## ❓ Troubleshooting

### Common Issues

```bash
# "Port 3000 already in use"
npx kill-port 3000
# or
netstat -ano | findstr :3000    # Windows: find PID
taskkill /PID <pid> /F          # Windows: kill process

# "Port 4000 already in use"
npx kill-port 4000

# "Cannot find module @lms/types"
pnpm install
pnpm turbo build --filter=@lms/types

# "Prisma client not generated"
cd apps/api && npx prisma generate

# "Database connection refused"
docker-compose up -d            # start containers
docker-compose ps               # check they're running

# "Redis connection refused"
docker-compose up -d redis      # start Redis container

# "pnpm: command not found"
npm install -g pnpm

# "turbo: command not found"
pnpm add -g turbo
# or use: npx turbo <command>

# Clear ALL caches and start fresh
pnpm turbo clean
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf apps/web/.next
rm -rf apps/api/dist
pnpm install
pnpm prisma:generate
```

