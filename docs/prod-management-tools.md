# Production Management Tools — pgAdmin & Portainer

This document explains how **pgAdmin** (PostgreSQL admin) and **Portainer**
(Docker management) are deployed in the production stack, how to reach them,
and the security model around them.

Both tools run as additional containers in `docker-compose.prod.yml`. They are
**not** published on raw host ports — they live only on the internal
`lms-network` and are reached through the existing **nginx** reverse proxy,
protected by HTTP basic auth **in front of** each tool's own login.

```
                          ┌─────────────────────────────────────────────┐
   Internet  ── HTTPS ──▶ │  nginx (lms.marvelslice.com)                │
                          │                                             │
                          │  pgadmin.lms.marvelslice.com   → pgadmin:80 │
                          │  portainer.lms.marvelslice.com → portainer:9000│
                          │    (auth_basic  +  TLS  +  proxy_pass)      │
                          └───────────────┬───────────────┬─────────────┘
                                         │               │
                                    ┌────▼─────┐    ┌────▼────────┐
                                    │ pgadmin  │    │ portainer   │
                                    │          │    │ (docker.sock)│
                                    └────┬─────┘    └────┬────────┘
                                         │               │
                                    ┌────▼─────┐    (controls host Docker)
                                    │ postgres │
                                    └──────────┘
```

## Why

- **pgAdmin** — a web UI for directly inspecting/querying the production
  Postgres database (tables, queries, exports) without SSH-ing in.
- **Portainer** — a web UI for managing the Docker host: viewing containers,
  logs, networks, volumes, and restarting services, without the CLI.

## Security model

1. **No public ports.** Neither pgAdmin nor Portainer bind to a host port.
   They are only reachable through nginx.
2. **TLS everywhere.** Both subdomains use the same Let's Encrypt SAN
   certificate as the LMS app.
3. **Two layers of auth (defense in depth):**
   - nginx `auth_basic` (credentials in `deploy/nginx/htpasswd`) gates the
     whole site.
   - Each tool then has its own login (pgAdmin `PGADMIN_DEFAULT_EMAIL` /
     `PGADMIN_PASSWORD`; Portainer's first-run admin setup).
4. **Git-ignored credentials.** `deploy/nginx/htpasswd` is gitignored so
   secrets never enter the repo.

> ⚠️ **Portainer has host-root-equivalent power.** It mounts
> `/var/run/docker.sock`, so anyone who logs into Portainer can control every
> container on the host. This is the normal Portainer model, but treat its
> credentials as highly sensitive.

## Prerequisites

1. **DNS** — point two A records at the server's public IP:
   - `pgadmin.lms.marvelslice.com`
   - `portainer.lms.marvelslice.com`
2. **Let's Encrypt cert** must include the two new subdomains (see below).

## Setup

### 1. Create the basic-auth file

On the server (needs `apache2-utils`, or use `openssl`):

```bash
# Using htpasswd (apache2-utils)
htpasswd -cB deploy/nginx/htpasswd admin
# (you will be prompted for a password)

# OR using openssl (no htpasswd binary needed)
openssl passwd -apr1 >> /dev/null   # prints a hash; manual edit instead
# Simpler: use the htpasswd binary if available.
```

The file format is `username:hash` (one line). nginx reads it from
`/etc/nginx/htpasswd` (mounted from `deploy/nginx/htpasswd`).

> A default `deploy/nginx/htpasswd` already exists in the repo (gitignored)
> with user `admin`. **Regenerate it with your own strong password before
> going live** — the default is only a placeholder.

### 2. Add pgAdmin credentials to `.env.production`

```bash
PGADMIN_EMAIL=admin@marvelslice.com
PGADMIN_PASSWORD=<strong-password>
```

### 3. Re-issue the TLS certificate to include the subdomains

The nginx server blocks reference the existing
`/etc/letsencrypt/live/www.marvelslice.com/` cert. Expand that cert's SAN list
to cover the two new subdomains:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d www.marvelslice.com -d lms.marvelslice.com \
  -d pgadmin.lms.marvelslice.com -d portainer.lms.marvelslice.com
```

The nightly `certbot renew` cron keeps all of these domains renewed under the
same cert, so no further changes are needed.

### 4. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d pgadmin portainer
docker compose -f docker-compose.prod.yml up -d nginx   # reload config
```

## Access

| Tool      | URL                                      | Auth                                  |
| --------- | ---------------------------------------- | ------------------------------------- |
| pgAdmin   | `https://pgadmin.lms.marvelslice.com`    | nginx basic auth → pgAdmin login      |
| Portainer | `https://portainer.lms.marvelslice.com`  | nginx basic auth → Portainer admin setup |

Inside pgAdmin, register the server:
- **Host:** `postgres` (the compose service name, resolves on `lms-network`)
- **Port:** `5432`
- **Username / Database:** values from `POSTGRES_USER` / `POSTGRES_DB`
- **Password:** `POSTGRES_PASSWORD`

## Rotating basic-auth credentials

```bash
htpasswd -B deploy/nginx/htpasswd admin   # update existing user
# then reload nginx:
docker exec lms-nginx nginx -s reload
```

## Giving an instructor (or any extra person) access

Access is controlled entirely by the `deploy/nginx/htpasswd` file — the
admin owns it. To grant an instructor their own login (so they don't
share the admin password), add a line for them:

```bash
# Add a new instructor user (prompts for password)
htpasswd -B deploy/nginx/htpasswd instructor

# Add any other named user as needed
htpasswd -B deploy/nginx/htpasswd jane.doe

# Remove a user's access
htpasswd -D deploy/nginx/htpasswd instructor

# Apply without restarting the container:
docker exec lms-nginx nginx -s reload
```

> Note: this controls **who can reach** the pgAdmin/Portainer login page.
> What they can *do* inside each tool is governed by that tool's own accounts
> (pgAdmin server logins / Portainer user roles), so you can give an
> instructor entry-point access while keeping their in-tool privileges
> limited.

A placeholder `admin` user exists in the repo's gitignored
`deploy/nginx/htpasswd` — **regenerate it with your own strong password
before going live**.

## Backups

The tools' own state persists in named volumes:

- `pgadmin_data` — pgAdmin saved connections / preferences
- `portainer_data` — Portainer config and user accounts

Back these up with `docker volume` export (e.g. `docker run --rm -v
pgadmin_data:/data -v $(pwd):/backup alpine tar czf /backup/pgadmin_data.tar.gz
-C /data .`) or your existing volume-backup routine. The database itself is
backed up separately — see `docs/database-backup.md`.

## Files touched

- `docker-compose.prod.yml` — `pgadmin` + `portainer` services, volumes, and
  the `htpasswd` mount on `nginx`.
- `nginx.prod.conf` — `pgadmin_backend` / `portainer_backend` upstreams and two
  auth-protected HTTPS server blocks.
- `.env.production.example` — `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`.
- `deploy/nginx/htpasswd` — gitignored basic-auth file (placeholder by default).
- `.gitignore` — ignores `deploy/nginx/htpasswd`.
