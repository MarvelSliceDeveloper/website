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

# Prepare pruned prod deployment (only api + workspace deps it needs).
# NOTE: `pnpm deploy` rebuilds node_modules from the store, so files created
# by `prisma generate` (node_modules/.prisma) are NOT carried over — copy the
# generated client explicitly so the runner never has to regenerate it.
RUN pnpm --filter @lms/api --prod deploy /tmp/api-deploy --legacy \
 && if [ -d /app/apps/api/node_modules/.prisma ]; then \
      cp -r /app/apps/api/node_modules/.prisma /tmp/api-deploy/node_modules/.prisma; \
    elif [ -d /app/node_modules/.prisma ]; then \
      cp -r /app/node_modules/.prisma /tmp/api-deploy/node_modules/.prisma; \
    else \
      echo "WARN: generated Prisma client (.prisma) not found after generate"; \
    fi

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

# Copy pruned prod node_modules + package files from deploy.
# The generated Prisma client (.prisma) was copied into the deploy output
# above, so no regeneration is needed here.
COPY --chown=nodejs:nodejs --from=builder /tmp/api-deploy/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /tmp/api-deploy/package.json ./package.json
# The deploy output keeps apps/api structure under /tmp/api-deploy — copy built artifacts
COPY --chown=nodejs:nodejs --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=nodejs:nodejs --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --chown=nodejs:nodejs --from=builder /app/apps/api/package.json ./apps/api/package.json
# Public assets (if any)
COPY --chown=nodejs:nodejs public ./public
# Entrypoint
COPY --chown=nodejs:nodejs apps/api/entrypoint.sh ./apps/api/entrypoint.sh

# Targeted setup only (few files — fast). Ownership of the tree is already
# correct via COPY --chown, so no `chown -R /app`. Uploads dirs are chowned
# at container boot by entrypoint.sh (handles bind-mounts too).
RUN mkdir -p /app/apps/api/uploads /app/apps/uploads \
 && chmod +x ./apps/api/entrypoint.sh \
 && rm -rf /root/.npm /tmp/*

WORKDIR /app/apps/api
EXPOSE 4000
ENTRYPOINT ["dumb-init", "./entrypoint.sh"]
