# Docker Deployment Guide (Production)

> **Beginner-friendly.** Every command in this guide is explained so you know what
> it does — not just _that_ it works. If you'd rather run the app **without Docker**,
> see [manual-server-setup.md](manual-server-setup.md).

## What this doc covers

This document explains how to deploy the MarvelSlice LMS to your own server (a VPS —
DigitalOcean, Hetzner, OVH, Vultr, etc.) using **Docker Compose**. It covers:

1. The architecture and how the pieces fit together
2. Everything you need to do **once** (DNS, install Docker, secrets)
3. Building and starting the stack
4. SSL certificates for your two domains
5. Deploying updates (manual + automatic via GitHub Actions)
6. Backups, verification, and troubleshooting

## Architecture

Your setup uses **two domains** pointing at one server:

| Domain                | What it serves                                       |
| --------------------- | ---------------------------------------------------- |
| `www.marvelslice.com` | The public marketing/landing site (Vite + React SPA) |
| `lms.marvelslice.com` | The LMS app (Next.js web + Express API)              |

```
                          Internet
                             │
                     ┌───────▼───────┐
                     │ Apache/Webuzo │  ports 80 + 443 (SSL terminated here)
                     └───────┬───────┘
                             │ HTTP proxy to 127.0.0.1:8080
                     ┌───────▼───────┐
                     │  nginx (HTTP) │  127.0.0.1:8080 only
                     └───┬───────┬───┘
          www.marvelslice.com   lms.marvelslice.com
                 │                    │
         ┌───────▼──────┐      ┌──────▼──────────────────────┐
         │ landing       │      │ web (Next.js :3000)         │
         │ (nginx :80)   │      │   /api → api:4000 (nginx)   │
         │  └─ landing-  │      │   /uploads, /images → api   │
         │     api:3001  │      │   /socket.io → api (WS)     │
         └───────────────┘      └──────┬──────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │ api (Express    │
                              │  :4000)         │
                              └───┬───────┬─────┘
                                  │       │
                           postgres:5432  redis:6379
```
> **HTTP-only:** Webuzo/Apache handles SSL and proxies `https://` to Docker nginx on `127.0.0.1:8080`. Docker nginx never sees 443 and needs no certbot. If you run **without** Webuzo (direct VPS), add `127.0.0.1:8443:443` and certbot volumes — see `docs/apache-proxy.md` for the Apache vhost and `nginx.prod.conf` notes.

Ten containers are started (pgAdmin is an optional web management UI; Portainer is server-only via SSH tunnel — both covered in [Part 5½](#management-uis--pgadmin--portainer)):

| Container     | Runs                              | Listens on                        |
| ------------- | --------------------------------- | --------------------------------- |
| `nginx`       | Reverse proxy (HTTP only)         | 127.0.0.1:8080 via Apache/Webuzo  |
| `api`         | Express + Prisma API              | internal 4000                     |
| `web`         | Next.js app (standalone build)    | internal 3000                     |
| `landing`     | Static landing site via nginx     | internal 80                       |
| `landing-api` | Landing contact form email server | internal 3001                     |
| `postgres`    | Database                          | internal 5432                     |
| `redis`       | Cache / realtime pub-sub          | internal 6379                     |
| `certbot`     | Let's Encrypt SSL renewals        | none (runs periodically)          |
| `pgadmin`     | pgAdmin 4 — Postgres admin web UI | internal 80 (via nginx subdomain) |
| `portainer`   | Portainer — Docker visual GUI     | 127.0.0.1:9000 on host (SSH tunnel only) |

## Prerequisites

- A **VPS** running **Ubuntu 22.04 or 24.04** (min 2GB RAM recommended, 1GB works with swap)
- SSH access to it as `root` (or a user with sudo)
- The **two domain names** (`www.marvelslice.com`, `lms.marvelslice.com`)
  pointing at the VPS's public IP
- The LMS code pushed to a **GitHub repo** you own (for CI/CD)
- A computer (laptop) with SSH — you'll do most work from the VPS

## Part 0 — Point your domains at the server

Log in to your DNS provider (where you bought the domain, or Cloudflare, etc.)
and create two **A records**:

| Host      | Type | Value (your VPS public IP)    |
| --------- | ---- | ----------------------------- |
| `www`     | A    | `203.0.113.10` (your real IP) |
| `lms`     | A    | `203.0.113.10` (same IP)      |
| `pgadmin` | A    | `203.0.113.10` (same IP)      |

> `pgadmin.lms.marvelslice.com` serves pgAdmin (see [Part 5½](#management-uis--pgadmin--portainer)) and shares the SAN certificate from Part 3. **Portainer is NOT on the web** — it binds to `127.0.0.1:9000` on the server and is accessed only via SSH tunnel (no DNS record needed).

> A **DNS A record** says "this hostname → this IP address". Both hostnames go to
> the same VPS; nginx tells them apart by the `Host` header.
>
> Wait 5–30 minutes for DNS to propagate. You can check later with:
> `nslookup www.marvelslice.com`

---

## Part 1 — Connect to your server and install Docker (one-time)

### 1.1 SSH into the server

```bash
ssh root@203.0.113.10
```

- `ssh` = Secure Shell — encrypted remote login.
- `root@` = log in as the admin user (or use `ubuntu@` on some providers).
- `203.0.113.10` = your VPS's public IP (replace with the real one).

### 1.2 Update the system

```bash
apt update && apt upgrade -y
```

- `apt update` — refreshes the list of available software packages.
- `apt upgrade -y` — installs security/software updates (`-y` = don't ask, just do it).

### 1.3 Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

- `curl` — downloads a file from a URL (`-fsSL` = fail silently, show errors).
- `| sh` — pipes that download straight into the shell to run it.
- This official script installs Docker Engine + the Compose plugin.

### 1.4 Verify Docker works

```bash
docker --version
docker compose version
```

- `docker --version` — shows the installed Docker version.
- `docker compose version` — shows the Compose plugin (the `compose` subcommand).

---

## Part 2 — Get the code onto the server (one-time)

### 2.1 Create an app directory

```bash
mkdir -p /opt/lms
cd /opt/lms
```

- `mkdir -p /opt/lms` — **m**a**k**e **dir**ectory `-p` (create parents if missing) at `/opt/lms`.
- `/opt` is the standard Linux location for third-party app software.
- `cd /opt/lms` — **c**hange **d**irectory into it.

### 2.2 Clone your repository

```bash
git clone https://github.com/your-username/lms-portal.git .
```

- `git clone <url> .` — downloads the repo into the **current** directory (the `.`).
- Replace the URL with your actual repository URL.

### 2.3 Copy the example environment file

```bash
cp .env.production.example .env.production
```

- `cp` — co**p**ies a file.
- `.env.production` holds all your **secrets and settings** for production.
- It is **gitignored**, so it never gets committed to GitHub.

### 2.4 Fill in your secrets

Edit the file:

```bash
nano .env.production
```

- `nano` — a simple command-line text editor. Save with `Ctrl+O`, Enter; exit with `Ctrl+X`.

At minimum, replace these placeholders (the file has comments explaining each):

| Key                                                         | What to put                                            | How to generate           |
| ----------------------------------------------------------- | ------------------------------------------------------ | ------------------------- |
| `POSTGRES_PASSWORD`                                         | Strong DB password                                     | `openssl rand -base64 24` |
| `JWT_SECRET`                                                | Random 64-char string                                  | `openssl rand -base64 48` |
| `CSRF_SECRET`                                               | Random 64-char string                                  | `openssl rand -base64 48` |
| `NEXTAUTH_SECRET`                                           | Random 64-char string                                  | `openssl rand -base64 48` |
| `TOKEN_ENCRYPTION_KEY`                                      | Random 32-byte base64                                  | `openssl rand -base64 32` |
| `MS_WEBHOOK_CLIENT_STATE`                                   | Random 64-char string                                  | `openssl rand -base64 48` |
| `BREVO_API_KEY`                                             | Your Brevo API key                                     | from Brevo dashboard      |
| `EMAIL_FROM_EMAIL`                                          | `noreply@lms.marvelslice.com`                          | —                         |
| `SMTP_EMAIL` / `SMTP_PASSWORD`                              | Gmail SMTP for landing forms                           | Gmail app password        |
| `ADMIN_EMAIL`                                               | Your admin inbox                                       | —                         |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`                   | Razorpay keys                                          | Razorpay dashboard        |
| `YOUTUBE_API_KEY`                                           | YouTube Data API key                                   | Google Cloud Console      |
| `IMAGE_NAME`                                                | `your-username/lms-portal`                             | your GitHub repo          |
| `PGADMIN_EMAIL`                                             | `admin@marvelslice.com`                                | pgAdmin login email       |
| `PGADMIN_PASSWORD`                                          | Strong password for pgAdmin                           | `openssl rand -base64 24` |
| `API_URL`, `WEB_URL`, `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL` | `https://lms.marvelslice.com` (+ `/api` for `API_URL`) | already correct           |

> `openssl rand -base64 24` — generates 24 random bytes encoded as base64 text.
> Good for passwords. The output looks like `fK3m...==`.

### 2.5 Create the management-UI basic-auth file (required for pgAdmin)

pgAdmin is protected by an nginx `auth_basic` prompt that reads
`/etc/nginx/htpasswd` (mounted from `deploy/nginx/htpasswd`). **nginx will fail
to start if this file is missing**, so create it now (Portainer is server-only via SSH tunnel and does not use this file):

```bash
mkdir -p deploy/nginx
# Install htpasswd on Debian/Ubuntu first if needed:
apt install -y apache2-utils
htpasswd -cB deploy/nginx/htpasswd admin
```

- `htpasswd -cB` — create (`-c`) a bcrypt-hashed (`-B`) password file for user
  `admin`. You'll be prompted for a password — use a strong, unique one.
- Add more users with `htpasswd -B deploy/nginx/htpasswd <username>` (omit `-c`
  so you don't overwrite the first user).
- `deploy/nginx/htpasswd` is **gitignored**, so it never gets committed.

### 2.6 Landing page env (build-time + landing-api)

The landing site is a static Vite SPA plus a small contact-form email API
(`landing-api`):

- **`landing-api`** (runtime, via `env_file`) needs `SMTP_EMAIL`,
  `SMTP_PASSWORD`, and `ADMIN_EMAIL` — already listed in Part 2.4. The contact /
  enquiry forms POST to relative `/api/*` paths, which nginx routes to
  `landing-api:3001`, so **no extra URL env is required**.
- **`landing` SPA** (build-time) bakes in `VITE_GA_MEASUREMENT_ID`,
  `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` from `.env.production`. These
  are passed as Docker **build args** (see `apps/landing/Dockerfile`), so set
  them in `.env.production` *before* running `docker compose build`.

---

## Part 3 — SSL: Webuzo handles it (HTTP-only Docker nginx)

**Your server uses Webuzo/Apache on host ports 80/443. Webuzo terminates SSL and reverse-proxies to Docker nginx on `127.0.0.1:8080`.** That means `nginx.prod.conf` is **HTTP-only** (all `server { listen 80 }` blocks) and Docker **does not need certbot** or 443.

Set up SSL once in Webuzo panel (Let’s Encrypt for `www.marvelslice.com` + `lms.marvelslice.com` + `pgadmin.lms.marvelslice.com`), then point Apache vhosts to `ProxyPass http://127.0.0.1:8080/` per `docs/apache-proxy.md`. No bootstrap / `docker-compose.bootstrap.yml` needed when Webuzo is in front.

> **Without Webuzo?** If you run Docker nginx directly on 80/443, you do need certbot. Then `nginx.prod.conf` would need `listen 443 ssl` blocks and `certbot` service uncommented in `docker-compose.prod.yml`. In that case follow the old flow: `docker compose -f docker-compose.prod.yml -f docker-compose.bootstrap.yml up -d nginx` → `certbot certonly --webroot ... -d www.marvelslice.com -d lms.marvelslice.com` → `docker compose -f docker-compose.prod.yml up -d`. The `nginx.prod.bootstrap.conf` and `deploy/certbot/` files are kept for that mode.

### 3.1 Start everything (Webuzo mode — no cert step)

```bash
docker compose -f docker-compose.prod.yml up -d
```

- Builds and starts **all** containers (api, web, landing, landing-api, postgres, redis, nginx, **pgadmin**, **portainer**). `certbot` stays commented out — Apache handles renewals.

### 3.2 Check it's working

```bash
docker compose -f docker-compose.prod.yml ps
```

- `ps` — "process status": lists running containers, their health and ports.

```bash
curl -f http://127.0.0.1:8080/health
# (Docker nginx is HTTP-only on 8080; Apache/Webuzo proxies HTTPS to it. Direct api: docker compose -f docker-compose.prod.yml exec api wget -qO- http://localhost:4000/health)
```

- `curl -f` — fetch a URL, fail loudly if not HTTP 2xx.
- The API health endpoint should return `{"status":"ok",...}`.

Then open in your browser:

- `https://www.marvelslice.com` → landing page
- `https://lms.marvelslice.com` → LMS (you should be redirected to login)
- `https://lms.marvelslice.com/health` → API health JSON

---

## Part 4 — Seed the database (one-time)

The first time the API boots it runs `prisma db push` automatically (see
`apps/api/entrypoint.sh`), which creates all tables. Now create the admin user:

```bash
docker compose -f docker-compose.prod.yml exec api npx prisma db seed
```

- `exec api ...` — run a command **inside** the running `api` container.
- `npx prisma db seed` — runs `apps/api/prisma/seed.ts`, creating the default users.

Default accounts (change passwords after first login!):

| Role       | Email                  | Password        |
| ---------- | ---------------------- | --------------- |
| Admin      | `admin@lms.local`      | `admin123`      |
| Instructor | `instructor@lms.local` | `instructor123` |
| Student    | `student@lms.local`    | `student123`    |

---

## Management UIs — pgAdmin & Portainer

**pgAdmin** is an optional web tool for the database (via `https://pgadmin.lms.marvelslice.com`, behind nginx basic auth). **Portainer** is server-only — it binds to `127.0.0.1:9000` on the VPS and is never exposed to the public internet. Access it only via SSH tunnel.

| Tool       | URL / Access                                      | What it's for                                       |
| ---------- | ------------------------------------------------- | --------------------------------------------------- |
| pgAdmin    | `https://pgadmin.lms.marvelslice.com` (web)       | Web UI to browse / query the Postgres database      |
| Portainer  | `http://localhost:9000` via SSH tunnel (server-only) | Visual GUI for managing Docker (containers, volumes, images) |

**pgAdmin** requires:
1. DNS A record for `pgadmin` → VPS IP (Part 0)
2. Basic-auth file `deploy/nginx/htpasswd` (Part 2.5)
3. `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` in `.env.production` (Part 2.4)

**Portainer** requires no DNS/cert. From your laptop:
```bash
ssh -L 9000:localhost:9000 root@<VPS_IP>
# then open http://localhost:9000 — Portainer setup appears
# Keep the SSH session open while you use Portainer.
```

Both containers start automatically with `docker compose ... up -d`.
- **pgAdmin** — log in with `PGADMIN_EMAIL` / `PGADMIN_PASSWORD`, then register the server: Host=`postgres`, Port=`5432`, User=`POSTGRES_USER`, Password=`POSTGRES_PASSWORD`, DB=`POSTGRES_DB`.
- **Portainer** — on first open (via tunnel) create the admin user. It mounts the Docker socket, so it can manage the whole engine.

> ⚠️ **Security:** pgAdmin's basic-auth prompt is the only thing between the public internet and that tool — use a strong `deploy/nginx/htpasswd` password. Portainer is NOT on the internet at all (localhost-only + SSH), which is more secure; treat its admin password as highly sensitive because it has host-root-equivalent power via `/var/run/docker.sock`.
>
> Full walkthrough in [docs/prod-management-tools.md](prod-management-tools.md).

---

## Part 5 — Daily operations

### View logs

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

- `logs` — print container logs. `-f` — **f**ollow (keep streaming).
- Replace `api` with `web`, `nginx`, `postgres`, etc.

### Restart a service

```bash
docker compose -f docker-compose.prod.yml restart api
```

### Stop everything

```bash
docker compose -f docker-compose.prod.yml down
```

- Stops and removes containers. **Your data survives** (it's in named volumes).

### Complete teardown (only if you really want to delete data)

```bash
docker compose -f docker-compose.prod.yml down -v
```

- `-v` — also delete named **v**olumes (the database!). ⚠️ **This destroys all data.**

---

## Part 6 — Deploying updates

### Manual deploy (you control when)

On your **laptop**, in the repo:

```bash
git add -A && git commit -m "update" && git push origin main
```

On the **server**:

```bash
cd /opt/lms
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

- `git pull` — pull the latest code from GitHub.
- `docker compose build` — rebuild images with the new code.
- `docker compose up -d` — recreate containers with the new images (data untouched).

### Automatic deploy (CI/CD)

A GitHub Actions workflow (`.github/workflows/ci-cd.yml`) is included. It:

1. **Runs tests** (`pnpm test`) on every push/PR to `main`
2. On merge to `main`, **builds and pushes** Docker images to GitHub Container Registry (GHCR)
3. **SSHes into the VPS**, pulls the images, syncs the schema, and restarts

To enable it:

1. Push the repo to GitHub (the workflow file is already there).
2. In your repo: **Settings → Secrets and variables → Actions → New repository secret**:

| Secret        | Value                                                         |
| ------------- | ------------------------------------------------------------- |
| `VPS_HOST`    | Your VPS IP (`203.0.113.10`)                                  |
| `VPS_USER`    | `root` (or your SSH user)                                     |
| `VPS_SSH_KEY` | Your **private** SSH key (the content of `~/.ssh/id_ed25519`) |

3. On the VPS, make sure `docker compose` can pull from GHCR. Public images need
   no login; private repos do. If your repo is private, add the `GITHUB_TOKEN`
   as a deploy token or make the package public (Packages → package → Settings).

> 💡 **Tip:** for `VPS_SSH_KEY` to work with `appleboy/ssh-action`, the VPS must
> allow key login. Test with: `ssh root@203.0.113.10` from your laptop without a
> password prompt.

---

## Part 7 — Backups

Two things are worth backing up: the **database** and **uploaded files**.

### Database backup

```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U lms_prod lms_prod > backup_$(date +%F).sql
```

- `pg_dump -U lms_prod lms_prod` — dump the whole `lms_prod` database as SQL.
- `> backup_2026-08-20.sql` — save output to a dated file.

Restore later with:

```bash
cat backup_2026-08-20.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U lms_prod lms_prod
```

> For scheduled/automated backups (including the admin UI's built-in backup
> feature), see [docs/database-backup.md](database-backup.md).

### Uploaded files

Uploaded files live in the `uploads_data` volume. Back them up with:

```bash
docker run --rm -v lms-prod_uploads_data:/data -v /opt/lms/backups:/backup alpine tar czf /backup/uploads_$(date +%F).tar.gz -C /data .
```

- `docker run --rm` — one-off container.
- `-v lms-prod_uploads_data:/data` — attach the uploads volume.
- `-v /opt/lms/backups:/backup` — attach a folder on the host.
- `alpine tar czf ...` — compress the volume contents into a `.tar.gz`.

---

## Part 8 — Troubleshooting

| Problem                                                   | Likely cause                   | Fix                                                                      |
| --------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------ | ------------- | -------------------------- |
| `ERR_CONNECTION_REFUSED` on `https://lms.marvelslice.com` | Nginx not started / firewall   | Check `docker compose ps`; open ports 80/443 in your provider's firewall |
| `Welcome to nginx` default page                           | Server block mismatch          | Verify DNS A records point to the VPS IP                                 |
| `certbot ... HTTP-01` error                               | Port 80 blocked                | Run with bootstrap config; check firewall                                |
| API returns 503 on `/health`                              | DB not ready/migrated          | `docker compose logs api` — check `prisma db push` output                |
| Uploads fail                                              | Volume missing permissions     | `docker compose logs api`; check `uploads_data` volume exists            |
| Port 5432/6379 conflict on host                           | Another Postgres/Redis running | Our containers don't expose DB ports to the host; nothing conflicts      |
| Container won't start, "port already allocated"           | Something on host:80/443       | `ss -tlnp                                                                | grep -E ':(80 | 443)'` to find the process |
| `403` on `pgadmin` subdomain                              | Missing/empty `deploy/nginx/htpasswd` | Create the file (Part 2.5), then `docker compose -f docker-compose.prod.yml restart nginx` |
| `pgadmin` subdomain won't load                           | DNS A record missing or Webuzo vhost not proxied | Add `pgadmin` A record (Part 0) and Webuzo Apache `ProxyPass` to `127.0.0.1:8080` (`docs/apache-proxy.md`) |
| Portainer not reachable on host                          | Not using SSH tunnel                 | Portainer is localhost-only. Use `ssh -L 9000:localhost:9000 root@<VPS_IP>` then open `http://localhost:9000`. Check `ss -tlnp | grep 9000` and `docker compose ps portainer` |
| Portainer shows no containers                            | Docker socket not mounted            | Ensure `/var/run/docker.sock` is mounted (it is by default in `docker-compose.prod.yml`) |

### Key file reference

| File                              | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `docker-compose.prod.yml`         | Production stack definition (HTTP-only behind Webuzo) |
| `docker-compose.bootstrap.yml`    | One-time override for **direct-SSL** mode (no Webuzo) — not needed when Webuzo proxies 8080 |
| `nginx.prod.conf`                 | HTTP-only reverse proxy (Webuzo terminates SSL) |
| `nginx.prod.bootstrap.conf`       | HTTP bootstrap for direct-SSL first boot (direct mode only) |
| `.env.production.example`         | Template for `.env.production`               |
| `apps/api/Dockerfile`             | API image (multi-stage)                      |
| `apps/api/entrypoint.sh`          | Runs `prisma db push` then starts the server |
| `apps/web/Dockerfile`             | Next.js standalone image                     |
| `apps/landing/Dockerfile`         | Landing static image                         |
| `apps/landing/Dockerfile.api`     | Landing contact-form email server            |
| `apps/landing/nginx.landing.conf` | Static serving inside the landing container  |
| `.github/workflows/ci-cd.yml`     | Test → build → deploy pipeline               |
| `deploy/nginx/htpasswd`           | HTTP basic-auth creds for pgAdmin (gitignored)           |
| `docs/prod-management-tools.md`   | Deep-dive: pgAdmin + Portainer setup         |

## Verification checklist

- [ ] DNS A records for `www` and `lms` point to the VPS
- [ ] `.env.production` created with real secrets
- [ ] Certificates issued in Webuzo (Let’s Encrypt) for `www` + `lms` + `pgadmin`
- [ ] `https://www.marvelslice.com` loads the landing page (via Apache → 8080)
- [ ] `https://lms.marvelslice.com` loads and you can log in (via Apache → 8080)
- [ ] `http://127.0.0.1:8080/health` returns 200 (`curl -f http://127.0.0.1:8080/health`)
- [ ] Seed data loaded (admin user works)
- [ ] `pgadmin.lms.marvelslice.com` resolves and is reachable behind basic auth
- [ ] Portainer reachable via `ssh -L 9000:localhost:9000` → `http://localhost:9000`
- [ ] UptimeRobot or similar monitors `/health`
- [ ] Daily DB backup scheduled (see `docs/database-backup.md`)
