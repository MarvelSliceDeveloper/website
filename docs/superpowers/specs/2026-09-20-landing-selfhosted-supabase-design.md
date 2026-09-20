# Landing: Self-Hosted Supabase API Layer on Postgres

**Date:** 2026-09-20
**Status:** Approved (design) — pending spec review
**Owner:** Harish

## Problem

The public marketing site (`apps/landing`) is entirely backed by a **hosted Supabase
project** (`nxlsxywqvvuiljsulito.supabase.co`). Supabase has restricted that project:

> Service for this project is restricted due to the following violations:
> `exceed_cached_egress_quota`. The project owner must upgrade their plan or remove
> spend caps to restore service.

Consequences:

- The landing SPA can no longer read or write data (PostgREST is blocked).
- Real-time chat / admin notifications are down.
- Public Storage URLs (`*.supabase.co/storage/v1/object/public/...`) are no longer served,
  so existing images are broken.

The owner already runs Postgres for the LMS (prod `lms-postgres`, `postgres:16-alpine`)
and wants the landing site off the hosted Supabase service.

## Goal

Run the landing site against a **self-hosted Supabase open-source API layer backed by a
dedicated Postgres database**, with **no changes to the landing React code**.

## Non-Goals

- Moving the landing content into the LMS database/schema (`apps/api` Prisma models).
- Rewriting the landing data layer to a custom REST API.
- Removing the `@supabase/supabase-js` dependency from the frontend.
- Changing the LMS (`apps/api` / `apps/web`) stack or its `lms_prod` data.

## Current State (evidence)

| Item | Value |
| --- | --- |
| Data-access call sites | **447** `.from(...)` calls + 6 RPCs across ~90 files |
| Realtime channels | `messages`, `conversations`, and INSERT notifications on `brochure_downloads`, `form_submissions`, `contact_submissions`, `about_submissions`, `career_submissions`, `career_contact_submissions`, `newsletter_subscribers` |
| RPCs | `verify_admin`, `update_admin`, `delete_admin`, `update_own_profile`, `change_own_password`, `promote_upcoming_courses` |
| Supabase Auth usage | best-effort only (`getSession`, `signInWithPassword`, `signOut`, `onAuthStateChange`); real login is the `verify_admin` RPC |
| Storage | uploads already go to `landing-api:/api/upload` → local `uploads/`; Supabase Storage used by `MediaLibrary.jsx` + legacy public URLs |
| Schema | `apps/landing/schema.sql` (44 tables) + 33 files in `supabase/migrations/`; only extension needed is `pgcrypto` |
| Seed | `apps/landing/backup/seed.sql` (contains 24 `*.supabase.co/storage/...` URLs) |
| Frontend env | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (runtime-injected via `config.js`) |
| Prod topology | `lms-nginx` (8080) → `landing` (nginx static SPA) + `landing-api` (`dev-server.js:3001`) |

## Decisions

1. **Dedicated Postgres container** for the landing database, using the
   `supabase/postgres` image. This avoids altering/restarting the live `lms-postgres`
   (which would require `wal_level=logical`, Supabase roles cluster-wide, and downtime
   for the LMS). It is still a separate landing database (`landing_prod`).
2. **Self-host the Supabase open-source API layer** (PostgREST, Realtime, Storage,
   Auth/GoTrue, postgres-meta, imgproxy, API gateway). No frontend rewrite.
3. **Preserve frontend env variable names** `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`, so `supabaseClient.js` and all call sites are untouched.
4. **Same-origin routing**: expose the API layer under the landing domain
   (`https://marvelslice.com/rest/v1`, `/realtime/v1`, `/storage/v1`, `/auth/v1`) by
   adding locations to the existing landing nginx and proxying to the Supabase API
   gateway. This avoids a new subdomain/cert and keeps CSP simple (`'self'` + `wss:`).
5. **Storage backend = `file`** (mounted volume) for simplicity; bucket set mirrors the
   app: `hero-images`, `course-thumbnails`, `certificates`, `company-logos`,
   `nav-icons`, `pages`.

## Architecture

```
                          Browser (marvelslice.com)
                                    │  HTTPS
                                    ▼
        ┌──────────────────────────────────────────────────────────┐
        │ lms-nginx / landing nginx                                │
        │   /                → landing SPA (static)                │
        │   /api/*, /uploads/* → landing-api:3001                  │
        │   /rest/v1/*       → supabase api-gw:8000 → postgrest    │
        │   /auth/v1/*       → supabase api-gw:8000 → gotrue       │
        │   /storage/v1/*    → supabase api-gw:8000 → storage-api  │
        │   /realtime/v1/*   → supabase api-gw:8000 → realtime (WS)│
        └──────────────────────────────────────────────────────────┘
                                    │
                                    ▼
        ┌──────────────────────────────────────────────────────────┐
        │ supabase-postgres (supabase/postgres image)              │
        │   database: landing_prod                                 │
        │   roles: anon, authenticated, service_role,              │
        │          authenticator, supabase_admin, ...              │
        │   publication: supabase_realtime (conversations, messages,│
        │                *_submissions, newsletter_subscribers)     │
        └──────────────────────────────────────────────────────────┘
```

### Internal service ports

| Service | Image (pin to supabase/docker `master` at build time) | Port |
| --- | --- | --- |
| api-gw | `envoyproxy/envoy` (official `volumes/api/envoy`) | 8000 |
| rest | `postgrest/postgrest` | 3000 |
| realtime | `supabase/realtime` | 4000 |
| storage | `supabase/storage-api` | 5000 |
| imgproxy | `darthsim/imgproxy` | 5001 |
| auth | `supabase/gotrue` | 9999 |
| meta | `supabase/postgres-meta` | 8080 |
| db | `supabase/postgres` | 5432 |

## Components

### 1. Deployment stack (`deploy/landing-supabase/`)

A trimmed fork of the official `supabase/docker` compose containing only the services
the landing needs (no analytics/vector/logflare/functions/supavisor unless required by
a service's healthchecks).

- `docker-compose.yml` — services above, `db` service included (dedicated).
- `.env.example` — `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`,
  `SECRET_KEY_BASE`, `REALTIME_DB_ENC_KEY`, `S3_PROTOCOL_ACCESS_KEY_*`,
  `SUPABASE_PUBLIC_URL`, `PGRST_DB_SCHEMAS=public`, `STORAGE_BACKEND=file`, etc.
- `volumes/db/*.sql` — roles, realtime, jwt, `_supabase` init scripts adapted from the
  official image (run by the `supabase/postgres` entrypoint on first boot).
- `volumes/api/envoy/*` — gateway config routing `/rest/v1`, `/auth/v1`,
  `/storage/v1`, `/realtime/v1`.
- `utils/generate-keys.sh` — produces `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`.
- `README.md` — runbook.

### 2. Database bootstrap

On first `docker compose up`, the `supabase/postgres` image creates Supabase roles and
schemas. A one-shot bootstrap then loads the landing schema into `landing_prod`:

1. Create database `landing_prod`.
2. Load `apps/landing/schema.sql` (44 tables, `pgcrypto`).
3. Apply `apps/landing/supabase/migrations/*.sql` in filename order (33 files),
   including `secure_admin_auth_migration.sql` (bcrypt `verify_admin`, audit logs,
   hardened grants to `anon`/`authenticated`).
4. Load `apps/landing/backup/seed.sql` (or a fresher production dump — see Open
   Questions).
5. Grant table/schema privileges to `anon`, `authenticated`, `service_role`.

Deliverable: `deploy/landing-supabase/setup/load-landing-db.sh` + documented manual
`psql` commands.

### 3. Realtime

- Ensure `supabase_realtime` publication includes:
  `conversations`, `messages`, `brochure_downloads`, `form_submissions`,
  `contact_submissions`, `about_submissions`, `career_submissions`,
  `career_contact_submissions`, `newsletter_subscribers`.
- Set `REPLICA IDENTITY FULL` on `messages` and `conversations` (filtered/updated
  payloads) as needed; `messages` uses a `conversation_id` filter on INSERT.
- Verify `wal_level=logical`, a replication slot, and `max_replication_slots > 0` on
  the dedicated DB (handled by the `supabase/postgres` config).

Deliverable: `deploy/landing-supabase/setup/realtime.sql`.

### 4. Storage

- Configure Storage API with `STORAGE_BACKEND=file` and a mounted volume
  (`/var/lib/storage`).
- Create buckets + public-read policies:
  `hero-images`, `course-thumbnails`, `certificates`, `company-logos`, `nav-icons`,
  `pages`.
- **Legacy asset migration**: download every object from the old Supabase buckets and
  upload it into the new storage, then rewrite URLs in the database.
  - URL transform:
    `https://nxlsxywqvvuiljsulito.supabase.co/storage/v1/object/public/<bucket>/<path>`
    → `https://marvelslice.com/storage/v1/object/public/<bucket>/<path>`
  - Apply the rewrite to all text/JSON columns that may contain URLs
    (`courses.hero_image_url`, `video_thumbnail_url`, `cta_background_image`,
    `site_settings.*`, `nav_pages.hero_image`, `home_sections.content`,
    `testimonials.avatar_url`, `certifications.certificate_image_url`, etc.).

Deliverable: `deploy/landing-supabase/setup/migrate-storage.mjs` (list → download →
upload → emit SQL rewrite), plus `storage.sql` for buckets/policies.

### 5. Auth

- Include GoTrue so `supabase.auth.getSession()/onAuthStateChange()` do not fail.
- Real admin login continues to use the `verify_admin` RPC (bcrypt via `pgcrypto`),
  which is unchanged.
- GoTrue is configured with the same `JWT_SECRET`; signup disabled
  (`DISABLE_SIGNUP=true`) since the app has no self-serve accounts.

### 6. Gateway / nginx

- New locations on the landing nginx (and/or `lms-nginx`) for `/rest/v1`, `/auth/v1`,
  `/storage/v1`, `/realtime/v1` (WebSocket upgrade headers: `Upgrade`, `Connection`).
- `VITE_SUPABASE_URL=https://marvelslice.com` (same-origin).
- Remove `*.supabase.co` / `nxlsxywqvvuiljsulito` from `apps/landing/index.html` CSP;
  allow `wss:` for realtime. Keep `img-src`/`connect-src` to `'self'` + required
  third parties (Google Maps, GA).

### 7. App config & docs

| File | Change |
| --- | --- |
| `apps/landing/.env.example` | Document self-hosted `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |
| `apps/landing/index.html` | CSP: drop `*.supabase.co`, add same-origin + `wss:` |
| `apps/landing/README.md` | Backend = self-hosted Supabase stack on Postgres |
| `apps/landing/PROJECT_DOCUMENTATION.txt` | Same |
| root `README.md` | Landing backend description |
| root `.env.production.example` | Add self-hosted Supabase vars / point to deploy dir |
| `docker-compose.prod.yml` | Wire landing Supabase services or document external compose |

## Data Flow

- **Read**: SPA → `supabase.from('courses').select(...)` → `GET /rest/v1/courses` →
  nginx → api-gw → PostgREST → `landing_prod`.
- **Write (admin)**: SPA → `insert/update` → `/rest/v1/...` → PostgREST → DB.
- **Login**: `supabase.rpc('verify_admin', {...})` → `POST /rest/v1/rpc/verify_admin`.
- **Realtime**: `supabase.channel('messages:...')` → `wss://marvelslice.com/realtime/v1`
  → Realtime subscribes to `supabase_realtime` publication.
- **Upload**: `ImageUploader` → `POST /api/upload` → `landing-api` local `uploads/`
  (unchanged); `MediaLibrary` list/delete → new Storage API.

## Migration Runbook (server)

1. Copy `deploy/landing-supabase/` to the server; fill `.env`.
2. Run `utils/generate-keys.sh`; record `ANON_KEY` for the frontend.
3. `docker compose up -d db`; wait for healthy.
4. `setup/load-landing-db.sh` (schema + migrations + seed/dump).
5. `setup/realtime.sql`, `setup/storage.sql`.
6. `docker compose up -d` (rest, realtime, storage, imgproxy, auth, meta, api-gw).
7. Add nginx locations for the API paths; reload nginx.
8. Update `.env.production` `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; restart
   landing container (runtime `config.js`).
9. Run `setup/migrate-storage.mjs` to import legacy assets + rewrite URLs.
10. Verify (below).

## Verification

- `docker compose config` parses; all services healthy.
- `curl -H "apikey: $ANON" "$URL/rest/v1/courses?select=id&limit=1"` → 200.
- `curl "$URL/rest/v1/rpc/verify_admin" -d '{"p_email":...,"p_password":...}'` → admin JSON.
- Landing public pages load content; images render from `marvelslice.com/storage/v1/...`.
- Admin login works; create/edit a course persists.
- Open two browsers: public chat widget + admin chat panel; messages appear live.
- Admin notification bell receives a new submission without refresh.
- `pnpm lint` / build for `apps/landing` still pass.

## Rollback

- Keep the hosted Supabase project untouched (read-only) until verification passes.
- Revert `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env.production` and restart
  the landing container to fall back to the previous backend.
- Revert CSP/nginx changes if needed.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Hosted project restricted → cannot dump data/assets | Require a pre-existing DB dump + storage backup before starting; otherwise seed only |
| Supabase image version drift | Pin image tags; vendor the compose + envoy config into the repo |
| Realtime payload/filter mismatches | Set `REPLICA IDENTITY FULL`; test chat end-to-end |
| nginx WS proxying issues | Explicit `Upgrade`/`Connection` headers; verify with `wscat` |
| Same-origin path collisions | Reserve `/rest/v1`, `/auth/v1`, `/storage/v1`, `/realtime/v1`; no app routes use them |
| `verify_admin` needs `request.headers` | PostgREST sets it; tested via RPC call |
| CSP blocks realtime/websocket | Add `wss:` and same-origin; test in browser console |

## Resolved Questions

1. **Data source**: no full production dump is available; the **seed script**
   (`apps/landing/backup/seed.sql`) is the source of truth for initial content. Post-export
   rows are out of scope.
2. **Storage files**: the bucket files **are backed up** and available; the migration
   script imports them into the new Storage backend.
3. **Domain**: **same-origin** — API served at `https://marvelslice.com/rest/v1`,
   `/auth/v1`, `/storage/v1`, `/realtime/v1`. `VITE_SUPABASE_URL=https://marvelslice.com`.

## Remaining Questions

4. **Supabase Studio** required for DB browsing, or is the existing `pgAdmin` enough?
   (Default: omit Studio to reduce containers.)
5. **Server resources**: confirm Docker capacity for the extra ~7 containers.

## Out of Scope

- Deleting/decommissioning the hosted Supabase project.
- Migrating the LMS database or API.
- Frontend feature work beyond config/CSP.
