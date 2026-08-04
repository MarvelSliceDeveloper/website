import { Router, type Response } from "express";
import { prisma } from "../../utils/prisma";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

type EntityType = "user" | "course" | "batch" | "session" | "assignment";

const entityModels: Record<EntityType, string> = {
  user: "user",
  course: "course",
  batch: "batch",
  session: "liveSession",
  assignment: "assignment",
};

// GET /api/admin/trash — list all soft-deleted entities
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const [users, courses, batches, sessions, assignments] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          email: true,
          deletedAt: true,
          deletedBy: true,
          role: true,
        },
      }),
      prisma.course.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, title: true, deletedAt: true, deletedBy: true },
      }),
      prisma.batch.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, name: true, deletedAt: true, deletedBy: true },
      }),
      prisma.liveSession.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, title: true, deletedAt: true, deletedBy: true },
      }),
      prisma.assignment.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, title: true, deletedAt: true, deletedBy: true },
      }),
    ]);

    return res.json({
      trash: {
        users: users.map((u) => ({ ...u, type: "user" })),
        courses: courses.map((c) => ({ ...c, type: "course" })),
        batches: batches.map((b) => ({ ...b, type: "batch" })),
        sessions: sessions.map((s) => ({ ...s, type: "session" })),
        assignments: assignments.map((a) => ({ ...a, type: "assignment" })),
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/admin/trash/:type/:id/restore — restore a soft-deleted entity
router.post("/:type/:id/restore", async (req: AuthRequest, res: Response) => {
  try {
    const { type, id } = req.params;

    if (!entityModels[type as EntityType]) {
      return res.status(400).json({ error: `Invalid entity type: ${type}` });
    }

    const modelMap: Record<EntityType, any> = {
      user: prisma.user,
      course: prisma.course,
      batch: prisma.batch,
      session: prisma.liveSession,
      assignment: prisma.assignment,
    };

    const model = modelMap[type as EntityType];

    const entity = await model.findUnique({ where: { id } });
    if (!entity) {
      return res.status(404).json({ error: `${type} not found` });
    }
    if (!entity.deletedAt) {
      return res.status(400).json({ error: `${type} is not deleted` });
    }

    await model.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        restoredAt: new Date(),
        restoredBy: req.user!.userId,
      },
    });

    return res.json({ message: `${type} restored successfully` });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export const trashRouter = router;
