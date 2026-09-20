#!/usr/bin/env bash
set -euo pipefail

# Append any keys present in .env.example but missing from .env, preserving
# existing values (e.g. generated secrets and passwords).
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV="$HERE/../.env"
EXAMPLE="$HERE/../.env.example"

if [ ! -f "$ENV" ]; then
  echo "No $ENV — run: cp .env.example .env" >&2
  exit 1
fi

added=0
while IFS= read -r line; do
  case "$line" in
    ''|\#*) continue ;;
  esac
  key="${line%%=*}"
  if ! grep -q "^${key}=" "$ENV"; then
    printf '%s\n' "$line" >> "$ENV"
    echo "added $key"
    added=$((added + 1))
  fi
done < "$EXAMPLE"

echo "Merged $added missing default(s) into .env"
