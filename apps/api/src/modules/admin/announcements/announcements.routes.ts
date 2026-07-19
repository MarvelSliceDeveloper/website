import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// GET / — List all announcements
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ announcements });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch announcements",
    });
  }
});

// POST / — Create announcement
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, targetRole } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!body || typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ error: "Body is required" });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        targetRole: targetRole || "ADMIN",
        createdBy: req.user!.id,
      },
    });

    return res.status(201).json({ announcement });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create announcement",
    });
  }
});

// DELETE /:id — Delete announcement
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    await prisma.announcement.delete({ where: { id } });
    return res.json({ message: "Announcement deleted" });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete announcement",
    });
  }
});

export default router;
