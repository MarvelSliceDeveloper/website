# syntax=docker/dockerfile:1.6
# Build context = repo root (monorepo). Use: docker build -f apps/api/Dockerfile .
# Optimised: turbo prune narrows the workspace to @lms/api + its deps only,
# plus pnpm deploy for a minimal runner.

FROM node:22-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME/bin:$PNPM_HOME:$PATH
RUN apk add --no-cache dumb-init openssl \
 && corepack enable && corepack prepare pnpm@11.1.1 --activate \
 && pnpm add -g turbo@2.10.11
WORKDIR /app

# ─── Prune workspace to @lms/api (+ config, email-templates, types) ───
# Needs full source so out/full is complete; prune itself takes <1s and the
# downstream deps stage stays cached (its inputs are out/json + lockfile).
FROM base AS pruner
COPY . ./
RUN turbo prune @lms/api --docker

# ─── Dependencies (cached, pruned) ───
FROM base AS deps
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# pnpm store + fetch cache reuse across builds (speed + less download)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ─── Builder ───
FROM deps AS builder
COPY --from=pruner /app/out/full/ ./
# Root tsconfig is not part of the pruned workspace but app tsconfig extends it
COPY tsconfig.json ./tsconfig.json
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
