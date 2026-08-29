import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { AppError } from "../../../utils/errors";

const execFileAsync = promisify(execFile);

export const BACKUP_DIR = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.resolve(__dirname, "../../backups");
try {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
} catch (err) {
  console.warn(
    `[backup] could not create BACKUP_DIR at ${BACKUP_DIR}: ${
      err instanceof Error ? err.message : err
    }`,
  );
}

export const BACKUP_KEEP_COUNT = Math.max(
  1,
  Number(process.env.BACKUP_KEEP_COUNT) || 3,
);

const DUMP_TIMEOUT = 120000;
const RESTORE_TIMEOUT = 300000;

export type BackupFile = { filename: string; size: number; createdAt: string };

function getDbUrl(): {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
} {
  const url = process.env.DATABASE_URL || "";
  const dbUrl = new URL(url);
  return {
    host: dbUrl.hostname,
    port: dbUrl.port || "5432",
    database: dbUrl.pathname.replace(/^\//, ""),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
  };
}

/** Resolve a backup filename safely inside BACKUP_DIR (guards path traversal). */
function safeResolve(filename: string): string {
  const decoded = decodeURIComponent(filename);
  const filepath = path.resolve(BACKUP_DIR, decoded);
  const base = path.resolve(BACKUP_DIR);
  if (filepath !== base && !filepath.startsWith(base + path.sep)) {
    throw new AppError(400, "Invalid filename");
  }
  return filepath;
}

function isBackupFile(name: string): boolean {
  return name.endsWith(".dump") || name.endsWith(".sql");
}

/**
 * Create a compressed (custom-format) pg_dump of the current database.
 * Uses execFile — no shell interpolation of credentials.
 */
export async function createBackup(): Promise<BackupFile> {
  const { host, port, database, user, password } = getDbUrl();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.dump`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    await execFileAsync(
      "pg_dump",
      [
        "-h",
        host,
        "-p",
        port,
        "-U",
        user,
        "-d",
        database,
        "--no-owner",
        "--no-acl",
        "-Fc",
        "-f",
        filepath,
      ],
      { env: { ...process.env, PGPASSWORD: password }, timeout: DUMP_TIMEOUT },
    );
  } catch (err: unknown) {
    // Clean up partial dump on failure so it doesn't show in the list.
    fs.rmSync(filepath, { force: true });
    const raw = err instanceof Error ? err.message : "pg_dump failed";
    const isEnoent =
      raw.includes("ENOENT") ||
      raw.includes("not found") ||
      (err as NodeJS.ErrnoException)?.code === "ENOENT";
    const msg = isEnoent
      ? "pg_dump not found — install PostgreSQL client (on Alpine: apk add postgresql-client; on Debian/Ubuntu: apt install postgresql-client) or run via Docker: docker compose exec postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.dump"
      : raw;
    throw new AppError(500, `Backup failed: ${msg}`);
  }

  return {
    filename,
    size: fs.statSync(filepath).size,
    createdAt: new Date().toISOString(),
  };
}

/** List backups newest-first. */
export function listBackups(): BackupFile[] {
  return fs
    .readdirSync(BACKUP_DIR)
    .filter(isBackupFile)
    .map((f) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f));
      return {
        filename: f,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/**
 * Prune backups so only the newest `keep` remain (rolling retention).
 * Returns the filenames that were deleted.
 */
export function pruneBackups(keep: number = BACKUP_KEEP_COUNT): string[] {
  const backups = listBackups();
  const toDelete = backups.slice(keep);
  for (const b of toDelete) {
    fs.rmSync(path.join(BACKUP_DIR, b.filename), { force: true });
  }
  return toDelete.map((b) => b.filename);
}

/** Delete a single backup by filename. */
export function deleteBackup(filename: string): void {
  const filepath = safeResolve(filename);
  if (!fs.existsSync(filepath) || !isBackupFile(path.basename(filepath))) {
    throw new AppError(404, "Backup file not found");
  }
  fs.unlinkSync(filepath);
}

/**
 * Restore from a backup file (`.dump` via pg_restore, `.sql` via psql).
 * Accepts an absolute temp path from multer — no path traversal surface.
 */
export async function restoreBackup(filepath: string): Promise<void> {
  const { host, port, database, user, password } = getDbUrl();
  const isCustom = filepath.endsWith(".dump");
  const env = { ...process.env, PGPASSWORD: password };

  try {
    if (isCustom) {
      await execFileAsync(
        "pg_restore",
        [
          "-h",
          host,
          "-p",
          port,
          "-U",
          user,
          "-d",
          database,
          "--no-owner",
          "--no-acl",
          filepath,
        ],
        { env, timeout: RESTORE_TIMEOUT },
      );
    } else {
      await execFileAsync(
        "psql",
        ["-h", host, "-p", port, "-U", user, "-d", database, "-f", filepath],
        { env, timeout: RESTORE_TIMEOUT },
      );
    }
  } catch (err: unknown) {
    const raw = err instanceof Error ? err.message : "restore failed";
    const isEnoent =
      raw.includes("ENOENT") ||
      raw.includes("not found") ||
      (err as NodeJS.ErrnoException)?.code === "ENOENT";
    const msg = isEnoent
      ? `${isCustom ? "pg_restore" : "psql"} not found — install PostgreSQL client (apk add postgresql-client / apt install postgresql-client) or restore via Docker: docker compose exec -T postgres ${isCustom ? "pg_restore --no-owner --no-acl -d $POSTGRES_DB < backup.dump" : "psql -U $POSTGRES_USER $POSTGRES_DB < backup.sql"}`
      : raw;
    throw new AppError(500, `Restore failed: ${msg}`);
  }
}

/** Resolve a download path (throws 404 if missing). */
export function getBackupDownloadPath(filename: string): string {
  const filepath = safeResolve(filename);
  if (!fs.existsSync(filepath) || !isBackupFile(path.basename(filepath))) {
    throw new AppError(404, "Backup file not found");
  }
  return filepath;
}
