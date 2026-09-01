# syntax=docker/dockerfile:1.6
# Build context = repo root (monorepo). Use: docker build -f apps/web/Dockerfile .
# Optimised: BuildKit cache mounts for pnpm store + Next.js cache, minimal runner without pnpm.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
WORKDIR /app

# ─── Dependencies (cached, filtered to web only where possible) ───
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/ packages/
# Cache pnpm store across builds; ignore scripts for faster install
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ─── Builder ───
FROM deps AS builder
COPY apps/web ./apps/web
# Packages source needed for build (types/config)
COPY packages ./packages
ARG NEXT_PUBLIC_API_URL=https://lms.marvelslice.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG NEXT_PUBLIC_APP_VERSION=1.0.1
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
# Cache Next.js build cache + pnpm store; standalone output is pruned
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    --mount=type=cache,id=next-cache,target=/app/apps/web/.next/cache \
    pnpm --filter @lms/web build

# ─── Runner (minimal, no pnpm, no build tools) ───
FROM node:22-alpine AS runner
RUN apk add --no-cache dumb-init
WORKDIR /app

ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG NEXT_PUBLIC_APP_VERSION=1.0.1
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Next standalone is self-contained (includes pruned node_modules) — keep apps/web tree
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["dumb-init", "node", "apps/web/server.js"]
