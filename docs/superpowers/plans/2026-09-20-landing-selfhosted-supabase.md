# Landing Self-Hosted Supabase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run `apps/landing` against a self-hosted Supabase API layer backed by a dedicated `supabase/postgres` database (`landing_prod`), with zero change to the landing React code, replacing the egress-restricted hosted Supabase project.

**Architecture:** Vendor the official `supabase/docker` stack at a pinned commit into `deploy/landing-supabase/vendor/`, run it as an independent Compose project with its own `db` (using the `supabase/postgres` image, `POSTGRES_DB=landing_prod`). Load the landing schema/migrations/seed into that DB. Serve the API same-origin under `https://marvelslice.com/{rest,auth,storage,realtime}/v1` by proxying from the landing nginx to the Supabase API gateway. Preserve `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` so no frontend code changes.

**Tech Stack:** Docker Compose, `supabase/postgres`, `postgrest/postgrest`, `supabase/realtime`, `supabase/storage-api`, `supabase/gotrue`, `supabase/postgres-meta`, `envoyproxy/envoy`, nginx, `@supabase/supabase-js`.

**Spec:** `docs/superpowers/specs/2026-09-20-landing-selfhosted-supabase-design.md`

## Global Constraints

- Do **not** modify or restart `lms-postgres` (the LMS production database). Landing uses its own dedicated `db` container.
- **Preserve frontend env var names** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Do not alter `apps/landing/src/lib/supabaseClient.js` or any `supabase.from/rpc/storage/auth` call site.
- Database name: `landing_prod`. Internal DB port: `54329` (avoid 5432 collisions). API gateway publishes on host `127.0.0.1:8000`.
- Public URL: `https://marvelslice.com`; API paths `/rest/v1`, `/auth/v1`, `/storage/v1`, `/realtime/v1`.
- Pinned upstream: `supabase/supabase` commit `1e444589c6ba54c6b6dc43ecf6bb3a39e4f55566` (`docker/` directory).
- Pinned images (from the vendored compose): `supabase/postgres:17.6.1.136`, `postgrest/postgrest:v14.17`, `supabase/realtime:v2.134.10`, `supabase/storage-api:v1.74.0`, `supabase/gotrue:v2.196.0`, `supabase/postgres-meta:v0.99.0`, `envoyproxy/envoy:v1.39.1`, `darthsim/imgproxy:v3.31.4`, `supabase/studio:2026.09.07-sha-7996410`.
- Storage buckets: `hero-images`, `course-thumbnails`, `certificates`, `company-logos`, `nav-icons`, `pages`.
- Realtime tables: `conversations`, `messages`, `brochure_downloads`, `form_submissions`, `contact_submissions`, `about_submissions`, `career_submissions`, `career_contact_submissions`, `newsletter_subscribers`.
- Commits: only create git commits if the user has explicitly approved commits (repo rule). Otherwise leave changes staged/unstaged.

---

### Task 1: Scaffold deployment directory and vendor the upstream stack

**Files:**
- Create: `deploy/landing-supabase/.gitignore`
- Create: `deploy/landing-supabase/setup/fetch-upstream.sh`
- Create: `deploy/landing-supabase/.env.example`
- Create: `deploy/landing-supabase/docker-compose.override.yml`
- Create: `deploy/landing-supabase/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `deploy/landing-supabase/vendor/docker/` (upstream compose + `volumes/` + `utils/`), and the override/env that later tasks invoke.

- [ ] **Step 1: Create `.gitignore`**

```gitignore
vendor/
.env
storage/
*.log
```

- [ ] **Step 2: Create `setup/fetch-upstream.sh`**

```bash
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
```

- [ ] **Step 3: Create `.env.example`**

```env
COMPOSE_FILE=docker-compose.yml

# ── Postgres (dedicated landing DB) ──
POSTGRES_PASSWORD=change-me-to-a-long-random-password
POSTGRES_HOST=db
POSTGRES_DB=landing_prod
POSTGRES_PORT=54329

# ── Secrets (fill with: node setup/generate-keys.mjs) ──
JWT_SECRET=
ANON_KEY=
SERVICE_ROLE_KEY=
SECRET_KEY_BASE=
REALTIME_DB_ENC_KEY=
VAULT_ENC_KEY=
PG_META_CRYPTO_KEY=
LOGFLARE_PUBLIC_ACCESS_TOKEN=
LOGFLARE_PRIVATE_ACCESS_TOKEN=
S3_PROTOCOL_ACCESS_KEY_ID=
S3_PROTOCOL_ACCESS_KEY_SECRET=

# ── URLs (same-origin on the landing domain) ──
SUPABASE_PUBLIC_URL=https://marvelslice.com
API_EXTERNAL_URL=https://marvelslice.com/auth/v1
SITE_URL=https://marvelslice.com

# ── API gateway: host-published on localhost only ──
API_GW_HTTP_PORT=127.0.0.1:8000
KONG_HTTP_PORT=127.0.0.1:8000

# ── PostgREST ──
PGRST_DB_SCHEMAS=public
PGRST_DB_MAX_ROWS=1000
PGRST_DB_EXTRA_SEARCH_PATH=public

# ── Auth (admin login uses verify_admin RPC; no self-serve accounts) ──
DISABLE_SIGNUP=true
ENABLE_EMAIL_SIGNUP=false
ENABLE_EMAIL_AUTOCONFIRM=true

# ── Storage (file backend on a mounted volume) ──
GLOBAL_S3_BUCKET=stub
REGION=stub
STORAGE_TENANT_ID=stub
IMGPROXY_AUTO_WEBP=true

# ── Studio ──
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=change-me-too
STUDIO_DEFAULT_ORGANIZATION=Marvel Slice
STUDIO_DEFAULT_PROJECT=Landing
```

- [ ] **Step 4: Create `docker-compose.override.yml`**

```yaml
# Layered on the vendored upstream compose:
#   docker compose -f vendor/docker/docker-compose.yml -f docker-compose.override.yml --env-file .env up -d
name: landing-supabase

services:
  # Bind the DB pooler to localhost only; never expose Postgres publicly.
  supavisor:
    ports:
      - "127.0.0.1:54329:5432"
      - "127.0.0.1:65439:6543"

  # Bind the API gateway to localhost; nginx proxies to it on the host.
  api-gw:
    ports:
      - "127.0.0.1:8000:8000"
```

- [ ] **Step 5: Create `README.md` (skeleton)**

```markdown
# Landing self-hosted Supabase

Runs the landing site's API layer (PostgREST + Realtime + Storage + Auth) on a
dedicated Postgres database (`landing_prod`). See the root runbook sections below.

## Quick start (server)

    bash setup/fetch-upstream.sh
    cp .env.example .env
    node setup/generate-keys.mjs
    docker compose -f vendor/docker/docker-compose.yml -f docker-compose.override.yml --env-file .env up -d db
    bash setup/load-landing-db.sh
    docker compose -f vendor/docker/docker-compose.yml -f docker-compose.override.yml --env-file .env up -d
    bash setup/apply-post-setup.sh

Then wire nginx (Task 6) and set the landing env (Task 7).
```

- [ ] **Step 6: Verify the vendored stack parses**

Run:
```bash
bash setup/fetch-upstream.sh
docker compose -f vendor/docker/docker-compose.yml -f docker-compose.override.yml --env-file .env.example config >/dev/null && echo CONFIG_OK
```
Expected: `CONFIG_OK` with no compose errors.

- [ ] **Step 7: Commit (only if commits are approved)**

```bash
git add deploy/landing-supabase
git commit -m "chore(landing): scaffold self-hosted supabase deploy dir"
```

---

### Task 2: Generate secrets and API keys

**Files:**
- Create: `deploy/landing-supabase/setup/generate-keys.mjs`

**Interfaces:**
- Consumes: `deploy/landing-supabase/.env` (created from `.env.example`).
- Produces: a populated `.env` with `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `SECRET_KEY_BASE`, `REALTIME_DB_ENC_KEY`, `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY`, `LOGFLARE_*`, `S3_PROTOCOL_ACCESS_KEY_*`.

- [ ] **Step 1: Create `setup/generate-keys.mjs`**

```js
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(dir, '..', '.env');

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const rand = (n) => crypto.randomBytes(n).toString('base64');

function signJwt(payload, secret) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

let text = '';
try {
  text = fs.readFileSync(envPath, 'utf8');
} catch {
  console.error(`Missing ${envPath}. Copy .env.example first.`);
  process.exit(1);
}

const get = (key) => (text.match(new RegExp(`^${key}=(.*)$`, 'm')) || [])[1]?.trim() || '';
const set = (key, value) => {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  text = re.test(text) ? text.replace(re, line) : `${text.replace(/\s*$/, '')}\n${line}\n`;
};

const jwtSecret = get('JWT_SECRET') || rand(48);
const now = Math.floor(Date.now() / 1000);
const exp = now + 60 * 60 * 24 * 365 * 10;
const base = { iss: 'supabase', iat: now, exp };

set('JWT_SECRET', jwtSecret);
set('ANON_KEY', signJwt({ ...base, role: 'anon' }, jwtSecret));
set('SERVICE_ROLE_KEY', signJwt({ ...base, role: 'service_role' }, jwtSecret));
set('SECRET_KEY_BASE', rand(48));
set('REALTIME_DB_ENC_KEY', crypto.randomBytes(8).toString('hex')); // exactly 16 chars
set('VAULT_ENC_KEY', crypto.randomBytes(16).toString('hex'));       // exactly 32 chars
set('PG_META_CRYPTO_KEY', rand(24));
set('LOGFLARE_PUBLIC_ACCESS_TOKEN', rand(24));
set('LOGFLARE_PRIVATE_ACCESS_TOKEN', rand(24));
set('S3_PROTOCOL_ACCESS_KEY_ID', crypto.randomBytes(16).toString('hex'));
set('S3_PROTOCOL_ACCESS_KEY_SECRET', crypto.randomBytes(32).toString('hex'));

fs.writeFileSync(envPath, text);
console.log('Wrote secrets to .env');
console.log('ANON_KEY (use as VITE_SUPABASE_ANON_KEY):');
console.log(get('ANON_KEY'));
```

- [ ] **Step 2: Run it and verify JWT structure**

Run:
```bash
cd deploy/landing-supabase
cp -n .env.example .env
node setup/generate-keys.mjs
node -e "const t=require('fs').readFileSync('.env','utf8');const k=(t.match(/^ANON_KEY=(.*)$/m)||[])[1];const [h,b,s]=k.split('.');console.log(JSON.parse(Buffer.from(b,'base64url')).role)"
```
Expected: prints `anon`.

- [ ] **Step 3: Verify no blank required secrets**

Run:
```bash
grep -E '^(JWT_SECRET|ANON_KEY|SERVICE_ROLE_KEY|SECRET_KEY_BASE|REALTIME_DB_ENC_KEY|VAULT_ENC_KEY|PG_META_CRYPTO_KEY)=$' .env && echo "MISSING SECRETS" || echo "SECRETS_OK"
```
Expected: `SECRETS_OK`.

- [ ] **Step 4: Commit (only if approved)**

```bash
git add deploy/landing-supabase
git commit -m "chore(landing): add self-hosted supabase key generator"
```

---

### Task 3: Boot `landing_prod` and load the landing schema

**Files:**
- Create: `deploy/landing-supabase/setup/load-landing-db.sh`

**Interfaces:**
- Consumes: `landing_prod` database from the `supabase-db` container (Task 1/2), and the `storage` schema created by the Storage API.
- Produces: 44+ landing tables, migrations, admin-auth RPCs, grants for `anon`/`authenticated`/`service_role`, and seed rows in `landing_prod`.

**Correction (2026-09-20):** `apps/landing/schema.sql` inserts into `storage.buckets` and creates policies on `storage.objects`, so the Storage API must have created the `storage` schema **before** schema.sql runs. `load-landing-db.sh` now starts `db rest storage`, waits for `storage.objects`, then loads the schema and applies explicit `GRANT`s (RLS policies alone do not grant table privileges).

- [ ] **Step 1: Start DB + REST + Storage and load the schema**

Run:
```bash
cd deploy/landing-supabase
POSTGRES_DB=landing_prod bash setup/load-landing-db.sh
```
Expected: `storage schema ready` … `Landing schema loaded into landing_prod`.

- [ ] **Step 2: Verify Supabase roles exist**

Run:
```bash
docker exec supabase-db psql -U postgres -d landing_prod -tAc "select rolname from pg_roles where rolname in ('anon','authenticated','service_role','authenticator','supabase_admin') order by 1"
```
Expected: five role names, including `anon` and `authenticator`.

- [ ] **Step 3: Create `setup/load-landing-db.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"      # repo root
LANDING="$ROOT/apps/landing"
DB="${POSTGRES_DB:-landing_prod}"
USER="${POSTGRES_USER:-postgres}"
CONTAINER="${SUPABASE_DB_CONTAINER:-supabase-db}"

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

# 6. Seed data.
[ -f "$LANDING/backup/seed.sql" ] && psql_file "$LANDING/backup/seed.sql"

echo "Landing schema loaded into $DB"
```

- [ ] **Step 4: Run the bootstrap**

Run (from `deploy/landing-supabase`, with DB env exported or `.env` loaded):
```bash
export POSTGRES_DB=landing_prod
bash setup/load-landing-db.sh
```
Expected: ends with `Landing schema loaded into landing_prod`. If a migration fails, fix the offending file's idempotency (`if not exists`) before rerunning.

- [ ] **Step 5: Verify table count, seed, and admin RPC**

Run:
```bash
docker exec supabase-db psql -U postgres -d landing_prod -tAc "select count(*) from information_schema.tables where table_schema='public'"
docker exec supabase-db psql -U postgres -d landing_prod -tAc "select count(*) from public.courses"
docker exec supabase-db psql -U postgres -d landing_prod -tAc "select verify_admin('admin@marvelslice.com','admin123')->>'role'"
```
Expected: table count ≥ 44; courses > 0; the RPC returns a role string (or empty if the seed admin password differs — then run the `bootstrap_master_admin` RPC).

- [ ] **Step 6: Commit (only if approved)**

```bash
git add deploy/landing-supabase
git commit -m "feat(landing): add landing_prod bootstrap script"
```

---

### Task 4: Enable Realtime for landing tables

**Files:**
- Create: `deploy/landing-supabase/setup/realtime.sql`

**Interfaces:**
- Consumes: `landing_prod` (Task 3).
- Produces: `supabase_realtime` publication containing the landing tables; `REPLICA IDENTITY FULL` on `messages` and `conversations`.

- [ ] **Step 1: Create `setup/realtime.sql`**

```sql
-- Stream the tables the landing SPA subscribes to via supabase.channel().
do $$
declare
  t text;
  tables text[] := array[
    'conversations','messages',
    'brochure_downloads','form_submissions','contact_submissions',
    'about_submissions','career_submissions','career_contact_submissions',
    'newsletter_subscribers'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array tables loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t)
       and not exists (select 1 from pg_publication_tables
                       where pubname = 'supabase_realtime'
                         and schemaname = 'public' and tablename = t)
    then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'messages') then
    alter table public.messages replica identity full;
  end if;
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'conversations') then
    alter table public.conversations replica identity full;
  end if;
end $$;
```

- [ ] **Step 2: Apply it**

Run:
```bash
docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d landing_prod < deploy/landing-supabase/setup/realtime.sql
```
Expected: no error.

- [ ] **Step 3: Verify publication contents**

Run:
```bash
docker exec supabase-db psql -U postgres -d landing_prod -tAc "select tablename from pg_publication_tables where pubname='supabase_realtime' order by 1"
```
Expected: includes `conversations` and `messages` (plus any submission tables present).

- [ ] **Step 4: Commit (only if approved)**

```bash
git add deploy/landing-supabase
git commit -m "feat(landing): add realtime publication setup"
```

---

### Task 5: Create Storage buckets and policies

**Files:**
- Create: `deploy/landing-supabase/setup/storage.sql`

**Interfaces:**
- Consumes: Storage API has created the `storage` schema (Task 3's full stack `up`, or run after `storage` container migrates).
- Produces: public-read buckets `hero-images`, `course-thumbnails`, `certificates`, `company-logos`, `nav-icons`, `pages`; anon write/delete policies matching the current open-admin model.

- [ ] **Step 1: Bring up the full stack so Storage migrates its schema**

Run:
```bash
cd deploy/landing-supabase
docker compose -f vendor/docker/docker-compose.yml -f docker-compose.override.yml --env-file .env up -d
docker compose -f vendor/docker/docker-compose.yml -f docker-compose.override.yml --env-file .env ps
```
Expected: `rest`, `realtime`, `storage`, `auth`, `imgproxy`, `meta`, `api-gw` running.

- [ ] **Step 2: Create `setup/storage.sql`**

```sql
-- Public buckets used by the landing admin/media library.
insert into storage.buckets (id, name, public)
values
  ('hero-images','hero-images', true),
  ('course-thumbnails','course-thumbnails', true),
  ('certificates','certificates', true),
  ('company-logos','company-logos', true),
  ('nav-icons','nav-icons', true),
  ('pages','pages', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "landing_public_read" on storage.objects;
create policy "landing_public_read" on storage.objects
  for select
  using (bucket_id in ('hero-images','course-thumbnails','certificates','company-logos','nav-icons','pages'));

drop policy if exists "landing_anon_insert" on storage.objects;
create policy "landing_anon_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('hero-images','course-thumbnails','certificates','company-logos','nav-icons','pages'));

drop policy if exists "landing_anon_delete" on storage.objects;
create policy "landing_anon_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id in ('hero-images','course-thumbnails','certificates','company-logos','nav-icons','pages'));
```

- [ ] **Step 3: Apply and verify**

Run:
```bash
docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d landing_prod < deploy/landing-supabase/setup/storage.sql
docker exec supabase-db psql -U postgres -d landing_prod -tAc "select id, public from storage.buckets order by id"
```
Expected: six buckets, all `public = t`.

- [ ] **Step 4: Commit (only if approved)**

```bash
git add deploy/landing-supabase
git commit -m "feat(landing): add storage buckets and policies"
```

---

### Task 6: Expose the API same-origin through nginx

**Files:**
- Modify: `apps/landing/nginx.landing.conf`
- Modify: `docker-compose.prod.yml` (add `extra_hosts` to the `landing` service)

**Interfaces:**
- Consumes: API gateway on host `127.0.0.1:8000` (Task 1/2).
- Produces: `https://marvelslice.com/rest/v1`, `/auth/v1`, `/storage/v1`, `/realtime/v1` routed to the gateway.

- [ ] **Step 1: Add `extra_hosts` to the landing service**

In `docker-compose.prod.yml`, under `services.landing`, add after `depends_on`:

```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

- [ ] **Step 2: Add API locations to `apps/landing/nginx.landing.conf`**

Insert before the final static-asset `location ~*` block:

```nginx
    # ── Self-hosted Supabase API (same-origin) ──
    # Proxied to the API gateway published on the host at 127.0.0.1:8000.
    location /rest/v1/ {
        set $sb http://host.docker.internal:8000;
        proxy_pass $sb;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /auth/v1/ {
        set $sb http://host.docker.internal:8000;
        proxy_pass $sb;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    location /storage/v1/ {
        set $sb http://host.docker.internal:8000;
        proxy_pass $sb;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50m;
        proxy_read_timeout 120s;
    }

    location /realtime/v1/ {
        set $sb http://host.docker.internal:8000;
        proxy_pass $sb;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
```

- [ ] **Step 3: Validate nginx config**

Run:
```bash
docker run --rm -v "%CD%/apps/landing/nginx.landing.conf:/etc/nginx/conf.d/default.conf:ro" nginx:alpine nginx -t
```
Expected: `syntax is ok` / `test is successful`. (On Linux/macOS use `$PWD`.)

- [ ] **Step 4: Verify routing to the gateway from the host**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "apikey: $(grep '^ANON_KEY=' deploy/landing-supabase/.env | cut -d= -f2)" http://127.0.0.1:8000/rest/v1/courses?select=id\&limit=1
```
Expected: `200` (or `206`), not connection refused.

- [ ] **Step 5: Commit (only if approved)**

```bash
git add apps/landing/nginx.landing.conf docker-compose.prod.yml
git commit -m "feat(landing): proxy self-hosted supabase api same-origin"
```

---

### Task 7: Update landing env, CSP, and docs

**Files:**
- Modify: `apps/landing/.env.example`
- Modify: `apps/landing/index.html:13`
- Modify: `apps/landing/README.md`
- Modify: `apps/landing/PROJECT_DOCUMENTATION.txt`
- Modify: `README.md` (root)
- Modify: `.env.production.example`

**Interfaces:**
- Consumes: `ANON_KEY` from `deploy/landing-supabase/.env` and same-origin URL.
- Produces: frontend pointing at the self-hosted API; CSP no longer references Supabase hosts.

- [ ] **Step 1: Update `apps/landing/.env.example`**

Replace the Supabase block with:

```env
# Self-hosted Supabase API (same-origin on the landing domain).
# The anon key is generated by deploy/landing-supabase/setup/generate-keys.mjs
VITE_SUPABASE_URL=https://marvelslice.com
VITE_SUPABASE_ANON_KEY=replace-with-ANON_KEY-from-deploy/landing-supabase/.env
```

- [ ] **Step 2: Update the CSP in `apps/landing/index.html:13`**

Change only the `connect-src` segment, removing all `supabase.co` entries. The line must remain a single `<meta http-equiv="Content-Security-Policy" ...>` tag; the new `connect-src` value:

```
connect-src 'self' https: wss: https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;
```

- [ ] **Step 3: Verify no Supabase hosts remain in the landing build inputs**

Run:
```bash
rg -n "supabase\.co" apps/landing/index.html apps/landing/src apps/landing/.env.example || echo "NO_SUPABASE_HOSTS"
```
Expected: `NO_SUPABASE_HOSTS`.

- [ ] **Step 4: Update docs**

In `apps/landing/README.md`, replace the `Backend` row:
```
| **Backend** | Self-hosted Supabase open-source stack (PostgreSQL + PostgREST + Storage + Realtime) — see `deploy/landing-supabase/` |
```
Replace the Setup "Supabase project" prerequisite with "Running self-hosted Supabase stack (`deploy/landing-supabase/`)". Update the env block to the two vars above.
In `apps/landing/PROJECT_DOCUMENTATION.txt`, replace "built with React + Supabase" with "built with React + a self-hosted Supabase (Postgres) backend".
In root `README.md`, update the landing backend description from "own Supabase database" to "own PostgreSQL database (`landing_prod`, self-hosted Supabase API layer)".
In `.env.production.example`, under the landing section, set:
```env
VITE_SUPABASE_URL=https://marvelslice.com
VITE_SUPABASE_ANON_KEY=<ANON_KEY from deploy/landing-supabase/.env>
```

- [ ] **Step 5: Lint/build the landing app**

Run:
```bash
pnpm --filter marvel-slice lint
pnpm --filter marvel-slice build
```
Expected: both succeed.

- [ ] **Step 6: Commit (only if approved)**

```bash
git add apps/landing/.env.example apps/landing/index.html apps/landing/README.md apps/landing/PROJECT_DOCUMENTATION.txt README.md .env.production.example
git commit -m "docs(landing): point frontend at self-hosted supabase"
```

---

### Task 8: Import backed-up Storage files and rewrite URLs

**Files:**
- Create: `deploy/landing-supabase/setup/migrate-storage.mjs`
- Create: `deploy/landing-supabase/setup/rewrite-storage-urls.sql`

**Interfaces:**
- Consumes: local backup directory `<SOURCE>/<bucket>/<path...>`; `ANON_KEY`/`SERVICE_ROLE_KEY` from `.env`.
- Produces: objects uploaded to the new Storage backend; DB URLs rewritten to `https://marvelslice.com/storage/v1/object/public/...`.

- [ ] **Step 1: Create `setup/rewrite-storage-urls.sql`**

```sql
-- Rewrite old hosted Supabase public URLs to the same-origin base across all
-- text and JSON columns in the public schema.
do $$
declare
  old_url text := 'https://nxlsxywqvvuiljsulito.supabase.co/storage/v1/object/public/';
  new_url text := 'https://marvelslice.com/storage/v1/object/public/';
  r record;
begin
  for r in
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and data_type in ('text','character varying','jsonb','json')
  loop
    if r.data_type in ('jsonb','json') then
      execute format(
        'update public.%I set %I = replace(%I::text, %L, %L)::%s where %I::text like %L',
        r.table_name, r.column_name, r.column_name, old_url, new_url, r.data_type,
        r.column_name, '%' || old_url || '%'
      );
    else
      execute format(
        'update public.%I set %I = replace(%I, %L, %L) where %I like %L',
        r.table_name, r.column_name, r.column_name, old_url, new_url,
        r.column_name, '%' || old_url || '%'
      );
    end if;
  end loop;
end $$;
```

- [ ] **Step 2: Apply the rewrite and verify none remain**

Run:
```bash
docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d landing_prod < deploy/landing-supabase/setup/rewrite-storage-urls.sql
docker exec supabase-db psql -U postgres -d landing_prod -tAc "select count(*) from public.home_sections where content::text like '%nxlsxywqvvuiljsulito.supabase.co%'"
```
Expected: `0`.

- [ ] **Step 3: Create `setup/migrate-storage.mjs`**

```js
// Uploads backed-up bucket files into the self-hosted Storage API.
// Usage:
//   SUPABASE_URL=https://marvelslice.com SUPABASE_SERVICE_ROLE_KEY=... \
//   SOURCE_DIR=/path/to/backup node setup/migrate-storage.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || 'http://127.0.0.1:8000';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const root = process.env.SOURCE_DIR;

if (!key || !root) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY and SOURCE_DIR');
  process.exit(1);
}

const BUCKETS = ['hero-images', 'course-thumbnails', 'certificates', 'company-logos', 'nav-icons', 'pages'];
const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.pdf': 'application/pdf',
};

const supabase = createClient(url, key, { auth: { persistSession: false } });

function* walk(dir, base = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) yield* walk(full, rel);
    else yield { full, rel };
  }
}

for (const bucket of BUCKETS) {
  const dir = path.join(root, bucket);
  if (!fs.existsSync(dir)) { console.log(`skip ${bucket} (no backup dir)`); continue; }
  for (const { full, rel } of walk(dir)) {
    const body = fs.readFileSync(full);
    const contentType = MIME[path.extname(rel).toLowerCase()] || 'application/octet-stream';
    const { error } = await supabase.storage.from(bucket).upload(rel, body, { contentType, upsert: true });
    if (error) console.error(`FAIL ${bucket}/${rel}: ${error.message}`);
    else console.log(`OK   ${bucket}/${rel}`);
  }
}
console.log('Storage import complete.');
```

- [ ] **Step 4: Run the import against the backup and verify a public URL**

Run:
```bash
cd deploy/landing-supabase
SUPABASE_URL=http://127.0.0.1:8000 \
SUPABASE_SERVICE_ROLE_KEY=$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2) \
SOURCE_DIR=/path/to/storage-backup \
node setup/migrate-storage.mjs
curl -s -o /dev/null -w "%{http_code}\n" "http://127.0.0.1:8000/storage/v1/object/public/hero-images/<some-file>"
```
Expected: uploads log `OK`, and the URL returns `200`.

- [ ] **Step 5: Commit (only if approved)**

```bash
git add deploy/landing-supabase
git commit -m "feat(landing): add storage import and URL rewrite"
```

---

### Task 9: Post-setup glue, end-to-end verification, and rollback docs

**Files:**
- Create: `deploy/landing-supabase/setup/apply-post-setup.sh`
- Modify: `deploy/landing-supabase/README.md`

**Interfaces:**
- Consumes: Tasks 1–8.
- Produces: one command that waits for services and applies Realtime + Storage SQL; documented verification and rollback.

- [ ] **Step 1: Create `setup/apply-post-setup.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB="${POSTGRES_DB:-landing_prod}"
USER="${POSTGRES_USER:-postgres}"
CONTAINER="${SUPABASE_DB_CONTAINER:-supabase-db}"

wait_healthy() {
  local name="$1"
  for _ in $(seq 1 60); do
    if docker inspect --format '{{.State.Health.Status}}' "$name" 2>/dev/null | grep -q healthy; then
      echo "$name healthy"; return 0
    fi
    sleep 3
  done
  echo "ERROR: $name did not become healthy" >&2
  return 1
}

wait_healthy supabase-db
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB" < "$HERE/realtime.sql"
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$USER" -d "$DB" < "$HERE/storage.sql"
echo "Post-setup complete."
```

- [ ] **Step 2: Run it (bootstrap the first admin)**

Run:
```bash
cd deploy/landing-supabase
ADMIN_EMAIL=admin@marvelslice.com ADMIN_PASSWORD=admin123 \
POSTGRES_DB=landing_prod bash setup/apply-post-setup.sh
```
Expected: `Post-setup complete.` The seed has no admin rows, so the `ADMIN_EMAIL`/`ADMIN_PASSWORD` values bootstrap the first `master_admin`; omit them to skip.

- [ ] **Step 3: End-to-end verification**

Run each and confirm:

```bash
ANON=$(grep '^ANON_KEY=' .env | cut -d= -f2)

# REST read
curl -s -o /dev/null -w "rest=%{http_code}\n" -H "apikey: $ANON" "http://127.0.0.1:8000/rest/v1/courses?select=id&limit=1"

# RPC
curl -s -o /dev/null -w "rpc=%{http_code}\n" -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"p_email":"admin@marvelslice.com","p_password":"admin123"}' \
  "http://127.0.0.1:8000/rest/v1/rpc/verify_admin"

# Realtime health
curl -s -o /dev/null -w "realtime=%{http_code}\n" -H "Authorization: Bearer $ANON" \
  "http://127.0.0.1:8000/realtime/v1/api/tenants/realtime-dev/health"

# Storage public read
curl -s -o /dev/null -w "storage=%{http_code}\n" \
  "http://127.0.0.1:8000/storage/v1/object/public/hero-images/"
```

Expected: `rest=200` (or `206`), `rpc=200`, `realtime=200`, `storage` returns 200/400 (not 000/502).

In the browser:
1. Load `https://marvelslice.com` — home content + images render.
2. Log in at `/admin`, edit a course, reload — change persists.
3. Open the public chat widget and the admin chat panel in two windows — messages appear live.
4. Submit a contact form — the admin bell updates without refresh.

- [ ] **Step 4: Document rollback in `README.md`**

Append:

```markdown
## Verification

- `docker compose ... ps` — all services healthy.
- REST/RPC/realtime/storage curls in Task 9 of the plan return success.
- Public pages, admin login, chat realtime, and media library verified in browser.

## Rollback

1. In `.env.production`, restore the previous `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (hosted Supabase).
2. `docker compose -f docker-compose.prod.yml up -d landing` to regenerate
   `config.js` and restart the SPA.
3. Revert the nginx API locations + `extra_hosts` if desired.
4. The self-hosted stack can be stopped independently:
   `docker compose -f vendor/docker/docker-compose.yml -f docker-compose.override.yml --env-file .env down`
   (data persists in the `landing-supabase` volumes).
```

- [ ] **Step 5: Commit (only if approved)**

```bash
git add deploy/landing-supabase
git commit -m "docs(landing): add post-setup, verification, and rollback"
```

---

## Self-Review

**1. Spec coverage**

| Spec section | Task |
| --- | --- |
| Deployment stack (§Components 1) | Task 1 |
| DB bootstrap (§Components 2) | Task 3 |
| Realtime (§Components 3) | Task 4, 9 |
| Storage buckets + legacy migration (§Components 4) | Task 5, 8 |
| Auth/GoTrue (§Components 5) | Task 1 (gotrue service), Task 9 (`/auth/v1` health) |
| Gateway/nginx (§Components 6) | Task 6 |
| App config & docs (§Components 7) | Task 7 |
| Runbook (§Migration Runbook) | Task 1, 9 |
| Verification (§Verification) | Task 9 |
| Rollback (§Rollback) | Task 9 |

No uncovered spec requirements.

**2. Placeholder scan:** No `TBD`/`TODO`/vague steps. Every code/SQL/nginx/env block is complete. The only user-supplied values are the backup `SOURCE_DIR` path (Task 8) and DB/admin credentials (Task 9), which are inherently environment-specific.

**3. Type/name consistency:** `POSTGRES_DB=landing_prod`, container `supabase-db`, host bind `127.0.0.1:8000`, gateway image `supabase-envoy`, buckets, and realtime tables are identical everywhere they appear. Env var names `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` preserved throughout.

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-09-20-landing-selfhosted-supabase.md`. Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks.
2. **Inline Execution** — execute tasks in this session with checkpoints.

Which approach?
