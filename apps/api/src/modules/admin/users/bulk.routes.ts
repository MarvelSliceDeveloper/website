import { Router, type Response } from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { UserRole } from "@lms/types";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

function parseCSV(
  buffer: Buffer,
): { name: string; email: string; role: string }[] {
  const text = buffer.toString("utf-8").trim();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows: { name: string; email: string; role: string }[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) continue;
    const name = parts[0] ?? "";
    const email = parts[1] ?? "";
    const role = (parts[2] ?? "STUDENT").toUpperCase();
    if (!name || !email) continue;
    if (!["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(role))
      continue;
    rows.push({ name, email, role });
  }

  return rows;
}

// POST /import — Import users from CSV
router.post(
  "/import",
  upload.single("file"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "CSV file is required" });
      }

      const rows = parseCSV(req.file.buffer);
      if (rows.length === 0) {
        return res.status(400).json({ error: "No valid rows found in CSV" });
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const row of rows) {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: row.email.toLowerCase() },
          });
          if (existing) {
            skipped++;
            continue;
          }

          const passwordHash = await bcrypt.hash("changeme123", 12);
          await prisma.user.create({
            data: {
              name: row.name,
              email: row.email.toLowerCase(),
              passwordHash,
              role: row.role as UserRole,
            },
          });
          imported++;
        } catch (err: unknown) {
          errors.push(
            `${row.email}: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      }

      return res.status(201).json({ imported, skipped, errors });
    } catch (error: unknown) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to import users",
      });
    }
  },
);

// POST /bulk-role — Bulk role change
router.post("/bulk-role", async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, role } = req.body as { userIds?: string[]; role?: string };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds array is required" });
    }
    if (
      !role ||
      !["STUDENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"].includes(role)
    ) {
      return res.status(400).json({ error: "Valid role is required" });
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { role: role as UserRole },
    });

    return res.json({
      message: `Updated ${userIds.length} user(s) to ${role}`,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update roles",
    });
  }
});

// POST /bulk-email — Bulk email (placeholder — logs only)
router.post("/bulk-email", async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, subject, message } = req.body as {
      userIds?: string[];
      subject?: string;
      message?: string;
    };

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds array is required" });
    }
    if (!subject || !message) {
      return res
        .status(400)
        .json({ error: "subject and message are required" });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { email: true },
    });

    // Placeholder: log instead of actually sending
    console.log(
      `[bulk-email] Sending "${subject}" to ${users.length} user(s):`,
      users.map((u) => u.email),
    );

    return res.json({
      message: `Email queued for ${users.length} user(s)`,
      queued: users.length,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to send bulk email",
    });
  }
});

export { router as bulkUsersRouter };
