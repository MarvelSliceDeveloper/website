import { Router, Response } from "express";
import {
  requireAuth,
  requireRole,
  AuthRequest,
} from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { prisma } from "../../utils/prisma";
import { paginate } from "../../utils/paginate";
import {
  notificationService,
  dispatchEmailsForNotification,
} from "../notifications/notification.service";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));

// GET /api/admin/enrollments — list enrollment requests with filters
// Lists all enrollment requests with optional filters
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { status, courseId, page, limit } = req.query;
    const {
      skip,
      take,
      page: currentPage,
      limit: currentLimit,
    } = paginate({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    const where: any = {};
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;

    const [enrollments, total] = await Promise.all([
      prisma.enrollmentRequest.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true } },
          batch: { select: { id: true, name: true } },
        },
        orderBy: { appliedAt: "desc" },
      }),
      prisma.enrollmentRequest.count({ where }),
    ]);

    // Fetch course titles separately since enrollmentRequest doesn't have a direct course relation
    const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c.title]));

    const items = enrollments.map((e) => ({
      id: e.id,
      userId: e.userId,
      courseId: e.courseId,
      courseTitle: courseMap.get(e.courseId) || "Unknown",
      batchId: e.batchId,
      batchName: e.batch?.name || null,
      status: e.status,
      appliedAt: e.appliedAt,
      reviewedAt: e.reviewedAt,
      user: e.user,
    }));

    return res.json({ items, total, page: currentPage, limit: currentLimit });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/enrollments/:id/approve — approve and assign to batch
// Approves an enrollment and assigns to a batch
router.patch("/:id/approve", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { batchId } = req.body;

    if (!batchId) {
      return res
        .status(400)
        .json({ error: "batchId is required to approve an enrollment" });
    }

    const enrollment = await prisma.enrollmentRequest.findUnique({
      where: { id },
    });
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment request not found" });
    }
    if (enrollment.status !== "PENDING") {
      return res.status(400).json({
        error: `Cannot approve enrollment with status: ${enrollment.status}`,
      });
    }

    // Verify batch exists and belongs to the correct course
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        _count: {
          select: {
            enrollments: { where: { status: "APPROVED" } },
          },
        },
        course: { select: { title: true } },
      },
    });
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }
    if (batch.courseId !== null && batch.courseId !== enrollment.courseId) {
      return res
        .status(400)
        .json({ error: "Batch does not belong to the enrolled course" });
    }
    if (batch.maxStudents && batch._count.enrollments >= batch.maxStudents) {
      return res
        .status(400)
        .json({ error: "Batch has reached maximum capacity" });
    }

    const updated = await prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        batchId,
        reviewedAt: new Date(),
      },
    });

    await notificationService.create({
      userId: enrollment.userId,
      type: "ENROLLMENT_APPROVED",
      title: "Enrollment Approved!",
      message: `Your enrollment has been approved. You've been assigned to batch "${batch.name}".`,
      metadata: { courseId: enrollment.courseId, batchId },
    });

    dispatchEmailsForNotification([enrollment.userId], "ENROLLMENT_APPROVED", {
      courseName: batch.course?.title || "Course",
      batchName: batch.name || "",
    });

    return res.json({ message: "Enrollment approved", enrollment: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/enrollments/:id/reject — reject enrollment
// Rejects an enrollment request
router.patch("/:id/reject", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollmentRequest.findUnique({
      where: { id },
    });
    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment request not found" });
    }
    if (enrollment.status !== "PENDING") {
      return res.status(400).json({
        error: `Cannot reject enrollment with status: ${enrollment.status}`,
      });
    }

    const updated = await prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: enrollment.courseId },
      select: { title: true },
    });

    await notificationService.create({
      userId: enrollment.userId,
      type: "ENROLLMENT_REJECTED",
      title: "Enrollment Update",
      message:
        "Unfortunately, your enrollment request was not approved at this time.",
      metadata: { courseId: enrollment.courseId },
    });

    dispatchEmailsForNotification([enrollment.userId], "ENROLLMENT_REJECTED", {
      courseName: course?.title || "Course",
      reason: undefined,
    });

    return res.json({ message: "Enrollment rejected", enrollment: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export const enrollmentRouter = router;
