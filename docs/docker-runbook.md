# Docker Runbook — MarvelSlice LMS (Production)

Commands assume you are in `/opt/lms/website` on the VPS and the compose file is
`docker-compose.prod.yml`.

## Environment model (important)

| Layer | How it gets env | Change workflow |
| --- | --- | --- |
| `api`, `landing-api`, `postgres`, `redis` | runtime via `env_file: .env.production` | edit `.env.production` → `docker compose up -d <service>` |
| `landing` (static SPA) | **runtime config injection**: container entrypoint writes `/usr/share/nginx/html/config.js` from `VITE_*` env (from `env_file`) at start | edit `.env.production` → `docker compose up -d landing` (NO rebuild) |
| `web` (Next.js) | server-side env via `env_file` (runtime); `NEXT_PUBLIC_*` is **build-time** | runtime vars: `up -d web`; public vars: `up -d --build web` |

The landing SPA used to bake `VITE_*` at build time (requiring `--env-file` at
build and a full rebuild). It now reads `window.__ENV__` from `/config.js` at
runtime, so editing `.env.production` + restarting the container is enough.

## Start / stop / status

```bash
# start everything (detached)
docker compose -f docker-compose.prod.yml up -d

# stop everything
docker compose -f docker-compose.prod.yml down

# status of all containers
docker compose -f docker-compose.prod.yml ps
docker ps
```

## Logs

```bash
# all services, streaming
docker compose -f docker-compose.prod.yml logs -f

# one service, streaming (Ctrl+C to stop)
docker compose -f docker-compose.prod.yml logs -f landing
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f landing-api

# last N lines, no follow
docker compose -f docker-compose.prod.yml logs --tail=50 landing
# equivalent direct form:
docker logs --tail=50 lms-landing
```

## Restart a service (applies new env_file values)

```bash
docker compose -f docker-compose.prod.yml restart landing
```

## Pull new code + rebuild + run a service

```bash
git pull origin Marvel_Slice
docker compose -f docker-compose.prod.yml up -d --build landing
# for Next.js NEXT_PUBLIC_* changes use: up -d --build web
```

## Landing env update flow (no rebuild needed)

1. Edit the VITE vars in `.env.production`:
   ```bash
   nano /opt/lms/website/.env.production
   # VITE_SUPABASE_URL=https://nxlsxywqvvuiljsulito.supabase.co
   # VITE_SUPABASE_ANON_KEY=eyJ...your-key
   ```
2. Restart the landing container — the entrypoint regenerates `/config.js`:
   ```bash
   docker compose -f docker-compose.prod.yml up -d landing
   ```
3. Verify the generated config:
   ```bash
   docker exec lms-landing cat /usr/share/nginx/html/config.js
   ```
4. Hard-refresh `marvelslice.com`.

## Verify the landing API (forms → landing-api:3001)

```bash
curl -s -X POST http://localhost/api/submit-contact -H "Host: marvelslice.com" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test","email":"t@e.com","phone":"123","message":"hi"}'
# expect: {"success":true}
docker logs lms-landing-api --tail 2
```
