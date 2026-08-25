import { Prisma } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { moduleService } from "../courses/module.service";

import { AppError } from "../../utils/errors";

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  totalItems: number;
  completedItems: number;
  isComplete: boolean;
  hasCertificationModule: boolean;
  certificationQuizPassed: boolean;
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
        select: {
          id: true,
          isCertificationModule: true,
          lessons: { select: { id: true, videoUrl: true } },
        },
      },
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const certModule = course.modules.find((m) => m.isCertificationModule);
  const regularModules = course.modules.filter((m) => !m.isCertificationModule);
  const regularModuleIds = regularModules.map((m) => m.id);

  const totalLessons = regularModules.reduce((s, m) => s + m.lessons.length, 0);

  const [quizzes, assignments] = await Promise.all([
    prisma.quiz.findMany({
      where: { moduleId: { in: regularModuleIds } },
      select: { id: true, moduleId: true },
    }),
    prisma.assignment.findMany({
      where: { moduleId: { in: regularModuleIds } },
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
  const regularComplete =
    contentItems.length > 0 &&
    contentItems.every((c) => c.completed >= c.total);

  let certificationPassed = false;
  if (certModule) {
    const [certQuizzes, certAssignments] = await Promise.all([
      prisma.quiz.findMany({
        where: { moduleId: certModule.id },
        select: { id: true, passingScore: true },
      }),
      prisma.assignment.findMany({
        where: { moduleId: certModule.id },
        select: { id: true },
      }),
    ]);

    let quizOk = true;
    if (certQuizzes.length > 0) {
      for (const certQuiz of certQuizzes) {
        const certAttempt = await prisma.quizAttempt.findFirst({
          where: {
            userId,
            quizId: certQuiz.id,
            status: { not: "PENDING" },
          },
          orderBy: { createdAt: "desc" },
        });
        const isPassed =
          certAttempt &&
          (certAttempt.isPassed ||
            certAttempt.percentage >= (certQuiz.passingScore ?? 60));
        if (!isPassed) {
          quizOk = false;
          break;
        }
      }
    }

    let assignmentOk = true;
    if (certAssignments.length > 0) {
      const submissions = await prisma.assignmentSubmission.findMany({
        where: {
          studentId: userId,
          assignmentId: { in: certAssignments.map((a) => a.id) },
          status: "GRADED",
        },
        select: { assignmentId: true },
      });
      const gradedSet = new Set(submissions.map((s) => s.assignmentId));
      assignmentOk = certAssignments.every((a) => gradedSet.has(a.id));
    }

    certificationPassed = quizOk && assignmentOk;
  }

  const hasCertificationModule = !!certModule;
  const isComplete = hasCertificationModule
    ? regularComplete && certificationPassed
    : regularComplete;

  return {
    courseId: course.id,
    courseTitle: course.title,
    totalItems,
    completedItems,
    isComplete,
    hasCertificationModule,
    certificationQuizPassed: certificationPassed,
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

export interface CertificationExamEligibility {
  eligible: boolean;
  totalQuizzes: number;
  completedQuizzes: number;
  totalAssignments: number;
  completedAssignments: number;
}

/**
 * A student may attempt the certification exam only after completing every
 * quiz and assignment in the course's regular (non-certification) modules.
 * Lessons are not counted — only quizzes and assignments gate the exam.
 */
export async function getCertificationExamEligibility(
  userId: string,
  courseId: string,
): Promise<CertificationExamEligibility> {
  const progress = await getCourseContentProgress(courseId, userId);
  const {
    totalQuizzes,
    completedQuizzes,
    totalAssignments,
    completedAssignments,
  } = progress.details;

  const eligible =
    completedQuizzes >= totalQuizzes &&
    completedAssignments >= totalAssignments;

  return {
    eligible,
    totalQuizzes,
    completedQuizzes,
    totalAssignments,
    completedAssignments,
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
                where: { isCertificationModule: true },
                select: {
                  id: true,
                  quizzes: {
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

  if (!pkg) throw new AppError(404, "Package not found");

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

  const batch = batchId
    ? await prisma.batch.findUnique({
        where: { id: batchId },
        select: { examEnabled: true },
      })
    : null;

  const courseStatuses = pkg.courses.map((pc) => {
    const c = pc.course;
    const isExamRequired = batchVisibilityMap.get(c.id) ?? true;
    const certModule = c.modules[0] || null;
    const certQuiz = certModule?.quizzes[0] || null;
    const bestAttempt = certQuiz?.attempts[0] || null;
    const isPassed = bestAttempt
      ? bestAttempt.isPassed ||
        bestAttempt.percentage >= (certQuiz?.passingScore ?? 65)
      : false;

    return {
      courseId: c.id,
      courseTitle: c.title,
      isExamRequired,
      certExamId: certQuiz?.id || null,
      certExamTitle: certQuiz?.title || null,
      passingScore: certQuiz?.passingScore ?? 65,
      isPassed,
      scorePercentage: bestAttempt?.percentage ?? 0,
      attempted: !!bestAttempt,
    };
  });

  const requiredCourses = courseStatuses.filter((cs) => cs.isExamRequired);
  const allPassed =
    requiredCourses.length > 0 &&
    requiredCourses.every((cs) => cs.isPassed) &&
    batch?.examEnabled !== false;

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
      reason: "Not all required certification exams have been passed",
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
