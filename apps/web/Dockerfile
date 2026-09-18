# syntax=docker/dockerfile:1.6
# Build context = repo root (monorepo). Use: docker build -f apps/web/Dockerfile .
# Optimised: turbo prune narrows the workspace to @lms/web + its deps only,
# so installs are smaller and unrelated app changes don't bust the cache.

FROM node:22-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME/bin:$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate \
 && pnpm add -g turbo@2.10.11
WORKDIR /app

# ─── Prune workspace to @lms/web (+ @lms/config, @lms/types) ───
# Needs full source so out/full is complete; prune itself takes <1s and the
# downstream deps stage stays cached (its inputs are out/json + lockfile).
FROM base AS pruner
COPY . ./
RUN turbo prune @lms/web --docker

# ─── Dependencies (cached, pruned) ───
FROM base AS deps
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Cache pnpm store across builds; ignore scripts for faster install
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ─── Builder ───
FROM deps AS builder
COPY --from=pruner /app/out/full/ ./
# Root tsconfig is not part of the pruned workspace but app tsconfig extends it
COPY tsconfig.json ./tsconfig.json
ARG NEXT_PUBLIC_API_URL=https://lms.marvelslice.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
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
