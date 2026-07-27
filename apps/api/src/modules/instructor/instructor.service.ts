import { prisma } from "../../utils/prisma";

export const instructorService = {
  async getAnalytics(instructorId: string) {
    const batches = await prisma.batch.findMany({
      where: {
        OR: [
          { instructorId },
          { courseMentors: { some: { mentorId: instructorId } } },
        ],
      },
      select: { id: true, courseId: true },
    });

    const batchIds = batches.map((b) => b.id);
    const courseIds = [
      ...new Set(batches.map((b) => b.courseId).filter(Boolean)),
    ] as string[];

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
        _count: { select: { enrollments: true, sessions: true } },
      },
      orderBy: { startDate: "desc" },
    });
  },

  async getMyCourses(instructorId: string) {
    const batches = await prisma.batch.findMany({
      where: {
        OR: [
          { instructorId },
          { courseMentors: { some: { mentorId: instructorId } } },
        ],
      },
      select: { courseId: true },
    });

    const courseIds = [
      ...new Set(batches.map((b) => b.courseId).filter(Boolean)),
    ] as string[];

    return prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        _count: { select: { modules: true, batches: true } },
      },
    });
  },
};
