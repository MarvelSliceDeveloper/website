# syntax=docker/dockerfile:1
# Build context = repo root (monorepo). Use: docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
RUN corepack enable
WORKDIR /app

# ─── Dependencies ───
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/landing/package.json apps/landing/package.json
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── Builder ───
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY apps/api ./apps/api
RUN cd apps/api && pnpm exec prisma generate && pnpm build

# ─── Runner ───
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY public ./public
COPY apps/api/entrypoint.sh ./apps/api/entrypoint.sh
RUN chmod +x ./apps/api/entrypoint.sh
USER nodejs
WORKDIR /app/apps/api
EXPOSE 4000
ENTRYPOINT ["dumb-init", "./entrypoint.sh"]