#!/bin/sh
set -e

echo "Syncing database schema..."
# Use pnpm workspace exec to ensure correct Prisma version (5.22.0) is used, not latest npx fetch
pnpm --filter @lms/api exec prisma db push --skip-generate || pnpm exec prisma db push --skip-generate || npx prisma@5.22.0 db push --skip-generate

echo "Starting API server..."
exec node dist/index.js