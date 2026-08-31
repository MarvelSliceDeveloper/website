#!/bin/sh
set -e

# ── Ensure uploads directories are writable (bind-mount support) ──
# When using a host bind-mount (./apps/api/uploads → /app/apps/api/uploads),
# Docker creates the host directory as root:root if it does not exist.
# The api container historically ran as `nodejs` (uid 1001) and would get
# EACCES on first upload. Fix ownership/permissions at boot while we are
# still root (entrypoint runs as root; we drop to nodejs before exec).
# Writes were observed at both /app/apps/api/uploads and /app/apps/uploads
# (legacy) in prod, so both paths are mounted to the same host dir.
for UPLOADS_DIR in "/app/apps/api/uploads" "/app/apps/uploads"; do
  mkdir -p "$UPLOADS_DIR"
  if [ "$(id -u)" = "0" ]; then
    chown -R nodejs:nodejs "$UPLOADS_DIR" 2>/dev/null || chmod -R 775 "$UPLOADS_DIR" 2>/dev/null || true
  fi
done
# Ensure any legacy files at /app/apps/uploads are visible under the canonical path
if [ -d "/app/apps/uploads/courses" ] && [ ! -e "/app/apps/api/uploads/courses" ]; then
  cp -a /app/apps/uploads/. /app/apps/api/uploads/ 2>/dev/null || true
fi

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
# Drop privileges to nodejs if we started as root, otherwise exec directly
if [ "$(id -u)" = "0" ]; then
  if command -v su-exec >/dev/null 2>&1; then
    exec su-exec nodejs node dist/index.js
  else
    exec su nodejs -s /bin/sh -c "node dist/index.js"
  fi
else
  exec node dist/index.js
fi