#!/usr/bin/env bash
set -euo pipefail

# Pinned supabase/supabase commit for the docker/ self-host directory.
SUPABASE_DOCKER_REF="${SUPABASE_DOCKER_REF:-1e444589c6ba54c6b6dc43ecf6bb3a39e4f55566}"
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$DEPLOY_DIR/vendor/docker"

if [ -d "$TARGET_DIR" ]; then
  echo "vendor already present at $TARGET_DIR; delete it to refetch."
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

URL="https://github.com/supabase/supabase/archive/${SUPABASE_DOCKER_REF}.tar.gz"
echo "Fetching $URL"
curl -fsSL "$URL" -o "$TMP/src.tar.gz"
tar -xzf "$TMP/src.tar.gz" -C "$TMP"

SRC="$TMP/supabase-${SUPABASE_DOCKER_REF}/docker"
if [ ! -d "$SRC" ]; then
  echo "ERROR: docker/ not found in archive" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
cp -a "$SRC/." "$TARGET_DIR/"
echo "Vendored supabase/docker@$SUPABASE_DOCKER_REF -> $TARGET_DIR"
