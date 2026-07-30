import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { paginate } from "../../../utils/paginate";
import { handleControllerError, AppError } from "../../../utils/errors";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });

    const { assignmentId, courseId, instructorId, studentId } = req.query;

    const where: Record<string, unknown> = {
      status: "PENDING",
    };

    if (assignmentId) {
      where.assignmentId = assignmentId as string;
    }

    if (courseId || instructorId) {
      where.assignment = {
        ...(courseId ? { courseId: courseId as string } : {}),
        ...(instructorId ? { batch: { instructorId: instructorId as string } } : {}),
      };
    }

    if (studentId) {
      where.studentId = studentId as string;
    }

    const [items, total] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        skip,
        take,
        where: where as any,
        orderBy: { submittedAt: "desc" },
        include: {
          assignment: {
            select: {
              id: true,
              title: true,
              courseId: true,
              dueDate: true,
              maxPoints: true,
              course: { select: { id: true, title: true } },
              batch: {
                select: {
                  id: true,
                  name: true,
                  instructor: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
          student: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.assignmentSubmission.count({ where: where as any }),
    ]);

    const mapped = items.map((item) => ({
      id: item.id,
      student: item.student,
      assignment: { id: item.assignment.id, title: item.assignment.title },
      course: item.assignment.course,
      batch: item.assignment.batch ? { id: item.assignment.batch.id, name: item.assignment.batch.name } : null,
      instructor: item.assignment.batch?.instructor ?? null,
      fileUrl: item.fileUrl,
      grade: item.grade,
      feedback: item.feedback,
      status: item.status,
      submittedAt: item.submittedAt,
      gradedAt: item.gradedAt,
    }));

    return res.json({ items: mapped, total, page, limit });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const [pending, graded] = await Promise.all([
      prisma.assignmentSubmission.count({ where: { status: "PENDING" } }),
      prisma.assignmentSubmission.count({ where: { status: "GRADED" } }),
    ]);

    const total = pending + graded;

    const rows = await prisma.$queryRaw<
      Array<{ instructorId: string; name: string; pending: bigint; graded: bigint }>
    >`
      SELECT
        u.id AS "instructorId",
        u.name,
        COUNT(*) FILTER (WHERE asub.status = 'PENDING') AS pending,
        COUNT(*) FILTER (WHERE asub.status = 'GRADED') AS graded
      FROM "User" u
      INNER JOIN "Batch" b ON b."instructorId" = u.id
      INNER JOIN "Assignment" a ON a."batchId" = b.id
      INNER JOIN "AssignmentSubmission" asub ON asub."assignmentId" = a.id
      GROUP BY u.id, u.name
      ORDER BY u.name
    `;

    return res.json({
      pending,
      graded,
      total,
      byInstructor: rows.map((r) => ({
        instructorId: r.instructorId,
        name: r.name,
        pending: Number(r.pending),
        graded: Number(r.graded),
      })),
    });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

router.get("/:submissionId", async (req: AuthRequest, res: Response) => {
  try {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: req.params.submissionId },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            courseId: true,
            dueDate: true,
            maxPoints: true,
            type: true,
            questionPdfUrl: true,
            course: { select: { id: true, title: true } },
            batch: {
              select: {
                id: true,
                name: true,
                instructor: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        student: { select: { id: true, name: true, email: true } },
        gradedByUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) {
      throw new AppError(404, "Submission not found");
    }

    return res.json(submission);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

router.post("/:submissionId/grade", async (req: AuthRequest, res: Response) => {
  try {
    const { grade, feedback } = req.body;

    if (!grade) {
      throw new AppError(400, "grade is required");
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: req.params.submissionId },
    });

    if (!submission) {
      throw new AppError(404, "Submission not found");
    }

    if (submission.status === "GRADED") {
      throw new AppError(409, "Submission has already been graded");
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: req.params.submissionId },
      data: {
        status: "GRADED",
        grade,
        feedback: feedback || null,
        gradedAt: new Date(),
        gradedById: req.user!.userId,
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxPoints: true,
          },
        },
        student: { select: { id: true, name: true, email: true } },
        gradedByUser: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json(updated);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

export const assignmentReviewRouter = router;
