#!/bin/sh
set -e

echo "Syncing database schema..."
# User said: no seed / no prisma push needed on boot — just start API.
# Keep schema sync opt-in via env SKIP_DB_PUSH=1 (default: skip). Previously
# this ran prisma db push every boot and hit EACCES + libssl issues.
if [ "${SKIP_DB_PUSH:-1}" = "1" ]; then
  echo "SKIP_DB_PUSH=1 — skipping prisma db push (set SKIP_DB_PUSH=0 to enable)."
else
  # Try absolute binary first (runner has it at /app/node_modules/.bin/prisma).
  # Fallbacks use pinned 5.22.0 — NEVER bare `npx prisma` (fetches 8.0.0-rc.10).
  /app/node_modules/.bin/prisma db push --skip-generate \
    || ./node_modules/.bin/prisma db push --skip-generate \
    || pnpm exec prisma db push --skip-generate \
    || npx prisma@5.22.0 db push --skip-generate || echo "WARN: prisma db push failed — continuing to start API"
fi

echo "Starting API server..."
exec node dist/index.js