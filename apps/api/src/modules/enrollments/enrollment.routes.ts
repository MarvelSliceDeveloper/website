import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';
import { prisma } from '../../utils/prisma';

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));

// GET /api/admin/enrollments — list enrollment requests with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, courseId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;

    const enrollments = await prisma.enrollmentRequest.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } },
      },
      orderBy: { appliedAt: 'desc' },
    });

    // Fetch course titles separately since enrollmentRequest doesn't have a direct course relation
    const courseIds = [...new Set(enrollments.map((e) => e.courseId))];
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c.title]));

    const result = enrollments.map((e) => ({
      id: e.id,
      userId: e.userId,
      courseId: e.courseId,
      courseTitle: courseMap.get(e.courseId) || 'Unknown',
      batchId: e.batchId,
      batchName: e.batch?.name || null,
      status: e.status,
      appliedAt: e.appliedAt,
      reviewedAt: e.reviewedAt,
      user: e.user,
    }));

    return res.json({ enrollments: result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/enrollments/:id/approve — approve and assign to batch
router.patch('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { batchId } = req.body;

    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required to approve an enrollment' });
    }

    const enrollment = await prisma.enrollmentRequest.findUnique({ where: { id } });
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }
    if (enrollment.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot approve enrollment with status: ${enrollment.status}` });
    }

    // Verify batch exists and belongs to the correct course
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    if (batch.courseId !== enrollment.courseId) {
      return res.status(400).json({ error: 'Batch does not belong to the enrolled course' });
    }
    if (batch.maxStudents && batch._count.enrollments >= batch.maxStudents) {
      return res.status(400).json({ error: 'Batch has reached maximum capacity' });
    }

    const updated = await prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        batchId,
        reviewedAt: new Date(),
      },
    });

    // Create in-app notification for the student
    try {
      await prisma.notification.create({
        data: {
          userId: enrollment.userId,
          type: 'ENROLLMENT_APPROVED',
          title: 'Enrollment Approved! 🎉',
          message: `Your enrollment has been approved. You've been assigned to batch "${batch.name}".`,
        },
      });
    } catch (notifErr) {
      console.error('Failed to send approval notification:', notifErr);
    }

    return res.json({ message: 'Enrollment approved', enrollment: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/enrollments/:id/reject — reject enrollment
router.patch('/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollmentRequest.findUnique({ where: { id } });
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment request not found' });
    }
    if (enrollment.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot reject enrollment with status: ${enrollment.status}` });
    }

    const updated = await prisma.enrollmentRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
      },
    });

    // Notify student
    try {
      await prisma.notification.create({
        data: {
          userId: enrollment.userId,
          type: 'ENROLLMENT_REJECTED',
          title: 'Enrollment Update',
          message: 'Unfortunately, your enrollment request was not approved at this time.',
        },
      });
    } catch (notifErr) {
      console.error('Failed to send rejection notification:', notifErr);
    }

    return res.json({ message: 'Enrollment rejected', enrollment: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export const enrollmentRouter = router;
