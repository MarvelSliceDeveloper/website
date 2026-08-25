# syntax=docker/dockerfile:1
# Build context = repo root (monorepo). Use: docker build -f apps/landing/Dockerfile .
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ─── Dependencies ───
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/landing/package.json apps/landing/package.json
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── Builder ───
FROM base AS builder
# The landing SPA reads these VITE_* vars at build time. They are passed as
# build args from docker-compose.prod.yml (which reads them from .env.production).
ARG VITE_GA_MEASUREMENT_ID
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY apps/landing ./apps/landing
RUN cd apps/landing && pnpm build

# ─── Runner (Nginx) ───
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html
COPY apps/landing/nginx.landing.conf /etc/nginx/conf.d/default.conf
EXPOSE 80