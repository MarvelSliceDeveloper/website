import { Router, type Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireSuperAdmin,
  requireRole,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { paginate } from "../../../utils/paginate";
import { handleControllerError, AppError } from "../../../utils/errors";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

// ── GET / — List instructors with pagination ──
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });

    const statusFilter = req.query.status as string | undefined;

    const where: Record<string, unknown> = { role: UserRole.INSTRUCTOR, deletedAt: null };
    if (statusFilter) {
      where.instructorProfile = { status: statusFilter };
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { id: "desc" },
        include: {
          instructorProfile: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const itemsWithWorkload = await Promise.all(
      items.map(async (user) => {
        const [activeBatchCount, liveSessionCount] = await Promise.all([
          prisma.batch.count({
            where: { instructorId: user.id, status: "ACTIVE", deletedAt: null },
          }),
          prisma.liveSession.count({
            where: { instructorId: user.id, deletedAt: null },
          }),
        ]);
        return {
          ...user,
          passwordHash: undefined,
          msAccessToken: undefined,
          msRefreshToken: undefined,
          activeBatchCount,
          liveSessionCount,
        };
      }),
    );

    return res.json({ items: itemsWithWorkload, total, page, limit });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── GET /:id — Get single instructor detail ──
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
      include: { instructorProfile: true },
    });

    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    const [activeBatchCount, liveSessionCount, completedSessionCount] = await Promise.all([
      prisma.batch.count({
        where: { instructorId: user.id, status: "ACTIVE", deletedAt: null },
      }),
      prisma.liveSession.count({
        where: { instructorId: user.id, deletedAt: null },
      }),
      prisma.liveSession.count({
        where: { instructorId: user.id, endedAt: { not: null }, deletedAt: null },
      }),
    ]);

    return res.json({
      ...user,
      passwordHash: undefined,
      msAccessToken: undefined,
      msRefreshToken: undefined,
      activeBatchCount,
      liveSessionCount,
      completedSessionCount,
    });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── POST / — Create instructor account (SUPER_ADMIN only) ──
router.post("/", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email) {
      throw new AppError(400, "name and email are required");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, "A user with this email already exists");
    }

    const generatedPassword = password || crypto.randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(generatedPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: UserRole.INSTRUCTOR,
        instructorProfile: {
          create: {},
        },
      },
      include: { instructorProfile: true },
    });

    return res.status(201).json({
      ...user,
      passwordHash: undefined,
      generatedPassword: password ? undefined : generatedPassword,
    });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── PUT /:id — Update instructor profile ──
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    const {
      bio,
      designation,
      qualification,
      experienceYears,
      skills,
      currentlyEmployed,
      companyName,
      availableTime,
      phone,
      address,
      city,
      state,
      country,
      photoUrl,
      resumeUrl,
      languages,
      socialLinks,
      bankName,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      upiId,
      joiningDate,
    } = req.body;

    const profile = await prisma.instructorProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {
        ...(bio !== undefined && { bio }),
        ...(designation !== undefined && { designation }),
        ...(qualification !== undefined && { qualification }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(skills !== undefined && { skills }),
        ...(currentlyEmployed !== undefined && { currentlyEmployed }),
        ...(companyName !== undefined && { companyName }),
        ...(availableTime !== undefined && { availableTime }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(resumeUrl !== undefined && { resumeUrl }),
        ...(languages !== undefined && { languages }),
        ...(socialLinks !== undefined && { socialLinks }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccountNumber !== undefined && { bankAccountNumber }),
        ...(bankIfscCode !== undefined && { bankIfscCode }),
        ...(bankAccountHolderName !== undefined && { bankAccountHolderName }),
        ...(upiId !== undefined && { upiId }),
        ...(joiningDate !== undefined && { joiningDate: new Date(joiningDate) }),
      },
    });

    return res.json(profile);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── PUT /:id/verify — Verify/reject instructor (SUPER_ADMIN only) ──
router.put("/:id/verify", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { action, rejectionReason } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      throw new AppError(400, "action must be 'approve' or 'reject'");
    }

    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
      include: { instructorProfile: true },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    if (action === "approve") {
      const [updatedUser] = await Promise.all([
        prisma.instructorProfile.update({
          where: { userId: user.id },
          data: {
            status: "APPROVED",
            verifiedById: req.user!.userId,
            verifiedAt: new Date(),
            rejectionReason: null,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { instructorOnboardingComplete: true },
        }),
      ]);
      return res.json(updatedUser);
    }

    const updated = await prisma.instructorProfile.update({
      where: { userId: user.id },
      data: {
        status: "REJECTED",
        rejectionReason: rejectionReason || null,
        verifiedById: req.user!.userId,
        verifiedAt: new Date(),
      },
    });

    return res.json(updated);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── PUT /:id/status — Activate/deactivate instructor (SUPER_ADMIN only) ──
router.put("/:id/status", requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !["ACTIVE", "INACTIVE"].includes(status)) {
      throw new AppError(400, "status must be 'ACTIVE' or 'INACTIVE'");
    }

    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    const updated = await prisma.instructorProfile.update({
      where: { userId: user.id },
      data: { status: status as any },
    });

    return res.json(updated);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── DELETE /:id — Soft-delete instructor ──
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date(), deletedBy: req.user!.userId },
    });

    return res.json({ message: "Instructor deleted successfully" });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── GET /:id/login-history — Login logs ──
router.get("/:id/login-history", async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });

    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    const [items, total] = await Promise.all([
      prisma.loginLog.findMany({
        where: { userId: user.id },
        skip,
        take,
        orderBy: { loginAt: "desc" },
      }),
      prisma.loginLog.count({ where: { userId: user.id } }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── GET /:id/sessions — Live sessions led by this instructor ──
router.get("/:id/sessions", async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });

    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    const [items, total] = await Promise.all([
      prisma.liveSession.findMany({
        where: { instructorId: user.id, deletedAt: null },
        skip,
        take,
        orderBy: { scheduledAt: "desc" },
        include: {
          _count: { select: { attendance: true } },
          batch: { select: { id: true, name: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.liveSession.count({ where: { instructorId: user.id, deletedAt: null } }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── GET /:id/assignments — Assignment activity ──
router.get("/:id/assignments", async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });

    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    const batches = await prisma.batch.findMany({
      where: { instructorId: user.id, deletedAt: null },
      select: { id: true },
    });
    const batchIds = batches.map((b) => b.id);

    const [items, total] = await Promise.all([
      prisma.assignment.findMany({
        where: { batchId: { in: batchIds }, deletedAt: null },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          course: { select: { id: true, title: true } },
          batch: { select: { id: true, name: true } },
          module: { select: { id: true, title: true } },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
      }),
      prisma.assignment.count({ where: { batchId: { in: batchIds }, deletedAt: null } }),
    ]);

    const itemsWithGraded = await Promise.all(
      items.map(async (assignment) => {
        const gradedCount = await prisma.assignmentSubmission.count({
          where: { assignmentId: assignment.id, status: "GRADED" },
        });
        return { ...assignment, gradedCount };
      }),
    );

    return res.json({ items: itemsWithGraded, total, page, limit });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── GET /:id/mentorship — Mentorship tickets ──
router.get("/:id/mentorship", async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });

    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    const [items, total] = await Promise.all([
      prisma.mentorshipTicket.findMany({
        where: { mentorId: user.id },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.mentorshipTicket.count({ where: { mentorId: user.id } }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// ── GET /:id/performance — Performance stats ──
router.get("/:id/performance", async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.INSTRUCTOR, deletedAt: null },
      include: { instructorProfile: true },
    });
    if (!user) {
      throw new AppError(404, "Instructor not found");
    }

    const batches = await prisma.batch.findMany({
      where: { instructorId: user.id, deletedAt: null },
      select: { id: true },
    });
    const batchIds = batches.map((b) => b.id);

    const [
      totalSessions,
      completedSessions,
      totalBatches,
      activeBatches,
      totalAssignments,
      gradedSubmissions,
      totalStudentsEnrolled,
    ] = await Promise.all([
      prisma.liveSession.count({
        where: { instructorId: user.id, deletedAt: null },
      }),
      prisma.liveSession.count({
        where: { instructorId: user.id, endedAt: { not: null }, deletedAt: null },
      }),
      prisma.batch.count({
        where: { instructorId: user.id, deletedAt: null },
      }),
      prisma.batch.count({
        where: { instructorId: user.id, status: "ACTIVE", deletedAt: null },
      }),
      prisma.assignment.count({
        where: { batchId: { in: batchIds }, deletedAt: null },
      }),
      prisma.assignmentSubmission.count({
        where: {
          assignment: { batchId: { in: batchIds } },
          status: "GRADED",
        },
      }),
      prisma.enrollmentRequest.count({
        where: {
          batchId: { in: batchIds },
          status: "APPROVED",
        },
      }),
    ]);

    return res.json({
      totalSessions,
      completedSessions,
      totalBatches,
      activeBatches,
      totalAssignments,
      gradedSubmissions,
      totalStudentsEnrolled,
      avgRating: user.instructorProfile?.rating ?? 0,
      totalStudents: user.instructorProfile?.totalStudents ?? 0,
      completedSessionsInProfile: user.instructorProfile?.completedSessions ?? 0,
    });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

export const instructorsRouter = router;
