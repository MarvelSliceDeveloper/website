#!/bin/sh
set -e

# Runtime config injection for the static landing SPA.
# VITE_* values are read from the container environment (provided by
# env_file: .env.production in docker-compose.prod.yml), so editing
# .env.production and running `docker compose up -d landing` applies the
# changes without rebuilding the image.
cat > /usr/share/nginx/html/config.js <<EOF
window.__ENV__ = {
  "VITE_SUPABASE_URL": "${VITE_SUPABASE_URL:-}",
  "VITE_SUPABASE_ANON_KEY": "${VITE_SUPABASE_ANON_KEY:-}"
};
EOF

exec nginx -g 'daemon off;'
