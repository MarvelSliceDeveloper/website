import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";

export const dashboardController = {
  async getStats(req: AuthRequest, res: Response) {
    try {
      const { from, to } = req.query;

      // Build date filter for enrollment trend
      const dateFilter: any = {};
      if (from && typeof from === "string") {
        dateFilter.gte = new Date(from);
      }
      if (to && typeof to === "string") {
        dateFilter.lte = new Date(to);
      }
      const hasDateFilter = dateFilter.gte || dateFilter.lte;

      // Students per course (from PackageEnrollment → PackageEnrollmentCourse)
      const studentsPerCourse = await prisma.packageEnrollmentCourse.groupBy({
        by: ["courseId"],
        where: { enrollment: { status: "APPROVED" } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      });

      // Students per package (from PackageEnrollment)
      const studentsPerPackage = await prisma.packageEnrollment.groupBy({
        by: ["packageId"],
        where: { status: "APPROVED" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      });

      const pkgIds = studentsPerPackage.map((s) => s.packageId);
      const pkgs = await prisma.coursePackage.findMany({
        where: { id: { in: pkgIds } },
        select: { id: true, name: true },
      });
      const pkgMap = new Map(pkgs.map((p) => [p.id, p.name]));

      const studentsPerPackageResolved = studentsPerPackage.map((s) => ({
        packageName: pkgMap.get(s.packageId) || "Unknown",
        count: s._count.id,
      }));

      // Batch distribution
      const batchDistribution = await prisma.batch.groupBy({
        by: ["status"],
        _count: { id: true },
      });

      // User role distribution
      const userRoleDistribution = await prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      });

      // Recent enrollments (from PackageEnrollment — the active system)
      const recentEnrollments = await prisma.packageEnrollment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          package: { select: { name: true } },
        },
      });

      const recentEnrollmentsResolved = recentEnrollments.map((e) => ({
        id: e.id,
        userName: e.user.name,
        userEmail: e.user.email,
        packageName: e.package.name,
        status: e.status,
        appliedAt: e.createdAt,
      }));

      // Top courses by enrollment count (from PackageEnrollmentCourse)
      const topCourses = await prisma.packageEnrollmentCourse.groupBy({
        by: ["courseId"],
        where: { enrollment: { status: "APPROVED" } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      });

      // Enrollment trend (monthly, cumulative) — from PackageEnrollment
      const enrollmentWhere: any = { status: "APPROVED" };
      if (hasDateFilter) {
        enrollmentWhere.createdAt = dateFilter;
      }
      const enrollments = await prisma.packageEnrollment.findMany({
        where: enrollmentWhere,
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      // Group by month in JS
      const monthMap = new Map<string, number>();
      for (const e of enrollments) {
        const key = e.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      }

      let cumulative = 0;
      const enrollmentTrendResolved = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => {
          cumulative += count;
          return { month, count: cumulative };
        });

      // Resolve course IDs to titles
      const courseIds1 = studentsPerCourse.map((s) => s.courseId);
      const courses1 = await prisma.course.findMany({
        where: { id: { in: courseIds1 } },
        select: { id: true, title: true },
      });
      const courseMap1 = new Map(courses1.map((c) => [c.id, c.title]));

      const studentsPerCourseResolved = studentsPerCourse.map((s) => ({
        courseTitle: courseMap1.get(s.courseId) || "Unknown",
        count: s._count.id,
      }));

      const courseIds2 = topCourses.map((t) => t.courseId);
      const courses2 = await prisma.course.findMany({
        where: { id: { in: courseIds2 } },
        select: { id: true, title: true },
      });
      const courseMap2 = new Map(courses2.map((c) => [c.id, c.title]));

      const topCoursesResolved = topCourses.map((t) => ({
        courseTitle: courseMap2.get(t.courseId) || "Unknown",
        enrollmentCount: t._count.id,
      }));

      res.json({
        studentsPerCourse: studentsPerCourseResolved,
        studentsPerPackage: studentsPerPackageResolved,
        enrollmentTrend: enrollmentTrendResolved,
        batchDistribution: batchDistribution.map((b) => ({
          status: b.status,
          count: b._count.id,
        })),
        userRoleDistribution: userRoleDistribution.map((u) => ({
          role: u.role,
          count: u._count.id,
        })),
        topCourses: topCoursesResolved,
        recentEnrollments: recentEnrollmentsResolved,
      });
    } catch (error: any) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};
