# ---------------------------------------------------------
# Dockerfile for Marvel Slice Webuzo Container Deployment
# ---------------------------------------------------------

# Stage 1: Build Frontend React App
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production Server Environment
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

EXPOSE 3001

CMD ["node", "server.js"]
