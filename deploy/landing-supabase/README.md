# Landing self-hosted Supabase

Runs the landing site's API layer (PostgREST + Realtime + Storage + Auth) on a
dedicated Postgres database (`landing_prod`). The LMS database (`lms-postgres`)
is never touched.

## Quick start (server)

```bash
bash setup/fetch-upstream.sh
cp .env.example .env
node setup/generate-keys.mjs

# Starts db + rest + storage (storage-api creates the `storage` schema that
# schema.sql writes to), loads schema + migrations + seed, then grants
# table privileges to anon/authenticated/service_role.
POSTGRES_DB=landing_prod bash setup/load-landing-db.sh

docker compose -f vendor/docker/docker-compose.yml -f docker-compose.override.yml --env-file .env up -d

# Realtime + storage policies, and optional first admin bootstrap.
ADMIN_EMAIL=admin@marvelslice.com ADMIN_PASSWORD=admin123 \
POSTGRES_DB=landing_prod bash setup/apply-post-setup.sh
```

> `apps/landing/backup/seed.sql` contains no admin rows, so `admin_profiles`
> starts empty. Set `ADMIN_EMAIL`/`ADMIN_PASSWORD` above to create the first
> `master_admin`, or call `public.bootstrap_master_admin(...)` manually.

Then:

1. Wire nginx (see the plan, Task 6) so `/rest/v1`, `/auth/v1`, `/storage/v1`,
   and `/realtime/v1` proxy to `host.docker.internal:8000`.
2. Set `VITE_SUPABASE_URL=https://marvelslice.com` and
   `VITE_SUPABASE_ANON_KEY=<ANON_KEY from .env>` in `.env.production`, then
   restart the landing container.
3. Import storage backups (Task 8).

## Services

| Service | Container | Purpose |
| --- | --- | --- |
| db | `supabase-db` | `supabase/postgres` hosting `landing_prod` |
| rest | `supabase-rest` | PostgREST (`.from`, `.rpc`) |
| realtime | `realtime-dev.supabase-realtime` | WebSocket realtime |
| storage | `supabase-storage` | Storage API (file backend) |
| auth | `supabase-auth` | GoTrue (session endpoints) |
| api-gw | `supabase-envoy` | API gateway |

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
   (data persists in named volumes).
