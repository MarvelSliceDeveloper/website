# syntax=docker/dockerfile:1.6
# Build context = repo root (monorepo). Use: docker build -f apps/api/Dockerfile .
# Optimised: BuildKit cache mounts for pnpm store + pnpm deploy for minimal runner.

FROM node:22-alpine AS base
RUN apk add --no-cache dumb-init openssl \
 && corepack enable && corepack prepare pnpm@11.1.1 --activate
WORKDIR /app

# ─── Dependencies (cached) ───
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma
COPY apps/web/package.json apps/web/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/ packages/
# pnpm store + fetch cache reuse across builds (speed + less download)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ─── Builder ───
FROM deps AS builder
COPY apps/api ./apps/api
# Copy workspace package sources needed at build time (already in deps, but builder needs src)
COPY packages ./packages
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter @lms/api exec prisma generate \
 && pnpm --filter @lms/api build

# Prepare pruned prod deployment (only api + workspace deps it needs)
RUN pnpm --filter @lms/api --prod deploy /tmp/api-deploy --legacy

# ─── Runner (minimal) ───
FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init openssl postgresql-client su-exec
WORKDIR /app

ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV NODE_ENV=production
ENV NODE_PATH=/app/apps/api/node_modules:/app/node_modules

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy pruned prod node_modules + package files from deploy
COPY --from=builder /tmp/api-deploy/node_modules ./node_modules
COPY --from=builder /tmp/api-deploy/package.json ./package.json
# The deploy output keeps apps/api structure under /tmp/api-deploy — copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
# Prisma client was generated before `pnpm deploy` and is already inside
# /tmp/api-deploy/node_modules/.prisma — no extra copy needed.
# If the client is missing (edge: pnpm deploy with isolated store), regenerate in runner:
RUN if [ ! -d ./node_modules/.prisma ]; then \
      echo "Prisma client not in deploy, regenerating..."; \
      npx --yes prisma@5.22.0 generate --schema apps/api/prisma/schema.prisma; \
    fi
# Public assets (if any)
COPY public ./public
# Entrypoint
COPY apps/api/entrypoint.sh ./apps/api/entrypoint.sh

RUN mkdir -p /app/apps/api/uploads /app/apps/uploads \
 && chmod +x ./apps/api/entrypoint.sh \
 && chown -R nodejs:nodejs /app \
 && rm -rf /root/.npm /tmp/*

WORKDIR /app/apps/api
EXPOSE 4000
ENTRYPOINT ["dumb-init", "./entrypoint.sh"]
