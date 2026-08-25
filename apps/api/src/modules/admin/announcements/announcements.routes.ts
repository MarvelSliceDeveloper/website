import { Router, type Response } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { announcementsService } from "./announcements.service";
import { prisma } from "../../../utils/prisma";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ announcements });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch announcements",
    });
  }
});

router.get("/packages", async (_req: AuthRequest, res: Response) => {
  try {
    const packages = await prisma.coursePackage.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return res.json({ packages });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch packages",
    });
  }
});

router.get("/batches", async (_req: AuthRequest, res: Response) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        course: { select: { title: true } },
      },
      orderBy: { startDate: "desc" },
    });
    return res.json({ batches });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch batches",
    });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, targetType, targetRole, targetIds } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!body || typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ error: "Body is required" });
    }

    const effectiveTargetType = targetType || "ROLE";
    const effectiveTargetIds =
      effectiveTargetType === "ROLE"
        ? [targetRole || "STUDENT"]
        : Array.isArray(targetIds)
          ? targetIds
          : [];

    if (effectiveTargetType !== "ROLE" && effectiveTargetIds.length === 0) {
      return res
        .status(400)
        .json({ error: "targetIds is required for this target type" });
    }

    const result = await announcementsService.create({
      title: title.trim(),
      body: body.trim(),
      targetRole: targetRole || "STUDENT",
      targetType: effectiveTargetType,
      targetIds: effectiveTargetIds,
      createdBy: req.user!.userId,
    });

    return res.status(201).json(result);
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to create announcement",
    });
  }
});

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
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete announcement",
    });
  }
});

export default router;
