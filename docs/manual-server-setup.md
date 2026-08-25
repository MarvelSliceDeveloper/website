# Manual Server Setup Guide (Without Docker)

> Prefer Docker? See [docker-implementation.md](docker-implementation.md).
>
> This guide runs the LMS Portal directly on Ubuntu **without containers**:
> Node.js + PostgreSQL + Redis installed on the system, apps managed by PM2,
> nginx as the reverse proxy. Every command is explained.

## What you're building

```
Internet → nginx (:80/:443) ──┬── www.marvelslice.com → landing (Vite :3001)
                              └── lms.marvelslice.com ──┬── /api → api (Express :4000)
                                                        └── /     → web (Next.js :3000)
                              PostgreSQL (:5432)  ·  Redis (:6379)
```

## Prerequisites

- Ubuntu 22.04 or 24.04 VPS (min 2GB RAM recommended)
- SSH access as `root` (or a sudo user)
- Domains `www.marvelslice.com` and `lms.marvelslice.com` pointing at the VPS IP
- Node.js ≥ 20 and pnpm ≥ 8 (we install these below)

---

## Part 1 — System setup (one-time)

### 1.1 SSH in and update

```bash
ssh root@203.0.113.10
apt update && apt upgrade -y
```

- `apt update` — refresh package lists. `apt upgrade -y` — install updates.

### 1.2 Install build tools (needed to compile native modules)

```bash
apt install -y build-essential python3 git curl
```

- `build-essential` — C/C++ compiler toolchain (some npm packages compile native code).
- `python3` — required by some Node build steps.
- `git` — to clone the repo.
- `curl` — for downloading things.

---

## Part 2 — Install Node.js + pnpm (one-time)

We use the official NodeSource repo for a recent, supported Node LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

- `curl ... | bash -` — downloads NodeSource's setup script and runs it (adds the Node repo to apt).
- `apt install -y nodejs` — installs Node 20.x.

Verify:

```bash
node --version
```

Install pnpm (via corepack, which ships with Node):

```bash
corepack enable
```

- `corepack enable` — activates pnpm/yarn shims bundled with Node.

Verify:

```bash
pnpm --version
```

---

## Part 3 — Install PostgreSQL (one-time)

### 3.1 Install

```bash
apt install -y postgresql postgresql-contrib
```

- `postgresql` — the database server.
- `postgresql-contrib` — extra utilities/extensions.

### 3.2 Start and enable on boot

```bash
systemctl enable --now postgresql
```

- `systemctl` — controls system services (systemd).
- `enable` — start it automatically at boot. `--now` — also start it right now.

### 3.3 Create the database and user

```bash
sudo -u postgres psql
```

- `sudo -u postgres psql` — run the PostgreSQL prompt as the `postgres` system user.

Inside the `psql` prompt, run:

```sql
CREATE USER lms_prod WITH PASSWORD 'your-strong-password';
CREATE DATABASE lms_prod OWNER lms_prod;
\q
```

- `CREATE USER ... WITH PASSWORD ...` — creates the app's DB login.
- `CREATE DATABASE ... OWNER ...` — creates the database owned by that user.
- `\q` — quit `psql`.

> Note: we do **not** install PostgreSQL from Docker, so `localhost:5432` works
> directly — no port remapping like the Docker guide uses (5433).

---

## Part 4 — Install Redis (one-time)

```bash
apt install -y redis-server
systemctl enable --now redis-server
```

- `redis-server` — the in-memory cache/realtime broker.
- `systemctl enable --now` — enable at boot + start now.

Verify it responds:

```bash
redis-cli ping
```

- Should print `PONG` (Redis answers "ping" with "pong").

---

## Part 5 — Get the code and install dependencies

```bash
mkdir -p /opt/lms && cd /opt/lms
git clone https://github.com/your-username/lms-portal.git .
```

- `mkdir -p /opt/lms` — create the app folder. `&&` — only run the next command if this succeeded.
- `git clone <url> .` — clone into the current directory.

Install all workspace dependencies:

```bash
pnpm install --frozen-lockfile
```

- `pnpm install` — installs every package in the monorepo.
- `--frozen-lockfile` — install exactly what `pnpm-lock.yaml` says (reproducible builds).

---

## Part 6 — Configure environment (one-time)

```bash
cp .env.example .env
nano .env
```

Set (at minimum):

```dotenv
DATABASE_URL=postgresql://lms_prod:your-strong-password@localhost:5432/lms_prod
REDIS_URL=redis://localhost:6379
JWT_SECRET=...            # openssl rand -base64 48
CSRF_SECRET=...
NEXTAUTH_SECRET=...
TOKEN_ENCRYPTION_KEY=...  # openssl rand -base64 32
API_URL=http://localhost:4000
WEB_URL=http://localhost:3000
```

> The API loads `.env` from the repo root automatically (`dotenv.config` in
> `apps/api/src/app.ts`), so put the file in `/opt/lms/.env`.

---

## Part 7 — Database schema + seed (one-time)

```bash
pnpm prisma:generate
pnpm prisma:reset
```

- `pnpm prisma:generate` — generates the Prisma client code (needed before running the API).
- `pnpm prisma:reset` — pushes the schema (`prisma db push --force-reset`) and runs the seed.

> ⚠️ `prisma:reset` **drops** the database first. Only run it during initial setup.

After this, the seed users exist (see `docs/docker-implementation.md` Part 4 for
the table).

---

## Part 8 — Build the apps

```bash
pnpm build
```

- Runs `turbo build`, building **api** (tsup → `apps/api/dist`), **web** (Next.js →
  `.next`), and **landing** (Vite → `apps/landing/dist`).

---

## Part 9 — Run the apps with PM2 (stays running after logout)

### 9.1 Install PM2

```bash
npm install -g pm2
```

- `npm install -g` — global install. PM2 keeps Node processes alive and restarts them on crash/reboot.

### 9.2 Start the three services

```bash
cd /opt/lms
pm2 start "node apps/api/dist/index.js" --name lms-api
pm2 start "node apps/web/.next/standalone/apps/web/server.js" --name lms-web
pm2 start "node apps/landing/dev-server.js" --name lms-landing-api
```

- `pm2 start "<command>" --name <label>` — start a process and tag it for easy management.
- The landing **static site** itself is served by nginx (Part 10) from `apps/landing/dist`;
  only its contact-form API (`dev-server.js`) needs PM2.

### 9.3 Save PM2's process list + enable startup

```bash
pm2 save
pm2 startup
```

- `pm2 save` — persist the current process list so `pm2 resurrect` can restore it.
- `pm2 startup` — prints a command to run once so PM2 auto-starts on reboot. **Run the command it prints.**

### 9.4 Useful PM2 commands

```bash
pm2 status            # list processes
pm2 logs lms-api      # live logs for the API
pm2 restart lms-web   # restart the web app
pm2 monit             # dashboard of CPU/memory
```

---

## Part 10 — nginx reverse proxy + SSL (one-time)

### 10.1 Install nginx and certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
```

- `nginx` — the web server / reverse proxy.
- `certbot` + `python3-certbot-nginx` — Let's Encrypt client with the nginx plugin
  (it can auto-edit nginx configs).

### 10.2 Create the nginx site config

```bash
nano /etc/nginx/sites-available/lms
```

Paste:

```nginx
# ── www.marvelslice.com → landing ──
server {
    listen 80;
    server_name www.marvelslice.com;

    root /opt/lms/apps/landing/dist;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }

    # Landing contact forms → landing API (PM2)
    location /api/ { proxy_pass http://127.0.0.1:3001; proxy_set_header Host $host; }
}

# ── lms.marvelslice.com → web + api ──
server {
    listen 80;
    server_name lms.marvelslice.com;

    # Next.js web app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50m;
    }

    # Uploads + images
    location /uploads/ { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; client_max_body_size 50m; }
    location /images/  { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; }

    # Realtime socket
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }

    # Health
    location = /health { proxy_pass http://127.0.0.1:4000/health; }
}
```

### 10.3 Enable the site

```bash
ln -s /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/lms
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

- `ln -s` — create a symlink so nginx loads the site.
- `rm ... default` — remove the default site (avoids conflicts).
- `nginx -t` — test the config for syntax errors (**always do this before reload**).
- `systemctl reload nginx` — apply the new config without dropping connections.

### 10.4 Get SSL certificates

```bash
certbot --nginx -d www.marvelslice.com -d lms.marvelslice.com --email you@example.com --agree-tos --no-eff-email
```

- `certbot --nginx -d <domains>` — obtains certificates and **automatically edits**
  your nginx config to add HTTPS + redirects.
- Certificates auto-renew via a systemd timer certbot installs. Verify with:
  `systemctl list-timers | grep certbot`

### 10.5 Test everything

```bash
curl -f http://localhost/health
```

Then open in a browser: `https://www.marvelslice.com` and `https://lms.marvelslice.com`.

---

## Part 11 — Deploying updates (manual)

```bash
cd /opt/lms
git pull
pnpm install --frozen-lockfile
pnpm build
pm2 restart lms-api lms-web lms-landing-api
```

- `git pull` — get new code.
- `pnpm install --frozen-lockfile` — sync dependencies.
- `pnpm build` — rebuild all apps.
- `pm2 restart <names>` — apply the new builds.

If the database schema changed (a `prisma` schema update):

```bash
pnpm prisma:generate
cd apps/api && npx prisma db push --skip-generate && cd ../..
```

- `prisma db push` (without `--force-reset`) — non-destructively syncs the schema.
  Never run `prisma:reset` on production data.

---

## Part 12 — Backups

### Database

```bash
pg_dump -U lms_prod lms_prod > /opt/lms/backups/backup_$(date +%F).sql
```

Restore:

```bash
psql -U lms_prod lms_prod < /opt/lms/backups/backup_2026-08-20.sql
```

### Uploaded files

```bash
tar czf /opt/lms/backups/uploads_$(date +%F).tar.gz -C /opt/lms/apps/api/uploads .
```

For automated scheduling, see [docs/database-backup.md](database-backup.md).

---

## Troubleshooting

| Problem                  | Likely cause                 | Fix                                          |
| ------------------------ | ---------------------------- | -------------------------------------------- | ---------- |
| `502 Bad Gateway`        | App not running / wrong port | `pm2 status`; check PM2 logs                 |
| API 503 on `/health`     | DB down                      | `systemctl status postgresql`                |
| Page loads but no styles | Next.js assets wrong         | Restart web: `pm2 restart lms-web`           |
| Contact form emails fail | SMTP not configured          | Check `SMTP_EMAIL`/`SMTP_PASSWORD` in `.env` |
| nginx config error       | Typo                         | `nginx -t` shows the exact line              |
| Port 3000 in use         | Another process              | `ss -tlnp                                    | grep 3000` |

## Comparison: Docker vs manual

| Aspect          | Docker guide                    | Manual guide                       |
| --------------- | ------------------------------- | ---------------------------------- |
| Setup effort    | One command installs everything | More manual steps                  |
| Isolation       | Full (DB, Redis in containers)  | System-wide packages               |
| Updates         | `docker compose up -d`          | `git pull && build && pm2 restart` |
| Backups         | Volume-based (pg_dump)          | Same pg_dump                       |
| Resource usage  | Slightly higher (containers)    | Lower footprint                    |
| Recommended for | Beginners / CI-CD               | Tighter control / existing DB      |
