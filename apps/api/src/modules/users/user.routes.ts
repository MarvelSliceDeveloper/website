import { Router, type Request, type Response } from "express";
import { prisma } from "../../utils/prisma";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import bcrypt from "bcryptjs";
import { emailService } from "../../services/email.service";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));

function handleError(res: Response, error: unknown) {
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";
  return res.status(500).json({ error: message });
}

// GET /api/users — list all users (admin only)
// Lists all users in the system
router.get("/", async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return res.json(users);
  } catch (error) {
    return handleError(res, error);
  }
});

// POST /api/users — create a new user (admin only)
// Creates a new user account
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Name, email, password, and role are required" });
    }

    if (!["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid user role" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role as UserRole,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    emailService
      .sendWelcomeEmail({ name: user.name, email: user.email })
      .catch((err) => {
        console.error("[users] Failed to send welcome email:", err);
      });

    return res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
});

// PATCH /api/users/:id — update user name, email, role (admin only)
// Updates a user's details
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    if (!name && !email && !role) {
      return res
        .status(400)
        .json({ error: "At least one field (name, email, role) is required" });
    }

    if (role && !["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Invalid user role" });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    return res.json(user);
  } catch (error) {
    return handleError(res, error);
  }
});

// DELETE /api/users/:id — delete a user (admin only)
// Deletes a user and their related records
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        instructorOf: { take: 1, select: { id: true, name: true } },
        sessionsLed: { take: 1, select: { id: true } },
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.instructorOf.length > 0) {
      return res.status(409).json({
        error:
          "Cannot delete user: they are the instructor of one or more batches. Reassign the batches before deleting this user.",
      });
    }

    await prisma.$transaction(async (tx) => {
      // Nullify optional foreign keys
      if (user.sessionsLed.length > 0) {
        await tx.liveSession.updateMany({
          where: { instructorId: id },
          data: { instructorId: null },
        });
      }
      await tx.mentorshipTicket.updateMany({
        where: { mentorId: id },
        data: { mentorId: null },
      });

      // Delete owned records
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.notificationPreference.deleteMany({ where: { userId: id } });
      await tx.progress.deleteMany({ where: { userId: id } });
      await tx.certificate.deleteMany({ where: { userId: id } });
      await tx.enrollmentRequest.deleteMany({ where: { userId: id } });
      await tx.attendance.deleteMany({ where: { userId: id } });
      await tx.mentorshipTicket.deleteMany({ where: { studentId: id } });
      await tx.assignmentSubmission.deleteMany({ where: { studentId: id } });

      await tx.user.delete({ where: { id } });
    });

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return handleError(res, error);
  }
});

export const userRouter = router;
