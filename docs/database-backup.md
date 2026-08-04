# Database Backup

## Overview

The LMS Portal uses PostgreSQL (via Docker). This document covers backup and restoration procedures.

## Automated Backup (pg_dump)

### Prerequisites

- `pg_dump` (PostgreSQL client tools) installed locally or on the server
- Docker running if using the containerized database

### Backup Command

```bash
# Dump the entire database
pg_dump "postgresql://postgres:postgres@localhost:5433/lms" \
  --no-owner \
  --file="backups/lms-$(date +%Y-%m-%d-%H%M).sql"
```

### Cron Job (Linux / WSL)

Add to crontab to run daily at 2 AM:

```bash
0 2 * * * pg_dump "postgresql://postgres:postgres@localhost:5433/lms" --no-owner --file="/path/to/backups/lms-$(date +\%Y-\%m-\%d-\%H\%M).sql" && find /path/to/backups -type f -mtime +30 -delete
```

This keeps a rolling 30-day backup window.

## Restore

```bash
# Create the database if needed
createdb "postgresql://postgres:postgres@localhost:5433/lms_restore"

# Restore from dump
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

| Data           | Retention | Notes                      |
| -------------- | --------- | -------------------------- |
| Database dumps | 30 days   | Rolling deletion           |
| Uploads        | 90 days   | Full backup weekly         |
| Logs           | 90 days   | Managed by logging service |

## Notes

- Keep backups in a separate physical location or cloud storage (S3, GCS)
- Test restoration periodically to verify backup integrity
- Encrypt backups containing PII if stored off-site
