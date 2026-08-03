# Docker Implementation & CI/CD Deployment Guide

## Overview

This document describes the complete Docker-based deployment architecture for the LMS platform on a VPS using Docker Compose, Nginx reverse proxy, and GitHub Actions CI/CD pipeline.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VPS (Ubuntu 22.04+)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Nginx      │  │   API        │  │   Web (LMS)  │          │
│  │   :80/443    │──▶│   :4000      │  │   :3000      │          │
│  │              │  │              │  │              │          │
│  │  /      → Landing (static)  │  │              │          │
│  │  /api    → API              │  │              │          │
│  │  /student,              │  │              │          │
│  │  /admin,                │  │              │          │
│  │  /instructor → Web      │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│                 ┌──────────────┐  ┌──────────────┐             │
│                 │  PostgreSQL  │  │    Redis     │             │
│                 │   :5432      │  │   :6379      │             │
│                 └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Required Files

### 1. `apps/api/Dockerfile`

```dockerfile
# ─── Base ───
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app

# ─── Dependencies ───
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod=false

# ─── Builder ───
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm prisma:generate && pnpm build

# ─── Runner ───
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/entrypoint.sh ./entrypoint.sh
USER nodejs
EXPOSE 4000
ENTRYPOINT ["dumb-init", "./entrypoint.sh"]
```

### 2. `apps/api/entrypoint.sh`

```bash
#!/bin/sh
set -e

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the application
echo "Starting API server..."
exec node dist/index.js
```

### 3. `apps/web/Dockerfile`

```dockerfile
# ─── Base ───
FROM node:20-alpine AS base
WORKDIR /app

# ─── Dependencies ───
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod=false

# ─── Builder ───
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# ─── Runner ───
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
# Next.js standalone output
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static
USER nodejs
EXPOSE 3000
CMD ["node", "server.js"]
```

### 4. `apps/landing/Dockerfile`

```dockerfile
# ─── Builder ───
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
RUN corepack enable pnpm && pnpm build

# ─── Runner (Nginx) ───
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.landing.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 5. `apps/landing/nginx.landing.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - web
      - landing
    restart: unless-stopped
    networks: [lms-network]

  api:
    image: ${REGISTRY}/${IMAGE_NAME}-api:${TAG}
    env_file: .env.production
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks: [lms-network]

  web:
    image: ${REGISTRY}/${IMAGE_NAME}-web:${TAG}
    env_file: .env.production
    environment:
      - API_URL=http://api:4000
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api
    restart: unless-stopped
    networks: [lms-network]

  landing:
    image: ${REGISTRY}/${IMAGE_NAME}-landing:${TAG}
    restart: unless-stopped
    networks: [lms-network]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped
    networks: [lms-network]

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped
    networks: [lms-network]

volumes:
  postgres_data:
  redis_data:

networks:
  lms-network:
    driver: bridge
```

### 7. `nginx.prod.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Upstreams
    upstream api_backend {
        server api:4000;
        keepalive 32;
    }

    upstream web_backend {
        server web:3000;
        keepalive 32;
    }

    upstream landing_backend {
        server landing:80;
        keepalive 32;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/s;

    server {
        listen 80;
        server_name your-domain.com;  # Replace with actual domain

        # Redirect HTTP to HTTPS (if using Let's Encrypt)
        # return 301 https://$server_name$request_uri;

        # Landing page (root)
        location / {
            proxy_pass http://landing_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API routes
        location /api/ {
            limit_req zone=api_limit burst=200 nodelay;
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 60s;
            proxy_send_timeout 60s;
        }

        # Auth endpoints - stricter rate limit
        location /api/auth/ {
            limit_req zone=auth_limit burst=20 nodelay;
            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Web (LMS) routes
        location /student/ {
            proxy_pass http://web_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 60s;
        }

        location /admin/ {
            proxy_pass http://web_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /instructor/ {
            proxy_pass http://web_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://api_backend/health;
            access_log off;
        }
    }
}
```

### 8. `.github/workflows/ci-cd.yml`

```yaml
name: CI / CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest
    timeout-minutes: 20
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: lms_test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: lms_test
        ports: [5432:5432]
        options: >-
          --health-cmd="pg_isready -U lms_test"
          --health-interval=5s --health-timeout=3s --health-retries=10
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
        options: --health-cmd="redis-cli ping" --health-interval=5s --health-timeout=3s --health-retries=10
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with: { version: 8, run_install: false }

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Cache pnpm store
        uses: actions/cache@v4
        with:
          path: ~/.pnpm-store
          key: pnpm-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: pnpm-

      - name: Cache Turbo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ github.sha }}
          restore-keys: turbo-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm prisma:generate

      - name: Run migrations (test DB)
        run: pnpm prisma:migrate:test
        env:
          DATABASE_URL: postgresql://lms_test:test@localhost:5432/lms_test

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Unit/Integration Tests
        run: pnpm test

  build:
    name: Build & Push Images
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata for API
        id: meta-api
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-api
          tags: |
            type=sha
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build & push API
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          file: ./apps/api/Dockerfile
          push: true
          tags: ${{ steps.meta-api.outputs.tags }}
          labels: ${{ steps.meta-api.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Extract metadata for Web
        id: meta-web
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-web
          tags: |
            type=sha
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build & push Web
        uses: docker/build-push-action@v5
        with:
          context: ./apps/web
          file: ./apps/web/Dockerfile
          push: true
          tags: ${{ steps.meta-web.outputs.tags }}
          labels: ${{ steps.meta-web.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Extract metadata for Landing
        id: meta-landing
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-landing
          tags: |
            type=sha
            type=ref,event=branch
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build & push Landing
        uses: docker/build-push-action@v5
        with:
          context: ./apps/landing
          file: ./apps/landing/Dockerfile
          push: true
          tags: ${{ steps.meta-landing.outputs.tags }}
          labels: ${{ steps.meta-landing.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to VPS
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: production
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e
            cd /opt/lms
            
            # Pull latest images
            docker compose -f docker-compose.prod.yml pull
            
            # Run migrations before starting new containers
            docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
            
            # Start new containers (rolling update)
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            
            # Clean up old images
            docker image prune -f
            
            # Verify health
            sleep 10
            curl -f http://localhost/health || exit 1
            echo "Deployment successful!"
```

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | VPS IP or hostname |
| `VPS_USER` | SSH user (e.g., `root` or `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key for VPS access |
| `GITHUB_TOKEN` | Auto-provided (no action needed) |

## VPS Setup Checklist (One-Time)

```bash
# On VPS as root
# 1. Install Docker + Compose
curl -fsSL https://get.docker.com | sh
apt-get update && apt-get install -y docker-compose-plugin

# 2. Create app directory
mkdir -p /opt/lms
cd /opt/lms

# 3. Clone repo (or just copy docker-compose.prod.yml + nginx.prod.conf)
git clone <your-repo> .  # or copy files manually

# 4. Create .env.production
cat > .env.production << 'EOF'
# Database
POSTGRES_USER=lms_prod
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_DB=lms_prod

# Redis
REDIS_URL=redis://redis:6379

# API
JWT_SECRET=<32+ char random>
TOKEN_ENCRYPTION_KEY=<32 char random>
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
API_URL=https://your-domain.com/api
WEB_URL=https://your-domain.com

# Web
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Registry (for docker compose pull)
REGISTRY=ghcr.io
IMAGE_NAME=your-github-username/lms
TAG=latest
EOF

# 5. SSL certificates (Let's Encrypt recommended)
# certbot --nginx -d your-domain.com

# 6. First deploy
docker compose -f docker-compose.prod.yml up -d
```

## Required Code Changes

### 1. Next.js Standalone Output

Add to `apps/web/next.config.ts`:
```typescript
output: 'standalone',
```

### 2. Prisma Migration Baseline

Run once locally before first production deploy:
```bash
pnpm prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
pnpm prisma migrate resolve --applied 0_init
```

### 3. Package.json Scripts

Ensure these scripts exist in root `package.json`:
```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate:test": "prisma migrate deploy",
    "prisma:migrate:prod": "prisma migrate deploy",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

## Migration Strategy

### How It Works

1. **Every deploy runs `prisma migrate deploy`** — applies only new migration files
2. **Same database, incremental migrations** — data persists in Docker volume (`postgres_data`)
3. **No manual "cache" management** — Docker layer cache handles build speed
4. **Switch from `db push` → `migrate dev`/`migrate deploy`** before first production deploy

### What Happens Each Push

| Scenario | Migration Files | `migrate deploy` Does |
|----------|-----------------|----------------------|
| Code only (no schema change) | 0 new | Nothing (0ms) |
| Added a column | 1 new | Runs that 1 SQL file |
| Renamed table | 1 new (careful!) | Runs that 1 SQL file |
| First deploy ever | All migrations | Runs all in order |

### Anti-patterns to Avoid

| Anti-pattern | Why It's Wrong |
|--------------|----------------|
| `prisma db push` in prod | Destructive — bypasses migration history, can drop data |
| `prisma migrate reset` in prod | Wipes database — dev only |
| Skip migrations on deploy | New code expects columns that don't exist → 500 errors |
| Run migrations after containers start | Race condition — requests hit old schema |

## Decisions Needed

| Decision | Options | Default |
|----------|---------|---------|
| **Domain** | What domain? (for nginx `server_name` + SSL) | — |
| **SSL** | Let's Encrypt (certbot) / Cloudflare / self-signed | Let's Encrypt |
| **Backup strategy** | pg_dump cron / S3 / managed backup | pg_dump daily cron |
| **Log aggregation** | Loki / Datadog / local files only | Local for now |
| **Monitoring** | UptimeRobot / Prometheus+Grafana / none | UptimeRobot free |

## Verification Checklist

Before merging to main:

- [ ] All Dockerfiles created in correct locations
- [ ] `entrypoint.sh` executable (`chmod +x apps/api/entrypoint.sh`)
- [ ] `nginx.landing.conf` exists in `apps/landing/`
- [ ] `next.config.ts` has `output: 'standalone'`
- [ ] Prisma baseline migration created and committed
- [ ] GitHub secrets configured (VPS_HOST, VPS_USER, VPS_SSH_KEY)
- [ ] VPS has Docker + Compose installed
- [ ] `.env.production` created on VPS with strong passwords
- [ ] SSL certificates configured (Let's Encrypt recommended)
- [ ] Health endpoint `/health` returns 200 (exists at `app.ts:247`)

## Rollback Procedure

If a deployment breaks:

```bash
# On VPS
cd /opt/lms

# List available images
docker images | grep lms

# Tag previous image as latest
docker tag ghcr.io/username/lms-api:<previous-sha> ghcr.io/username/lms-api:latest
docker tag ghcr.io/username/lms-web:<previous-sha> ghcr.io/username/lms-web:latest

# Re-deploy
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```