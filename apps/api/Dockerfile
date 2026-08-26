# syntax=docker/dockerfile:1
# Build context = repo root (monorepo). Use: docker build -f apps/api/Dockerfile .
FROM node:22-alpine AS base
RUN apk add --no-cache dumb-init openssl
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
WORKDIR /app

# ─── Dependencies ───
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma
COPY apps/web/package.json apps/web/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── Builder ───
FROM deps AS builder
COPY apps/api ./apps/api
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
RUN cd apps/api && pnpm exec prisma generate && pnpm build

# ─── Runner ───
FROM base AS runner
# Prisma 5.22.0 engine needs OpenSSL (node:22-alpine has libssl3, Prisma needs 1.1 compat)
RUN apk add --no-cache openssl
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
# Lockfile importers reference these workspaces — keep them so --prod install validates
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/landing/package.json ./apps/landing/package.json
COPY --from=builder /app/packages ./packages
COPY public ./public
# Install prod deps directly in runner — never COPY pnpm's symlinked node_modules
# across stages (symlinks point into .pnpm store; dotenv MODULE_NOT_FOUND otherwise).
RUN pnpm install --prod --frozen-lockfile --ignore-scripts
# Regenerate Prisma client IN the runner (client must live in THIS stage's .pnpm store;
# copying /app/node_modules/.prisma from builder fails — pnpm stores it under .pnpm/...)
RUN npx -y prisma@5.22.0 generate --schema apps/api/prisma/schema.prisma
# Build-time gate: fail fast if runtime deps unresolvable from apps/api
RUN cd apps/api && node -e "['dotenv','express','@prisma/client'].forEach(m=>require.resolve(m));console.log('deps OK')"
COPY apps/api/entrypoint.sh ./apps/api/entrypoint.sh
# Ensure Node can resolve workspace root deps from /app/apps/api
ENV NODE_PATH=/app/node_modules:/app/apps/api/node_modules
RUN chmod +x ./apps/api/entrypoint.sh && chown -R nodejs:nodejs /app
USER nodejs
WORKDIR /app/apps/api
EXPOSE 4000
ENTRYPOINT ["dumb-init", "./entrypoint.sh"]