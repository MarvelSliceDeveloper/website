# Database Backup

## Overview

The MarvelSlice LMS uses PostgreSQL (via Docker). This document covers backup and restoration procedures.

The app also ships a built-in backup system under **SuperAdmin → Settings → Backup & Restore**:

- **Create Backup** — runs a compressed `pg_dump` (custom format, `.dump`) and stores it in `apps/api/backups/`
- **List / Download / Delete** — manage stored backups (SuperAdmin only)
- **Restore** — uploads a `.dump` (or legacy `.sql`) file and restores it. A safety backup of the current DB is created automatically before restoring.
- **Automatic daily backup** — the API schedules a backup at `BACKUP_HOUR` (default 2 AM server time) when background jobs are enabled.
- **Retention** — only the newest `BACKUP_KEEP_COUNT` backups are kept (default 3). Older ones are pruned automatically after each create.

Backups are compressed (custom-format `-Fc`), so they are typically 5–10× smaller than plain-text SQL dumps.

## Automated Backup (pg_dump)

### Prerequisites

- `pg_dump` / `pg_restore` / `psql` (PostgreSQL client tools) installed on the API server
- Docker running if using the containerized database

### Backup Command

```bash
# Dump the entire database (custom format — compressed)
pg_dump "postgresql://postgres:postgres@localhost:5433/lms" \
  --no-owner --no-acl \
  --format=custom \
  --file="backups/lms-$(date +%Y-%m-%d-%H%M).dump"
```

### Cron Job (Linux / WSL)

If you prefer OS-level cron over the app's built-in scheduler, add to crontab to run daily at 2 AM. This keeps a rolling 3-backup window (adjust `-mtime` to match your retention):

```bash
0 2 * * * pg_dump "postgresql://postgres:postgres@localhost:5433/lms" --no-owner --no-acl --format=custom --file="/path/to/backups/lms-$(date +\%Y-\%m-\%d-\%H\%M).dump" && find /path/to/backups -name "*.dump" -type f -mtime +3 -delete
```

## Restore

```bash
# Create the database if needed
createdb "postgresql://postgres:postgres@localhost:5433/lms_restore"

# Restore from a custom-format dump
pg_restore --no-owner --no-acl -d "postgresql://postgres:postgres@localhost:5433/lms_restore" backups/lms-2026-07-01-0200.dump

# Or restore from a plain-text SQL dump
psql "postgresql://postgres:postgres@localhost:5433/lms_restore" < backups/lms-2026-07-01-0200.sql
```

## Docker-Only Backup

If using only the Docker container without local `pg_dump`:

```bash
docker exec -t lms-postgres-1 pg_dumpall -c -U postgres > dump_$(date +%Y-%m-%d-%H%M).sql
```

## Uploads Backup

The `uploads/` directory (at `apps/api/uploads/`) contains user-uploaded files. Include it in your backup strategy:

```bash
tar -czf "backups/uploads-$(date +%Y-%m-%d).tar.gz" apps/api/uploads
```

## Retention Policy

| Data           | Retention           | Notes                                           |
| -------------- | ------------------- | ----------------------------------------------- |
| Database dumps | 3 backups (rolling) | App auto-prunes; adjust via `BACKUP_KEEP_COUNT` |
| Uploads        | 90 days             | Full backup weekly                              |
| Logs           | 90 days             | Managed by logging service                      |

## Notes

- Keep at least one offline/off-site copy (e.g. download the latest backup to office storage weekly) — this survives a server loss.
- Test restoration periodically to verify backup integrity
- Encrypt backups containing PII if stored off-site
