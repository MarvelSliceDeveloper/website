import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../utils/prisma';

export const dashboardController = {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const studentsPerCourse = await prisma.enrollmentRequest.groupBy({
        by: ['courseId'],
        where: { status: 'APPROVED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const batchDistribution = await prisma.batch.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      const userRoleDistribution = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      });

      const recentEnrollments = await prisma.enrollmentRequest.findMany({
        take: 10,
        orderBy: { appliedAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      const topCourses = await prisma.enrollmentRequest.groupBy({
        by: ['courseId'],
        where: { status: 'APPROVED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      });

      const revenueTrend = await prisma.payment.findMany({
        where: { status: 'paid' },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      const enrollmentTrend = await prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', "appliedAt")::date AS month,
          COUNT(*)::int AS count
        FROM "EnrollmentRequest"
        GROUP BY DATE_TRUNC('month', "appliedAt")
        ORDER BY month ASC
      `;

      const courseIds1 = studentsPerCourse.map((s) => s.courseId);
      const courses1 = await prisma.course.findMany({
        where: { id: { in: courseIds1 } },
        select: { id: true, title: true },
      });
      const courseMap1 = new Map(courses1.map((c) => [c.id, c.title]));

      const studentsPerCourseResolved = studentsPerCourse.map((s) => ({
        courseTitle: courseMap1.get(s.courseId) || 'Unknown',
        count: s._count.id,
      }));

      const courseIds2 = topCourses.map((t) => t.courseId);
      const courses2 = await prisma.course.findMany({
        where: { id: { in: courseIds2 } },
        select: { id: true, title: true },
      });
      const courseMap2 = new Map(courses2.map((c) => [c.id, c.title]));

      const topCoursesResolved = topCourses.map((t) => ({
        courseTitle: courseMap2.get(t.courseId) || 'Unknown',
        enrollmentCount: t._count.id,
      }));

      let cumulative = 0;
      const enrollmentTrendResolved = (enrollmentTrend as Array<{ month: Date; count: number }>).map((row) => {
        cumulative += row.count;
        return { month: row.month.toISOString().slice(0, 7), count: cumulative };
      });

      const revenueMap = new Map<string, number>();
      for (const p of revenueTrend) {
        const key = p.createdAt.toISOString().slice(0, 7);
        revenueMap.set(key, (revenueMap.get(key) || 0) + p.amount);
      }
      const revenueTrendResolved = Array.from(revenueMap.entries())
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const enrollmentCourseIds = recentEnrollments.map((e) => e.courseId);
      const enrollmentCourses = await prisma.course.findMany({
        where: { id: { in: enrollmentCourseIds } },
        select: { id: true, title: true },
      });
      const enrollmentCourseMap = new Map(enrollmentCourses.map((c) => [c.id, c.title]));

      const recentEnrollmentsResolved = recentEnrollments.map((e) => ({
        id: e.id,
        userName: e.user.name,
        userEmail: e.user.email,
        courseTitle: enrollmentCourseMap.get(e.courseId) || 'Unknown',
        status: e.status,
        appliedAt: e.appliedAt,
      }));

      res.json({
        studentsPerCourse: studentsPerCourseResolved,
        enrollmentTrend: enrollmentTrendResolved,
        batchDistribution: batchDistribution.map((b) => ({
          status: b.status,
          count: b._count.id,
        })),
        revenueTrend: revenueTrendResolved,
        userRoleDistribution: userRoleDistribution.map((u) => ({
          role: u.role,
          count: u._count.id,
        })),
        topCourses: topCoursesResolved,
        recentEnrollments: recentEnrollmentsResolved,
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ error: error.message });
    }
  },
};
