#!/bin/sh
set -e

# Runtime config injection for the static landing SPA.
# VITE_* values are read from the container environment (provided by
# env_file: .env.production in docker-compose.prod.yml), so editing
# .env.production and running `docker compose up -d landing` applies the
# changes without rebuilding the image.
# Generate window.__ENV__ from ALL VITE_* env vars (runtime, no rebuild).
# Escapes backslash and double-quote; strips CR/LF.
{
  echo 'window.__ENV__ = {'
  first=1
  # shellcheck disable=SC2044
  for var in $(env | grep '^VITE_' | cut -d= -f1 | sort); do
    val=$(printenv "$var" | tr -d '\r\n' | sed 's/\\/\\\\/g; s/"/\\"/g')
    # validate GA format if present — skip empty/invalid to avoid XSS via env injection
    if [ "$var" = "VITE_GA_MEASUREMENT_ID" ] && [ -n "$val" ]; then
      case "$val" in
        G-*|UA-*|AW-*) ;;
        *) echo "WARN: invalid VITE_GA_MEASUREMENT_ID=$val skipped" >&2; continue ;;
      esac
    fi
    [ "$first" -eq 0 ] && echo ','
    first=0
    printf '  "%s": "%s"' "$var" "$val"
  done
  echo ''
  echo '};'
} > /usr/share/nginx/html/config.js
# Ensure config.js is never cached (env changes must apply immediately)
chmod 644 /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
