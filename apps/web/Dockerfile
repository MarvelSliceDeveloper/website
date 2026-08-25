# syntax=docker/dockerfile:1
# Build context = repo root (monorepo). Use: docker build -f apps/web/Dockerfile .
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
WORKDIR /app

# ─── Dependencies ───
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma
COPY apps/landing/package.json apps/landing/package.json
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── Builder ───
FROM deps AS builder
COPY apps/web ./apps/web
ARG NEXT_PUBLIC_API_URL=https://lms.marvelslice.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG NEXT_PUBLIC_APP_VERSION=1.0.1
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
RUN cd apps/web && pnpm build

# ─── Runner ───
FROM base AS runner
ARG GIT_COMMIT=unknown
ARG BUILD_TIME=unknown
ARG NEXT_PUBLIC_APP_VERSION=1.0.1
ENV GIT_COMMIT=$GIT_COMMIT
ENV BUILD_TIME=$BUILD_TIME
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
# Standalone output preserves the monorepo path (apps/web/server.js)
COPY --from=builder /app/apps/web/.next/standalone/apps/web ./
COPY --from=builder /app/apps/web/.next/standalone/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules_fallback
RUN cp -rn node_modules_fallback/* node_modules/ 2>/dev/null || true; rm -rf node_modules_fallback
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
USER nodejs
EXPOSE 3000
CMD ["node", "server.js"]