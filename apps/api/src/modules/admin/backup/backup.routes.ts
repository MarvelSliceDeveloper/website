import { Router, type Request, type Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import {
  BACKUP_DIR,
  BACKUP_KEEP_COUNT,
  createBackup,
  listBackups,
  pruneBackups,
  deleteBackup,
  restoreBackup,
  getBackupDownloadPath,
} from "./backup.service";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

const upload = multer({ dest: path.join(BACKUP_DIR, "uploads") });

router.post("/", async (_req: AuthRequest, res: Response) => {
  try {
    const backup = await createBackup();
    const pruned = pruneBackups(BACKUP_KEEP_COUNT);
    return res.json({ ...backup, pruned });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to create backup";
    const statusCode = error instanceof Error && "statusCode" in error
      ? (error as { statusCode: number }).statusCode
      : 500;
    return res.status(statusCode).json({ error: message });
  }
});

router.get("/list", async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ backups: listBackups() });
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

    // Safety: snapshot the current DB before overwriting so a restore can be undone.
    let safetyBackup: { filename: string } | null = null;
    try {
      const sb = await createBackup();
      pruneBackups(BACKUP_KEEP_COUNT);
      safetyBackup = { filename: sb.filename };
    } catch (e: unknown) {
      // If the safety backup fails the DB is likely already broken — proceed but flag it.
      safetyBackup = null;
    }

    try {
      await restoreBackup(file.path);
      return res.json({
        message: "Database restored successfully",
        ...(safetyBackup ? { safetyBackup: safetyBackup.filename } : { warning: "Safety backup could not be created" }),
      });
    } finally {
      fs.rmSync(file.path, { force: true });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to restore backup";
    const statusCode = error instanceof Error && "statusCode" in error
      ? (error as { statusCode: number }).statusCode
      : 500;
    return res.status(statusCode).json({ error: message });
  }
});

router.delete("/:filename", async (req: AuthRequest, res: Response) => {
  try {
    deleteBackup(req.params.filename);
    return res.json({ message: "Backup deleted successfully" });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to delete backup";
    const statusCode = error instanceof Error && "statusCode" in error
      ? (error as { statusCode: number }).statusCode
      : 500;
    return res.status(statusCode).json({ error: message });
  }
});

router.get("/download/:filename", async (req: AuthRequest, res: Response) => {
  try {
    const filepath = getBackupDownloadPath(req.params.filename);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${path.basename(filepath)}"`,
    );
    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to download backup";
    const statusCode = error instanceof Error && "statusCode" in error
      ? (error as { statusCode: number }).statusCode
      : 500;
    return res.status(statusCode).json({ error: message });
  }
});

export default router;
