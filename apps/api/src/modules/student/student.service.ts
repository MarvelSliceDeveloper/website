import { prisma } from "../../utils/prisma";
import { resolveEffectiveDueDate } from "../../services/due-date.service";

export interface OverdueAssignmentItem {
  id: string;
  courseId: string;
  courseName: string;
  moduleName: string;
  unitName: string;
  assignmentName: string;
  dueDate: string;
  status: "PENDING" | "SUBMITTED";
  type: "QUIZ" | "ASSIGNMENT";
  submissionId?: string | null;
  answerFileUrl?: string | null;
  grade?: string | null;
  totalScore?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  total?: number | null;
  percentage?: number | null;
  isPassed?: boolean | null;
}

export interface ContinueLearningItem {
  recordingId: string;
  batchId: string;
  courseTitle: string;
  dayLabel: string;
  watchedPercent: number;
  thumbnail: string;
}

export interface StudentResultItem {
  id: string;
  type: "ASSIGNMENT" | "QUIZ" | "PROJECT";
  title: string;
  courseName: string;
  moduleName: string;
  score: number | null;
  total: number | null;
  percentage: number | null;
  grade: string | null;
  feedback: string | null;
  submittedAt: string | null;
}

export const studentService = {
  async getOverdueAssignments(
    userId: string,
  ): Promise<OverdueAssignmentItem[]> {
    // Fetch approved package enrollments → course/batch mappings
    const packageEnrollments = await prisma.packageEnrollment.findMany({
      where: { userId, status: "APPROVED" },
      include: {
        courses: {
          select: {
            courseId: true,
            batchId: true,
            course: { select: { title: true } },
          },
        },
      },
    });

    const courseNameMap = new Map<string, string>();
    const batchCourseMap = new Map<string, string>();
    const batchIds: string[] = [];
    const courseIds: string[] = [];

    for (const pe of packageEnrollments) {
      for (const pec of pe.courses) {
        courseIds.push(pec.courseId);
        courseNameMap.set(pec.courseId, pec.course.title);
        if (pec.batchId) {
          batchIds.push(pec.batchId);
          batchCourseMap.set(pec.batchId, pec.courseId);
        }
      }
    }

    if (batchIds.length === 0 && courseIds.length === 0) return [];

    const uniqueBatchIds = [...new Set(batchIds)];
    const uniqueCourseIds = [...new Set(courseIds)];

    // ── Enrollment dates: batchId/courseId → first approved enrollment date ──
    const batchEnrollDateMap = new Map<string, Date>();
    const courseEnrollDateMap = new Map<string, Date>();

    for (const pe of packageEnrollments) {
      for (const pec of pe.courses) {
        if (pec.batchId && !batchEnrollDateMap.has(pec.batchId)) {
          batchEnrollDateMap.set(pec.batchId, pe.createdAt);
        }
        if (!courseEnrollDateMap.has(pec.courseId)) {
          courseEnrollDateMap.set(pec.courseId, pe.createdAt);
        }
      }
    }

    const approvedRequests = await prisma.enrollmentRequest.findMany({
      where: { userId, status: "APPROVED" },
      select: { courseId: true, batchId: true, appliedAt: true },
    });
    for (const er of approvedRequests) {
      if (er.batchId && !batchEnrollDateMap.has(er.batchId)) {
        batchEnrollDateMap.set(er.batchId, er.appliedAt);
      }
      if (!courseEnrollDateMap.has(er.courseId)) {
        courseEnrollDateMap.set(er.courseId, er.appliedAt);
      }
    }

    const result: OverdueAssignmentItem[] = [];
    const seenAssignmentIds = new Set<string>();

    // ── Batch Assignment model overdue items ──────────────────────────
    if (uniqueBatchIds.length > 0) {
      const assignments = await prisma.assignment.findMany({
        where: {
          batchId: { in: uniqueBatchIds },
        },
        include: {
          course: { select: { title: true } },
          batch: { select: { name: true } },
          module: { select: { title: true } },
          submissions: {
            where: { studentId: userId },
            select: {
              id: true,
              status: true,
              grade: true,
              totalScore: true,
              feedback: true,
              submittedAt: true,
              answerFileUrl: true,
            },
            orderBy: { submittedAt: "desc" },
          },
        },
        orderBy: { dueDate: "desc" },
      });

      // Fetch batch-level extensions so extended due dates are reflected
      const extensions = await prisma.batchAssignmentExtension.findMany({
        where: {
          batchId: { in: uniqueBatchIds },
          assignmentId: { not: null },
        },
        select: { assignmentId: true, extendedDueDate: true },
      });
      const extMap = new Map(extensions.map((e) => [e.assignmentId!, e.extendedDueDate]));

      for (const assignment of assignments) {
        const submission = assignment.submissions[0];
        seenAssignmentIds.add(assignment.id);
        const enrollmentDate =
          batchEnrollDateMap.get(assignment.batchId) ??
          courseEnrollDateMap.get(assignment.courseId) ??
          null;
        const effectiveDueDate = resolveEffectiveDueDate(
          assignment.dueDate,
          assignment.daysFromEnrollment,
          enrollmentDate,
          extMap.get(assignment.id),
        );
        result.push({
          id: assignment.id,
          courseId: assignment.courseId,
          courseName: assignment.course.title,
          moduleName: assignment.module?.title || "—",
          unitName: assignment.type === "QUIZ" ? "Quiz" : "Assignment",
          assignmentName: assignment.title,
          dueDate: effectiveDueDate ? effectiveDueDate.toISOString() : "",
          status: submission ? "SUBMITTED" : "PENDING",
          type: assignment.type as "QUIZ" | "ASSIGNMENT",
          submissionId: submission?.id || null,
          answerFileUrl: submission?.answerFileUrl || null,
          grade: submission?.grade ?? null,
          totalScore: submission?.totalScore ?? null,
          feedback: submission?.feedback ?? null,
          submittedAt: submission?.submittedAt?.toISOString() ?? null,
        });
      }
    }

    // ── Course-content assignments (Assignment model with a moduleId) ──
    const courseModules = await prisma.module.findMany({
      where: { courseId: { in: uniqueCourseIds } },
      select: { id: true, title: true, courseId: true },
    });
    const moduleIds = courseModules.map((m) => m.id);
    const moduleMap = new Map(courseModules.map((m) => [m.id, m]));

    if (moduleIds.length > 0) {
      // Course-content assignments (Assignment model with a moduleId)
      const courseAssignments = await prisma.assignment.findMany({
        where: {
          moduleId: { in: moduleIds },
        },
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
          daysFromEnrollment: true,
          batchId: true,
          moduleId: true,
          courseId: true,
          submissions: {
            where: { studentId: userId },
            select: {
              id: true,
              status: true,
              grade: true,
              totalScore: true,
              feedback: true,
              submittedAt: true,
              answerFileUrl: true,
            },
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { dueDate: "desc" },
      });

      for (const assignment of courseAssignments) {
        if (seenAssignmentIds.has(assignment.id)) continue;
        const mod = assignment.moduleId
          ? moduleMap.get(assignment.moduleId)
          : null;
        const courseId = assignment.courseId;
        const submission = (assignment as any).submissions?.[0];
        const enrollmentDate = courseEnrollDateMap.get(courseId) ?? null;
        const effectiveDueDate = resolveEffectiveDueDate(
          assignment.dueDate,
          assignment.daysFromEnrollment,
          enrollmentDate,
        );
        result.push({
          id: assignment.id,
          courseId,
          courseName: courseNameMap.get(courseId) ?? "—",
          moduleName: mod?.title ?? "—",
          unitName: assignment.type === "QUIZ" ? "Quiz" : "Assignment",
          assignmentName: assignment.title,
          dueDate: effectiveDueDate ? effectiveDueDate.toISOString() : "",
          status: submission ? "SUBMITTED" : "PENDING",
          type: assignment.type as "QUIZ" | "ASSIGNMENT",
          submissionId: submission?.id ?? null,
          answerFileUrl: submission?.answerFileUrl ?? null,
          grade: submission?.grade ?? null,
          totalScore: submission?.totalScore ?? null,
          feedback: submission?.feedback ?? null,
          submittedAt: submission?.submittedAt?.toISOString() ?? null,
        });
      }
    }

    // ── Course-content Quiz model quizzes ──────────────────────────────
    if (moduleIds.length > 0) {
      const quizModelQuizzes = await prisma.quiz.findMany({
        where: {
          moduleId: { in: moduleIds },
        },
        include: {
          module: { select: { title: true } },
          attempts: {
            where: { userId, status: "SUBMITTED" },
            select: {
              id: true,
              score: true,
              total: true,
              percentage: true,
              isPassed: true,
              submittedAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          extensions: { select: { extendedDueDate: true } },
        },
        orderBy: { dueDate: "desc" },
      });

      for (const quiz of quizModelQuizzes) {
        const attempt = quiz.attempts[0];
        const courseId = moduleMap.get(quiz.moduleId)?.courseId ?? "";
        const enrollmentDate = courseEnrollDateMap.get(courseId) ?? null;
        const effectiveDueDate = resolveEffectiveDueDate(
          quiz.dueDate,
          quiz.daysFromEnrollment,
          enrollmentDate,
          quiz.extensions[0]?.extendedDueDate,
        );
        result.push({
          id: quiz.id,
          courseId,
          courseName: courseNameMap.get(courseId) ?? "—",
          moduleName: quiz.module?.title ?? "—",
          unitName: "Quiz",
          assignmentName: quiz.title,
          dueDate: effectiveDueDate ? effectiveDueDate.toISOString() : "",
          status: attempt ? "SUBMITTED" : "PENDING",
          type: "QUIZ",
          submissionId: attempt?.id ?? null,
          score: attempt?.score ?? null,
          total: attempt?.total ?? null,
          percentage: attempt?.percentage ?? null,
          isPassed: attempt?.isPassed ?? null,
          submittedAt: attempt?.submittedAt?.toISOString() ?? null,
        });
      }
    }

    result.sort(
      (a, b) =>
        new Date(b.dueDate || 0).getTime() - new Date(a.dueDate || 0).getTime(),
    );

    return result;
  },

  async getContinueLearning(
    userId: string,
  ): Promise<{ continueLearning: ContinueLearningItem[] }> {
    const packageEnrollments = await prisma.packageEnrollment.findMany({
      where: { userId, status: "APPROVED" },
      include: {
        courses: {
          select: {
            courseId: true,
            batchId: true,
            course: { select: { title: true, thumbnailUrl: true } },
          },
        },
      },
    });

    const uniqueBatchIds = [
      ...new Set(
        packageEnrollments.flatMap((pe) =>
          pe.courses.map((c) => c.batchId).filter(Boolean),
        ),
      ),
    ] as string[];

    const batchData = await prisma.batch.findMany({
      where: { id: { in: uniqueBatchIds } },
      select: {
        id: true,
        sessions: {
          orderBy: { scheduledAt: "desc" },
          take: 5,
          select: {
            id: true,
            scheduledAt: true,
            recording: {
              select: {
                id: true,
                duration: true,
                progress: {
                  where: { userId },
                  select: { watchedSeconds: true },
                },
              },
            },
          },
        },
      },
    });

    const batchMap = new Map(batchData.map((b) => [b.id, b]));

    const items: ContinueLearningItem[] = [];

    for (const pe of packageEnrollments) {
      for (const pec of pe.courses) {
        if (!pec.batchId) continue;
        const batch = batchMap.get(pec.batchId);
        if (!batch) continue;

        for (const session of batch.sessions) {
          if (!session.recording) continue;

          const watchedSeconds =
            session.recording.progress[0]?.watchedSeconds ?? 0;
          const totalSeconds = session.recording.duration ?? 1;
          const watchedPercent = Math.min(
            100,
            Math.round((watchedSeconds / totalSeconds) * 100),
          );

          if (watchedPercent > 0 && watchedPercent < 100) {
            items.push({
              recordingId: session.recording.id,
              batchId: pec.batchId,
              courseTitle: `${pec.course.title} — Batch ${pec.batchId.slice(0, 8)}`,
              dayLabel: `Day ${items.filter((i) => i.batchId === pec.batchId).length + 1}`,
              watchedPercent,
              thumbnail: pec.course.thumbnailUrl || "📚",
            });
          }
        }
      }
    }

    return { continueLearning: items.slice(0, 10) };
  },

  async getResults(userId: string): Promise<StudentResultItem[]> {
    const results: StudentResultItem[] = [];

    // ── Graded assignments (Assignment model with graded submission) ────
    const gradedSubmissions = await prisma.assignmentSubmission.findMany({
      where: { studentId: userId, status: "GRADED" },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            type: true,
            maxPoints: true,
            course: { select: { title: true } },
            module: { select: { title: true } },
          },
        },
      },
      orderBy: { gradedAt: "desc" },
      take: 20,
    });

    for (const sub of gradedSubmissions) {
      const total = sub.assignment.maxPoints;
      results.push({
        id: sub.id,
        type: "ASSIGNMENT",
        title: sub.assignment.title,
        courseName: sub.assignment.course.title,
        moduleName: sub.assignment.module?.title ?? "—",
        score: sub.totalScore ?? null,
        total: total ?? null,
        percentage:
          sub.totalScore != null && total != null
            ? Math.round((sub.totalScore / total) * 100)
            : null,
        grade: sub.grade ?? null,
        feedback: sub.feedback ?? null,
        submittedAt: sub.gradedAt?.toISOString() ?? sub.submittedAt.toISOString(),
      });
    }

    // ── Submitted quizzes (Quiz model attempts) ─────────────────────────
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { userId, status: { not: "PENDING" } },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                title: true,
                course: { select: { title: true } },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: 20,
    });

    for (const attempt of quizAttempts) {
      results.push({
        id: attempt.id,
        type: "QUIZ",
        title: attempt.quiz.title,
        courseName: attempt.quiz.module?.course.title ?? "—",
        moduleName: attempt.quiz.module?.title ?? "—",
        score: attempt.score ?? null,
        total: attempt.total ?? null,
        percentage: attempt.percentage != null ? Math.round(attempt.percentage) : null,
        grade: attempt.isPassed ? "PASS" : "FAIL",
        feedback: null,
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
      });
    }

    // ── Projects (future — reserved for upcoming feature) ───────────────
    // No Project model exists yet; UI shows an empty "coming soon" state.

    results.sort((a, b) =>
      (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""),
    );

    return results;
  },
};
