import { prisma } from "../../utils/prisma";

export const instructorService = {
  // Builds analytics dashboard data scoped to this instructor.
  // 1. Finds all batches where instructor is teacher or mentor
  // 2. Gets enrolled students and their progress
  // 3. Calculates completion rates per course
  // 4. Computes monthly student retention from login logs
  // 5. Groups video watch progress into drop-off buckets
  // 6. Averages quiz scores across attempts
  async getAnalytics(instructorId: string) {
    const batches = await prisma.batch.findMany({
      where: {
        OR: [
          { instructorId },
          { courseMentors: { some: { mentorId: instructorId } } },
        ],
      },
      select: { id: true, courseId: true, packageId: true },
    });

    const batchIds = batches.map((b) => b.id);
    const directCourseIds = batches
      .map((b) => b.courseId)
      .filter(Boolean) as string[];
    const packageIds = batches
      .map((b) => b.packageId)
      .filter(Boolean) as string[];

    let packageCourseIds: string[] = [];
    if (packageIds.length > 0) {
      const packageCourses = await prisma.packageCourse.findMany({
        where: { packageId: { in: packageIds } },
        select: { courseId: true },
      });
      packageCourseIds = packageCourses.map((pc) => pc.courseId);
    }

    const courseIds = [...new Set([...directCourseIds, ...packageCourseIds])];

    const enrolledStudents = await prisma.enrollmentRequest.findMany({
      where: { batchId: { in: batchIds }, status: "APPROVED" },
      select: { userId: true, courseId: true, batchId: true },
    });
    const studentIds = [...new Set(enrolledStudents.map((e) => e.userId))];

    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        modules: {
          select: { lessons: { select: { id: true } } },
        },
      },
    });

    const completionRates = await Promise.all(
      courses.map(async (c) => {
        const totalLessons = c.modules.reduce(
          (sum, m) => sum + m.lessons.length,
          0,
        );

        const courseStudentIds = enrolledStudents
          .filter((e) => e.courseId === c.id)
          .map((e) => e.userId);

        const completedLessons = await prisma.progress.count({
          where: {
            userId: { in: courseStudentIds },
            completedAt: { not: null },
          },
        });

        const rate =
          courseStudentIds.length > 0 && totalLessons > 0
            ? Math.min(
                100,
                Math.round(
                  (completedLessons /
                    (courseStudentIds.length * totalLessons)) *
                    100,
                ),
              )
            : 0;

        return {
          courseId: c.id,
          courseTitle: c.title,
          completionRate: rate,
          enrolledCount: courseStudentIds.length,
        };
      }),
    );

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const loginLogs = await prisma.loginLog.findMany({
      where: {
        userId: { in: studentIds },
        loginAt: { gte: sixMonthsAgo },
      },
      select: { userId: true, loginAt: true },
    });

    const retentionMap = new Map<string, Set<string>>();
    for (const log of loginLogs) {
      const month = log.loginAt.toISOString().slice(0, 7);
      if (!retentionMap.has(month)) retentionMap.set(month, new Set());
      retentionMap.get(month)!.add(log.userId);
    }

    const activeRetention = Array.from(retentionMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, userSet]) => ({
        month,
        activeStudents: userSet.size,
      }));

    const progressRecords = await prisma.progress.findMany({
      where: { userId: { in: studentIds } },
      include: { recording: { select: { duration: true } } },
    });

    let bucket0_25 = 0;
    let bucket25_50 = 0;
    let bucket50_75 = 0;
    let bucket75_100 = 0;

    for (const p of progressRecords) {
      const dur = p.recording?.duration || 600;
      const pct = (p.watchedSeconds / dur) * 100;
      if (pct < 25) bucket0_25++;
      else if (pct < 50) bucket25_50++;
      else if (pct < 75) bucket50_75++;
      else bucket75_100++;
    }

    const videoDropOff = [
      { bucket: "0 - 25%", count: bucket0_25 },
      { bucket: "25 - 50%", count: bucket25_50 },
      { bucket: "50 - 75%", count: bucket50_75 },
      { bucket: "75 - 100% (Completed)", count: bucket75_100 },
    ];

    const quizzes = await prisma.quiz.findMany({
      where: {
        module: {
          course: { id: { in: courseIds } },
        },
      },
      select: { id: true, title: true },
    });

    const quizIds = quizzes.map((q) => q.id);

    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { quizId: { in: quizIds } },
      include: { quiz: { select: { title: true } } },
    });

    const quizMap = new Map<
      string,
      { title: string; totalPct: number; count: number }
    >();
    for (const qa of quizAttempts) {
      const pct = qa.total > 0 ? (qa.score / qa.total) * 100 : 0;
      const existing = quizMap.get(qa.quizId) || {
        title: qa.quiz.title,
        totalPct: 0,
        count: 0,
      };
      existing.totalPct += pct;
      existing.count += 1;
      quizMap.set(qa.quizId, existing);
    }

    const quizScoreAverages = Array.from(quizMap.values()).map((q) => ({
      quizTitle: q.title,
      averageScorePct: Math.round(q.totalPct / q.count),
      attemptsCount: q.count,
    }));

    return {
      completionRates,
      activeRetention,
      videoDropOff,
      quizScoreAverages,
    };
  },

  // Returns batches where this instructor is the assigned teacher or a course mentor.
  // Includes course title, enrollment count, and session count. Sorted by start date descending.
  async getMyBatches(instructorId: string) {
    return prisma.batch.findMany({
      where: {
        OR: [
          { instructorId },
          { courseMentors: { some: { mentorId: instructorId } } },
        ],
      },
      include: {
        course: { select: { id: true, title: true } },
        courseMentors: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
        _count: {
          select: {
            enrollments: { where: { status: "APPROVED" } },
            sessions: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  },

  // Returns unique courses from the instructor's assigned batches.
  // Primary instructors see all courses in their batch.
  // Course mentors see only the specific courses they're assigned to.
  async getMyCourses(instructorId: string) {
    const [mentorAssignments, primaryBatches] = await Promise.all([
      prisma.batchCourseMentor.findMany({
        where: { mentorId: instructorId },
        select: { batchId: true, courseId: true },
      }),
      prisma.batch.findMany({
        where: { instructorId },
        select: { id: true, courseId: true, packageId: true },
      }),
    ]);

    const courseIdSet = new Set<string>();

    // Courses from per-course mentor assignments
    for (const ma of mentorAssignments) {
      courseIdSet.add(ma.courseId);
    }

    // For primary instructor batches, include all courses
    const primaryPackageIds = primaryBatches
      .map((b) => b.packageId)
      .filter(Boolean) as string[];
    if (primaryPackageIds.length > 0) {
      const packageCourses = await prisma.packageCourse.findMany({
        where: { packageId: { in: primaryPackageIds } },
        select: { courseId: true },
      });
      for (const pc of packageCourses) {
        courseIdSet.add(pc.courseId);
      }
    }
    for (const batch of primaryBatches) {
      if (batch.courseId) courseIdSet.add(batch.courseId);
    }

    const courseIds = [...courseIdSet];

    return prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        _count: { select: { modules: true, batches: true } },
      },
    });
  },

  // Returns recordings from the instructor's batches for a specific course.
  async getMyCourseRecordings(instructorId: string, courseId: string) {
    const batches = await prisma.batch.findMany({
      where: {
        OR: [
          { instructorId, courseId },
          { instructorId, package: { courses: { some: { courseId } } } },
          { courseMentors: { some: { mentorId: instructorId, courseId } } },
        ],
      },
      select: { id: true, name: true },
    });

    if (batches.length === 0) return [];

    const batchIds = batches.map((b) => b.id);
    const batchMap = Object.fromEntries(batches.map((b) => [b.id, b.name]));

    const sessions = await prisma.liveSession.findMany({
      where: {
        batchId: { in: batchIds },
        courseId,
        recording: { isNot: null },
      },
      include: {
        recording: true,
      },
      orderBy: { scheduledAt: "desc" },
    });

    return sessions.map((s) => ({
      id: s.recording!.id,
      title: s.title,
      batchName: batchMap[s.batchId!] || "",
      duration: s.recording!.duration,
      sharePointUrl: s.recording!.sharePointUrl,
      syncedAt: s.recording!.syncedAt,
      scheduledAt: s.scheduledAt,
    }));
  },
};
