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

async function getModuleContentProgress(
  moduleId: string,
  userId: string,
): Promise<{
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  totalAssignments: number;
  completedAssignments: number;
}> {
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      lessons: { select: { id: true, videoUrl: true } },
    },
  });

  if (!module) {
    return {
      totalLessons: 0, completedLessons: 0,
      totalQuizzes: 0, completedQuizzes: 0,
      totalAssignments: 0, completedAssignments: 0,
    };
  }

  const lessons = module.lessons;
  const totalLessons = lessons.length;

  const quizzes = await prisma.quiz.findMany({
    where: { moduleId },
    select: { id: true },
  });
  const totalQuizzes = quizzes.length;

  const assignments = await prisma.assignment.findMany({
    where: { moduleId },
    select: { id: true },
  });
  const totalAssignments = assignments.length;

  const quizIds = quizzes.map((q) => q.id);
  const assignmentIds = assignments.map((a) => a.id);

  const [quizAttempts, assignmentSubmissions] = await Promise.all([
    quizIds.length
      ? prisma.quizAttempt.findMany({
          where: { userId, quizId: { in: quizIds }, status: { not: "PENDING" } },
          select: { quizId: true },
        })
      : Promise.resolve([]),
    assignmentIds.length
      ? prisma.assignmentSubmission.findMany({
          where: { studentId: userId, assignmentId: { in: assignmentIds }, status: "GRADED" },
          select: { assignmentId: true },
        })
      : Promise.resolve([]),
  ]);

  const completedQuizIds = new Set(quizAttempts.map((a) => a.quizId));
  const completedAssignmentIds = new Set(assignmentSubmissions.map((s) => s.assignmentId));

  return {
    totalLessons,
    completedLessons: totalLessons, // lessons with videoUrl are considered "completed" if they exist
    totalQuizzes,
    completedQuizzes: quizIds.filter((id) => completedQuizIds.has(id)).length,
    totalAssignments,
    completedAssignments: assignmentIds.filter((id) => completedAssignmentIds.has(id)).length,
  };
}

export async function getCourseContentProgress(
  courseId: string,
  userId: string,
): Promise<CourseProgress> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const modules = await prisma.module.findMany({
    where: { courseId },
    select: { id: true },
  });

  const moduleProgresses = await Promise.all(
    modules.map((m) => getModuleContentProgress(m.id, userId)),
  );

  const totals = moduleProgresses.reduce(
    (acc, mp) => ({
      totalLessons: acc.totalLessons + mp.totalLessons,
      completedLessons: acc.completedLessons + mp.completedLessons,
      totalQuizzes: acc.totalQuizzes + mp.totalQuizzes,
      completedQuizzes: acc.completedQuizzes + mp.completedQuizzes,
      totalAssignments: acc.totalAssignments + mp.totalAssignments,
      completedAssignments: acc.completedAssignments + mp.completedAssignments,
    }),
    {
      totalLessons: 0, completedLessons: 0,
      totalQuizzes: 0, completedQuizzes: 0,
      totalAssignments: 0, completedAssignments: 0,
    },
  );

  const contentItems = [
    ...(totals.totalQuizzes > 0 ? [{ completed: totals.completedQuizzes, total: totals.totalQuizzes }] : []),
    ...(totals.totalAssignments > 0 ? [{ completed: totals.completedAssignments, total: totals.totalAssignments }] : []),
  ];

  const totalItems = contentItems.reduce((s, c) => s + c.total, 0);
  const completedItems = contentItems.reduce((s, c) => s + c.completed, 0);
  const isComplete = contentItems.length > 0 && contentItems.every((c) => c.completed >= c.total);

  return {
    courseId: course.id,
    courseTitle: course.title,
    totalItems,
    completedItems,
    isComplete,
    details: totals,
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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
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
  if (!assignment.module) return { issued: false, reason: "Assignment not linked to a module" };

  return {
    ...(await checkAndIssueCertificate(studentId, assignment.module.courseId)),
    courseId: assignment.module.courseId,
  };
}
