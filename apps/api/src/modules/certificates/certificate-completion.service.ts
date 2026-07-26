import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  totalItems: number;
  completedItems: number;
  isComplete: boolean;
  details: {
    totalLessons: number;
    completedLessons: number;
    totalQuizzes: number;
    completedQuizzes: number;
    totalAssignments: number;
    completedAssignments: number;
  };
}

export async function getCourseContentProgress(
  courseId: string,
  userId: string,
): Promise<CourseProgress> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      modules: {
        select: { id: true, lessons: { select: { id: true, videoUrl: true } } },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const moduleIds = course.modules.map((m) => m.id);
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  const [quizzes, assignments] = await Promise.all([
    prisma.quiz.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true, moduleId: true },
    }),
    prisma.assignment.findMany({
      where: { moduleId: { in: moduleIds } },
      select: { id: true, moduleId: true },
    }),
  ]);

  const quizIds = quizzes.map((q) => q.id);
  const assignmentIds = assignments.map((a) => a.id);

  const [quizAttempts, assignmentSubmissions] = await Promise.all([
    quizIds.length
      ? prisma.quizAttempt.findMany({
          where: {
            userId,
            quizId: { in: quizIds },
            status: { not: "PENDING" },
          },
          select: { quizId: true },
        })
      : Promise.resolve([]),
    assignmentIds.length
      ? prisma.assignmentSubmission.findMany({
          where: {
            studentId: userId,
            assignmentId: { in: assignmentIds },
            status: "GRADED",
          },
          select: { assignmentId: true },
        })
      : Promise.resolve([]),
  ]);

  const completedQuizIds = new Set(quizAttempts.map((a) => a.quizId));
  const completedAssignmentIds = new Set(
    assignmentSubmissions.map((s) => s.assignmentId),
  );

  const totalQuizzes = quizzes.length;
  const totalAssignments = assignments.length;
  const completedQuizzes = quizIds.filter((id) =>
    completedQuizIds.has(id),
  ).length;
  const completedAssignments = assignmentIds.filter((id) =>
    completedAssignmentIds.has(id),
  ).length;

  const contentItems = [
    ...(totalQuizzes > 0
      ? [{ completed: completedQuizzes, total: totalQuizzes }]
      : []),
    ...(totalAssignments > 0
      ? [{ completed: completedAssignments, total: totalAssignments }]
      : []),
  ];

  const totalItems = contentItems.reduce((s, c) => s + c.total, 0);
  const completedItems = contentItems.reduce((s, c) => s + c.completed, 0);
  const isComplete =
    contentItems.length > 0 &&
    contentItems.every((c) => c.completed >= c.total);

  return {
    courseId: course.id,
    courseTitle: course.title,
    totalItems,
    completedItems,
    isComplete,
    details: {
      totalLessons,
      completedLessons: totalLessons,
      totalQuizzes,
      completedQuizzes,
      totalAssignments,
      completedAssignments,
    },
  };
}

export async function checkAndIssueCertificate(
  userId: string,
  courseId: string,
): Promise<{ issued: boolean; reason?: string }> {
  // Fast path: already exists
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    return { issued: false, reason: "Certificate already exists" };
  }

  const progress = await getCourseContentProgress(courseId, userId);
  if (!progress.isComplete) {
    return { issued: false, reason: "Course not yet completed" };
  }

  // Create atomically — the @@unique constraint handles concurrent duplicates
  try {
    await prisma.certificate.create({
      data: {
        userId,
        courseId,
        autoIssued: true,
        status: "ISSUED",
      },
    });
    return { issued: true };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { issued: false, reason: "Certificate already exists" };
    }
    throw err;
  }
}

export async function checkAndIssueForQuiz(
  quizId: string,
  userId: string,
): Promise<{ issued: boolean; courseId?: string; reason?: string }> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { module: { select: { courseId: true } } },
  });

  if (!quiz) return { issued: false, reason: "Quiz not found" };

  return {
    ...(await checkAndIssueCertificate(userId, quiz.module.courseId)),
    courseId: quiz.module.courseId,
  };
}

export async function checkAndIssueForAssignment(
  assignmentId: string,
  studentId: string,
): Promise<{ issued: boolean; courseId?: string; reason?: string }> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { module: { select: { courseId: true } } },
  });

  if (!assignment) return { issued: false, reason: "Assignment not found" };
  if (!assignment.module)
    return { issued: false, reason: "Assignment not linked to a module" };

  return {
    ...(await checkAndIssueCertificate(studentId, assignment.module.courseId)),
    courseId: assignment.module.courseId,
  };
}

export async function getPackageSpecialExamProgress(
  userId: string,
  packageId: string,
  batchId?: string,
) {
  const pkg = await prisma.coursePackage.findUnique({
    where: { id: packageId },
    include: {
      courses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              modules: {
                select: {
                  id: true,
                  quizzes: {
                    where: { isSpecialExam: true },
                    select: {
                      id: true,
                      title: true,
                      passingScore: true,
                      attempts: {
                        where: { userId },
                        orderBy: { percentage: "desc" },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!pkg) throw new Error("Package not found");

  const batchVisibilityMap = new Map<string, boolean>();
  if (batchId) {
    const records = await prisma.batchCourseVisibility.findMany({
      where: { batchId },
      select: { courseId: true, isExamRequired: true },
    });
    for (const r of records) {
      batchVisibilityMap.set(r.courseId, r.isExamRequired);
    }
  }

  const courseStatuses = pkg.courses.map((pc) => {
    const c = pc.course;
    const isExamRequired = batchVisibilityMap.get(c.id) ?? true;
    const specialExams = c.modules.flatMap((m) => m.quizzes);
    const primaryExam = specialExams[0] || null;
    const bestAttempt = primaryExam?.attempts[0] || null;
    const isPassed = bestAttempt
      ? bestAttempt.isPassed ||
        bestAttempt.percentage >= (primaryExam?.passingScore ?? 65)
      : false;

    return {
      courseId: c.id,
      courseTitle: c.title,
      isExamRequired,
      specialExamId: primaryExam?.id || null,
      specialExamTitle: primaryExam?.title || null,
      passingScore: primaryExam?.passingScore ?? 65,
      isPassed,
      scorePercentage: bestAttempt?.percentage ?? 0,
      attempted: !!bestAttempt,
    };
  });

  const requiredCourses = courseStatuses.filter((cs) => cs.isExamRequired);
  const allPassed =
    requiredCourses.length > 0 && requiredCourses.every((cs) => cs.isPassed);

  return {
    packageId: pkg.id,
    packageName: pkg.name,
    courses: courseStatuses,
    totalRequired: requiredCourses.length,
    passedCount: requiredCourses.filter((cs) => cs.isPassed).length,
    allPassed,
  };
}

export async function checkAndIssuePackageCertificate(
  userId: string,
  packageId: string,
  batchId?: string,
): Promise<{ issued: boolean; certificate?: any; reason?: string }> {
  const existing = await prisma.certificate.findUnique({
    where: { userId_packageId: { userId, packageId } },
  });

  if (existing) {
    return {
      issued: false,
      certificate: existing,
      reason: "Certificate already claimed",
    };
  }

  const progress = await getPackageSpecialExamProgress(
    userId,
    packageId,
    batchId,
  );
  if (!progress.allPassed) {
    return {
      issued: false,
      reason: "Not all required Special Exams have been passed",
    };
  }

  try {
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        packageId,
        batchId: batchId || null,
        autoIssued: true,
        status: "ISSUED",
      },
    });
    return { issued: true, certificate };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const found = await prisma.certificate.findUnique({
        where: { userId_packageId: { userId, packageId } },
      });
      return {
        issued: false,
        certificate: found,
        reason: "Certificate already claimed",
      };
    }
    throw err;
  }
}
