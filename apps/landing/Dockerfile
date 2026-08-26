# syntax=docker/dockerfile:1
# Build context = repo root (monorepo). Use: docker build -f apps/landing/Dockerfile .
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
WORKDIR /app

# ─── Dependencies ───
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/landing/package.json apps/landing/package.json
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# ─── Builder ───
FROM deps AS builder
COPY apps/landing ./apps/landing
RUN pnpm --filter marvel-slice build

# ─── Runner (Nginx) ───
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html
COPY apps/landing/nginx.landing.conf /etc/nginx/conf.d/default.conf
COPY apps/landing/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]