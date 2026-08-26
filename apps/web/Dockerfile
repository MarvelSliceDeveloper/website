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
# Standalone layout varies: with turbopack.root set to repo root, Next emits a
# FLAT standalone (server.js at root); otherwise it nests under apps/web.
# Detect either, copy only server.js + .next (skip the standalone's own
# node_modules — its pnpm symlink depth is wrong after copy). Rely on the full
# builder node_modules (.pnpm store at the correct depth) for deps.
COPY --from=builder /app/apps/web/.next/standalone ./standalone_src
COPY --from=builder /app/node_modules ./node_modules
RUN set -e; \
    SRC=standalone_src; \
    if [ -f standalone_src/server.js ]; then SRC=standalone_src; \
    elif [ -d standalone_src/apps/web ]; then SRC=standalone_src/apps/web; fi; \
    cp -r "$SRC"/server.js ./ 2>/dev/null || true; \
    cp -r "$SRC"/.next ./ 2>/dev/null || true; \
    rm -rf standalone_src; \
    ls -la ./node_modules/next 2>&1 | head -n 20 || echo "ERROR: next not found in ./node_modules"; \
    [ -f ./server.js ] || { echo "FATAL: server.js missing in runner"; exit 1; }; \
    node -e "require.resolve('next');console.log('web deps OK')"
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["node", "server.js"]