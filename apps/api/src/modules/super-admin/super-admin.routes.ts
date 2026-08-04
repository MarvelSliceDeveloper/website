import { Router, type Response } from "express";
import { prisma } from "../../utils/prisma";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../middleware/auth.middleware";
import bcrypt from "bcryptjs";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// GET /api/admin/users/pending — list instructors awaiting approval
router.get("/pending", async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "INSTRUCTOR", instructorProfile: { status: "PENDING" } },
      select: { id: true, name: true, email: true },
    });
    return res.json({ users });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/admin/users/:id/approve — approve pending instructor
router.put("/:id/approve", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "INSTRUCTOR") {
      return res.status(400).json({ error: "User is not an instructor" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          isSuspended: false,
          instructorOnboardingComplete: true,
          suspendedAt: null,
          suspendedBy: null,
        },
      }),
      prisma.instructorProfile.update({
        where: { userId: id },
        data: {
          status: "APPROVED",
          verifiedAt: new Date(),
        },
      }),
    ]);

    return res.json({ message: "Instructor approved" });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/admin/users/:id/suspend — suspend user
router.put("/:id/suspend", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role === "SUPER_ADMIN") {
      return res.status(400).json({ error: "Cannot suspend Super Admin" });
    }
    if (id === req.user!.userId) {
      return res.status(400).json({ error: "Cannot suspend yourself" });
    }

    await prisma.user.update({
      where: { id },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedBy: req.user!.userId,
      },
    });

    return res.json({ message: "User suspended" });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/admin/users/:id/unsuspend — unsuspend user
router.put("/:id/unsuspend", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.update({
      where: { id },
      data: { isSuspended: false, suspendedAt: null, suspendedBy: null },
    });

    return res.json({ message: "User unsuspended" });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// POST /api/admin/users/create-admin — create a new admin user
router.post("/create-admin", async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "ADMIN" },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(201).json({ user });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// DELETE /api/admin/users/:id — soft-delete user
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role === "SUPER_ADMIN") {
      return res.status(400).json({ error: "Cannot delete Super Admin" });
    }
    if (user.deletedAt) {
      return res.status(400).json({ error: "User is already deleted" });
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user!.userId,
      },
    });

    return res.json({ message: "User soft-deleted" });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

// PUT /api/admin/users/:id/restore — restore soft-deleted user
router.put("/:id/restore", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!user.deletedAt) {
      return res.status(400).json({ error: "User is not deleted" });
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        restoredAt: new Date(),
        restoredBy: req.user!.userId,
      },
    });

    return res.json({ message: "User restored" });
  } catch (error: unknown) {
    return res.status(500).json({ error: (error as Error).message });
  }
});

export const superAdminRouter = router;
