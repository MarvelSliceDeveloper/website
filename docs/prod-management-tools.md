# Production Management Tools — pgAdmin & Portainer

This document explains how **pgAdmin** (PostgreSQL admin) and **Portainer**
(Docker management) are deployed in the production stack, how to reach them,
and the security model around them.

- **pgAdmin** runs on the internal `lms-network` and is reached through **nginx** (`pgadmin.lms.marvelslice.com`) with HTTP basic auth + TLS.
- **Portainer** is **server-only** — it binds to `127.0.0.1:9000` on the VPS host and is **never exposed to the public internet**. You reach it only via **SSH tunnel**.

```
                          ┌─────────────────────────────────────────────┐
   Internet  ── HTTPS ──▶  │  nginx (lms.marvelslice.com)                │
                          │                                             │
                          │  pgadmin.lms.marvelslice.com → pgadmin:80   │
                          │    (auth_basic  +  TLS  +  proxy_pass)      │
                          └───────────────┬─────────────────────────────┘
                                          │
                                     ┌────▼─────┐
                                     │ pgadmin  │
                                     └────┬─────┘
                                          │
                                     ┌────▼─────┐
                                     │ postgres │
                                     └──────────┘

   Portainer (server-only):
   VPS 127.0.0.1:9000 ◀── SSH tunnel ──▶  Laptop http://localhost:9000
          │
   ┌──────▼────────┐
   │ portainer     │  (mounts /var/run/docker.sock — controls host Docker)
   └───────────────┘
```

## Why

- **pgAdmin** — a web UI for directly inspecting/querying the production
  Postgres database (tables, queries, exports) without SSH-ing in.
- **Portainer** — a web UI for managing the Docker host: viewing containers,
  logs, networks, volumes, and restarting services, without the CLI.

## Security model

1. **pgAdmin** — not on a public host port; only reachable through nginx (TLS + `auth_basic` + its own login).
2. **Portainer — no public exposure at all.** It binds to `127.0.0.1:9000` (see `docker-compose.prod.yml:143` `ports: ["127.0.0.1:9000:9000"]`). No nginx server block, no DNS record, no TLS cert. Only someone with SSH access to the VPS can reach it.
3. **TLS for pgAdmin.** Its subdomain uses the same Let's Encrypt SAN certificate as the LMS app.
4. **Defense in depth for pgAdmin:**
   - nginx `auth_basic` (credentials in `deploy/nginx/htpasswd`) gates the whole site.
   - pgAdmin's own login (`PGADMIN_DEFAULT_EMAIL` / `PGADMIN_PASSWORD`).
5. **Git-ignored credentials.** `deploy/nginx/htpasswd` is gitignored so secrets never enter the repo.

> ⚠️ **Portainer has host-root-equivalent power.** It mounts
> `/var/run/docker.sock`, so anyone who logs into Portainer can control every
> container on the host. Server-only + SSH access limits this to VPS admins — treat its credentials as highly sensitive.

## Prerequisites

1. **DNS** — point one A record at the server's public IP:
   - `pgadmin.lms.marvelslice.com`
   - No record needed for Portainer (SSH tunnel only).
2. **Let's Encrypt cert** must include `pgadmin.lms.marvelslice.com` (see below). Portainer needs no cert.

## Setup

### 1. Create the basic-auth file (for pgAdmin)

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

### 3. Re-issue the TLS certificate to include pgAdmin subdomain

The nginx server block references the existing
`/etc/letsencrypt/live/www.marvelslice.com/` cert. Expand that cert's SAN list
to cover pgAdmin:

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certbot \
  certonly --webroot -w /var/www/certbot \
  -d www.marvelslice.com -d lms.marvelslice.com \
  -d pgadmin.lms.marvelslice.com
```

The nightly `certbot renew` cron keeps all of these domains renewed under the
same cert, so no further changes are needed. **Portainer is not in the cert** (not exposed via nginx).

### 4. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d pgadmin portainer
docker compose -f docker-compose.prod.yml up -d nginx   # reload config (pgAdmin only)
```

## Access

| Tool      | URL / Access                                     | Auth                                     |
| --------- | ------------------------------------------------ | ---------------------------------------- |
| pgAdmin   | `https://pgadmin.lms.marvelslice.com` (web)      | nginx basic auth → pgAdmin login         |
| Portainer | `http://localhost:9000` via SSH tunnel (server-only) | Portainer admin setup (first run)        |

### pgAdmin

Inside pgAdmin, register the server:

- **Host:** `postgres` (the compose service name, resolves on `lms-network`)
- **Port:** `5432`
- **Username / Database:** values from `POSTGRES_USER` / `POSTGRES_DB`
- **Password:** `POSTGRES_PASSWORD`

### Portainer (server-only)

From **your laptop** (keep the SSH session open while using Portainer):

```bash
# One-time: ensures Portainer is listening on the VPS localhost
# (check with: ssh root@<VPS_IP> "ss -tlnp | grep 9000")

# Create the tunnel
ssh -L 9000:localhost:9000 root@<VPS_IP>

# Then open in your laptop browser:
# http://localhost:9000  → Portainer first-run admin setup
```

- No DNS, no nginx, no `htpasswd` for Portainer — SSH key *is* the auth.
- If you close the SSH session, Portainer becomes unreachable again (by design).
- Alternative on the server itself (if you have desktop/VNC): `curl http://127.0.0.1:9000` or `http://127.0.0.1:9000` in a server-local browser.

## Rotating basic-auth credentials (pgAdmin only)

```bash
htpasswd -B deploy/nginx/htpasswd admin   # update existing user
# then reload nginx:
docker exec lms-nginx nginx -s reload
```

## Giving an instructor (or any extra person) access

Access to **pgAdmin** is controlled by `deploy/nginx/htpasswd` — the
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

> Note: this controls **who can reach** the pgAdmin login page.
> What they can _do_ inside pgAdmin is governed by pgAdmin's own accounts,
> so you can give an instructor entry-point access while keeping their in-tool privileges limited.
> **Portainer** has no `htpasswd` — access is via SSH. Grant SSH access to allow Portainer, revoke it to deny.

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

- `docker-compose.prod.yml` — `pgadmin` (nginx-routed) + `portainer` (`127.0.0.1:9000` server-only), volumes, and
  the `htpasswd` mount on `nginx` (pgAdmin only).
- `nginx.prod.conf` — `pgadmin_backend` upstream + one auth-protected HTTPS server block. **No Portainer block** (server-only).
- `.env.production.example` — `PGADMIN_EMAIL`, `PGADMIN_PASSWORD`.
- `deploy/nginx/htpasswd` — gitignored basic-auth file for pgAdmin (placeholder by default).
- `.gitignore` — ignores `deploy/nginx/htpasswd`.
