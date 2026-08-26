#!/bin/sh
set -e

echo "Syncing database schema..."
# Use the workspace-pinned Prisma 5.22.0 binary directly. NEVER call bare
# `npx prisma` — it fetches prisma@8.0.0-rc.10 where `push` was removed.
/app/node_modules/.bin/prisma db push --skip-generate || pnpm exec prisma db push --skip-generate || npx prisma@5.22.0 db push --skip-generate

echo "Starting API server..."
exec node dist/index.js