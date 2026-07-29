import { Router, type Request, type Response } from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import multer from "multer";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

const BACKUP_DIR = path.resolve(__dirname, "../../../../backups");
fs.mkdirSync(BACKUP_DIR, { recursive: true });

const upload = multer({ dest: path.join(BACKUP_DIR, "uploads") });

function getDbUrl(): { host: string; port: string; database: string; user: string; password: string } {
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

router.post("/", async (_req: AuthRequest, res: Response) => {
  try {
    const { host, port, database, user, password } = getDbUrl();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const env = { ...process.env, PGPASSWORD: password };

    exec(
      `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} --no-owner --no-acl -f "${filepath}"`,
      { env, timeout: 120000 },
      (error, stdout, stderr) => {
        if (error) {
          return res.status(500).json({ error: `Backup failed: ${stderr || error.message}` });
        }
        return res.json({
          message: "Backup created successfully",
          filename,
          size: fs.statSync(filepath).size,
          createdAt: new Date().toISOString(),
        });
      },
    );
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create backup",
    });
  }
});

router.get("/list", async (_req: AuthRequest, res: Response) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { filename: f, size: stat.size, createdAt: stat.birthtime.toISOString() };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ backups: files });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to list backups",
    });
  }
});

router.post("/restore", upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Backup file is required" });

    const { host, port, database, user, password } = getDbUrl();
    const env = { ...process.env, PGPASSWORD: password };

    exec(
      `psql -h ${host} -p ${port} -U ${user} -d ${database} -f "${file.path}"`,
      { env, timeout: 300000 },
      (error, stdout, stderr) => {
        fs.unlink(file.path, () => {});
        if (error) {
          return res.status(500).json({ error: `Restore failed: ${stderr || error.message}` });
        }
        return res.json({ message: "Database restored successfully" });
      },
    );
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to restore backup",
    });
  }
});

router.delete("/:filename", async (req: AuthRequest, res: Response) => {
  try {
    const filepath = path.join(BACKUP_DIR, req.params.filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "Backup file not found" });
    }
    fs.unlinkSync(filepath);
    return res.json({ message: "Backup deleted successfully" });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete backup",
    });
  }
});

router.get("/download/:filename", async (req: AuthRequest, res: Response) => {
  try {
    const decoded = decodeURIComponent(req.params.filename);
    const filepath = path.resolve(BACKUP_DIR, decoded);
    if (!filepath.startsWith(path.resolve(BACKUP_DIR))) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: "Backup file not found" });
    }
    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", `attachment; filename="${decoded}"`);
    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to download backup",
    });
  }
});

export default router;
