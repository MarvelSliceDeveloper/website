import { Router, type Request, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get("/export/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
        mustChangePassword: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const [enrollments, certificates, quizAttempts, submissions, notifications] =
      await Promise.all([
        prisma.enrollmentRequest.findMany({
          where: { userId },
        }),
        prisma.certificate.findMany({
          where: { userId },
          include: { course: { select: { id: true, title: true } } },
        }),
        prisma.quizAttempt.findMany({
          where: { userId },
          include: { quiz: { select: { id: true, title: true } } },
        }),
        prisma.assignmentSubmission.findMany({
          where: { studentId: userId },
          include: { assignment: { select: { id: true, title: true } } },
        }),
        prisma.notification.findMany({
          where: { userId },
          take: 100,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    return res.json({
      exportedAt: new Date().toISOString(),
      user,
      enrollments: enrollments.map((e) => ({
        id: e.id,
        courseId: e.courseId,
        status: e.status,
        createdAt: e.appliedAt,
      })),
      certificates: certificates.map((c) => ({
        id: c.id,
        courseTitle: c.course?.title,
        issuedAt: c.issuedAt,
        certificateNumber: c.certificateNumber,
      })),
      quizAttempts: quizAttempts.map((qa) => ({
        id: qa.id,
        quizTitle: qa.quiz?.title,
        score: qa.score,
        percentage: qa.percentage,
        passed: qa.isPassed,
        createdAt: qa.createdAt,
      })),
      submissions: submissions.map((s) => ({
        id: s.id,
        assignmentTitle: s.assignment?.title,
        score: s.grade,
        status: s.status,
        createdAt: s.submittedAt,
      })),
      recentNotifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
      })),
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to export user data",
    });
  }
});

router.post("/anonymize/:userId", async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const anonymizedEmail = `deleted-${user.id.slice(0, 8)}@anonymized.local`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: "Deleted User",
        email: anonymizedEmail,
        passwordHash: null,
        isSuspended: true,
        msUserId: null,
        msAccessToken: null,
        msRefreshToken: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: "ANONYMIZE_USER",
        entityType: "User",
        entityId: userId,
        details: { anonymizedEmail },
        ipAddress: req.ip,
      },
    });

    return res.json({ message: "User data anonymized successfully" });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to anonymize user data",
    });
  }
});

export default router;
