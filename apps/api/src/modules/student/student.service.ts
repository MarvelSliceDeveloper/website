import { prisma } from "../../utils/prisma";

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
}

export interface ContinueLearningItem {
  recordingId: string;
  batchId: string;
  courseTitle: string;
  dayLabel: string;
  watchedPercent: number;
  thumbnail: string;
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
          select: { courseId: true, batchId: true, course: { select: { title: true } } },
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
    const now = new Date();

    const result: OverdueAssignmentItem[] = [];

    // ── Batch Assignment model overdue items ──────────────────────────
    if (uniqueBatchIds.length > 0) {
      const assignments = await prisma.assignment.findMany({
        where: {
          batchId: { in: uniqueBatchIds },
          dueDate: { lt: now },
        },
        include: {
          course: { select: { title: true } },
          batch: { select: { name: true } },
          module: { select: { title: true } },
          submissions: {
            where: { studentId: userId },
            select: { id: true, status: true },
          },
        },
        orderBy: { dueDate: "desc" },
      });

      for (const assignment of assignments) {
        const submission = assignment.submissions[0];
        result.push({
          id: assignment.id,
          courseId: assignment.courseId,
          courseName: assignment.course.title,
          moduleName: assignment.module?.title || "—",
          unitName: assignment.type === "QUIZ" ? "Quiz" : "Assignment",
          assignmentName: assignment.title,
          dueDate: assignment.dueDate.toISOString(),
          status: submission ? "SUBMITTED" : "PENDING",
          type: assignment.type as "QUIZ" | "ASSIGNMENT",
          submissionId: submission?.id || null,
        });
      }
    }

    // ── Course-content items (Quiz + Assignment in modules) ──────────
    const courseModules = await prisma.module.findMany({
      where: { courseId: { in: uniqueCourseIds } },
      select: { id: true, title: true, courseId: true },
    });
    const moduleIds = courseModules.map((m) => m.id);
    const moduleMap = new Map(courseModules.map((m) => [m.id, m]));

    if (moduleIds.length > 0) {
      const courseQuizRecords = await prisma.quiz.findMany({
        where: {
          moduleId: { in: moduleIds },
          OR: [
            { dueDate: { lt: now } },
            { dueDate: null },
          ],
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          moduleId: true,
          attempts: {
            where: { userId, status: "SUBMITTED" },
            select: { id: true, status: true },
            take: 1,
          },
        },
        orderBy: { dueDate: "desc" },
      });

      for (const quiz of courseQuizRecords) {
        const mod = moduleMap.get(quiz.moduleId);
        const courseId = mod?.courseId ?? "";
        result.push({
          id: quiz.id,
          courseId,
          courseName: courseNameMap.get(courseId) ?? "—",
          moduleName: mod?.title ?? "—",
          unitName: "Quiz",
          assignmentName: quiz.title,
          dueDate: quiz.dueDate?.toISOString() ?? new Date().toISOString(),
          status: quiz.attempts.length > 0 ? "SUBMITTED" : "PENDING",
          type: "QUIZ",
          submissionId: quiz.attempts[0]?.id ?? null,
        });
      }

      // Assignment model records with no batchId (course-content assignments)
      const courseAssignments = await prisma.assignment.findMany({
        where: {
          moduleId: { in: moduleIds },
          batchId: { in: ["", null] },
          dueDate: { lt: now },
        },
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
          moduleId: true,
          courseId: true,
          submissions: {
            where: { studentId: userId },
            select: { id: true, status: true },
            take: 1,
          },
        },
        orderBy: { dueDate: "desc" },
      });

      for (const assignment of courseAssignments) {
        const mod = moduleMap.get(assignment.moduleId);
        const courseId = assignment.courseId;
        const submission = assignment.submissions[0];
        result.push({
          id: assignment.id,
          courseId,
          courseName: courseNameMap.get(courseId) ?? "—",
          moduleName: mod?.title ?? "—",
          unitName: assignment.type === "QUIZ" ? "Quiz" : "Assignment",
          assignmentName: assignment.title,
          dueDate: assignment.dueDate.toISOString(),
          status: submission ? "SUBMITTED" : "PENDING",
          type: assignment.type as "QUIZ" | "ASSIGNMENT",
          submissionId: submission?.id ?? null,
        });
      }
    }

    result.sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
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

    const items: ContinueLearningItem[] = [];
    const seenBatchIds = new Set<string>();

    for (const pe of packageEnrollments) {
      for (const pec of pe.courses) {
        if (!pec.batchId || seenBatchIds.has(pec.batchId)) continue;
        seenBatchIds.add(pec.batchId);

        const batch = await prisma.batch.findUnique({
          where: { id: pec.batchId },
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
};
