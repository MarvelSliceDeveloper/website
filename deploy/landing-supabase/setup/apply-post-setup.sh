#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB="${POSTGRES_DB:-landing_prod}"
# supabase/postgres superuser (see load-landing-db.sh).
USER="${POSTGRES_USER:-supabase_admin}"
CONTAINER="${SUPABASE_DB_CONTAINER:-supabase-db}"

wait_healthy() {
  local name="$1"
  for _ in $(seq 1 60); do
    if docker inspect --format '{{.State.Health.Status}}' "$name" 2>/dev/null | grep -q healthy; then
      echo "$name healthy"
      return 0
    fi
    sleep 3
  done
  echo "ERROR: $name did not become healthy" >&2
  return 1
}

wait_healthy supabase-db
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB" < "$HERE/realtime.sql"
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB" < "$HERE/storage.sql"

# Optionally bootstrap the first admin (seed contains no admin rows).
# Set ADMIN_EMAIL / ADMIN_PASSWORD in the environment to enable.
if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB" \
    -v email="$ADMIN_EMAIL" -v pass="$ADMIN_PASSWORD" <<'SQL'
do $$
begin
  if not exists (select 1 from information_schema.tables
                 where table_schema = 'public' and table_name = 'admin_profiles') then
    raise exception 'public.admin_profiles is missing — run setup/load-landing-db.sh first';
  end if;
end $$;

insert into public.admin_profiles (id, email, full_name, role, password_hash)
values (
  gen_random_uuid(),
  lower(trim(:'email')),
  'Master Admin',
  'master_admin',
  crypt(:'pass', gen_salt('bf', 10))
)
on conflict (email) do nothing;
SQL
  echo "Admin bootstrap checked for $ADMIN_EMAIL"
fi

echo "Post-setup complete."
