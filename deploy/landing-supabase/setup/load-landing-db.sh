#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY="$(cd "$HERE/.." && pwd)"
ROOT="$(cd "$DEPLOY/../.." && pwd)"                                # repo root
LANDING="$ROOT/apps/landing"
DB="${POSTGRES_DB:-landing_prod}"
# In supabase/postgres the superuser is `supabase_admin`; `postgres` is not the
# database owner and lacks CREATE on schema public.
USER="${POSTGRES_USER:-supabase_admin}"
CONTAINER="${SUPABASE_DB_CONTAINER:-supabase-db}"

COMPOSE=(docker compose
  -f "$DEPLOY/vendor/docker/docker-compose.yml"
  -f "$DEPLOY/docker-compose.override.yml"
  --env-file "$DEPLOY/.env")

# schema.sql writes to the `storage` schema, which the Storage API creates on
# first boot. Bring up db + rest + storage before loading the public schema.
"${COMPOSE[@]}" up -d db rest storage

echo "Waiting for the storage schema..."
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" psql -U "$USER" -d "$DB" -tAc \
      "select to_regclass('storage.objects')" 2>/dev/null | grep -q storage.objects; then
    echo "storage schema ready"
    break
  fi
  sleep 3
done

# Fall back if the chosen role cannot connect locally.
if ! docker exec "$CONTAINER" psql -U "$USER" -d "$DB" -tAc 'select 1' >/dev/null 2>&1; then
  echo "role $USER unavailable; falling back to postgres"
  USER=postgres
fi

psql_file() {
  local f="$1"
  echo ">>> ${f#$ROOT/}"
  docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -q -U "$USER" -d "$DB" < "$f"
}

# 1. Core schema (44 tables, pgcrypto).
psql_file "$LANDING/schema.sql"

# 2. Standalone schema files not covered by schema.sql (idempotent IF NOT EXISTS).
for f in newsletter_schema.sql services-schema.sql training-schema.sql; do
  [ -f "$LANDING/$f" ] && psql_file "$LANDING/$f"
done

# 3. Incremental migrations in filename order.
for f in "$LANDING"/supabase/migrations/*.sql; do
  psql_file "$f"
done

# 4. Hardened admin auth (bcrypt verify_admin, audit logs).
[ -f "$LANDING/secure_admin_auth_migration.sql" ] && psql_file "$LANDING/secure_admin_auth_migration.sql"

# 5. Performance indexes.
[ -f "$LANDING/production_performance_indexes.sql" ] && psql_file "$LANDING/production_performance_indexes.sql"

# 6. Seed data (override with SEED_FILE=/path/to/seed.sql).
SEED_FILE="${SEED_FILE:-$LANDING/backup/seed.sql}"
[ -f "$SEED_FILE" ] && psql_file "$SEED_FILE"

# 7. PostgREST runs as `anon`; RLS policies alone do not grant table privileges.
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -q -U "$USER" -d "$DB" <<'SQL'
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
SQL

echo "Landing schema loaded into $DB"
