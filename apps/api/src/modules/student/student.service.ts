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
    // Fetch approved student enrollments
    const enrollments = await prisma.enrollmentRequest.findMany({
      where: {
        userId,
        status: "APPROVED",
        batchId: { not: null },
      },
      select: {
        batchId: true,
        batch: {
          select: { courseId: true, course: { select: { title: true } } },
        },
      },
    });

    const batchIds = enrollments.map((e) => e.batchId as string);
    if (batchIds.length === 0) return [];

    const now = new Date();

    // ── Batch Assignment model overdue items ──────────────────────────
    const assignments = await prisma.assignment.findMany({
      where: {
        batchId: { in: batchIds },
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

    const result: OverdueAssignmentItem[] = assignments.map((assignment) => {
      const submission = assignment.submissions[0];
      const status = submission ? ("SUBMITTED" as const) : ("PENDING" as const);
      return {
        id: assignment.id,
        courseId: assignment.courseId,
        courseName: assignment.course.title,
        moduleName: assignment.module?.title || "—",
        unitName: assignment.type === "QUIZ" ? "Quiz" : "Assignment",
        assignmentName: assignment.title,
        dueDate: assignment.dueDate.toISOString(),
        status,
        type: assignment.type as "QUIZ" | "ASSIGNMENT",
        submissionId: submission?.id || null,
      };
    });

    // Include course-content items (Quiz model + Assignment model records with no batchId)
    // that live in the student's enrolled courses but outside the batch-assignment system.
    const courseIds = [
      ...new Set(
        enrollments
          .map((e) => e.batch?.courseId)
          .filter((id): id is string => !!id),
      ),
    ];

    if (courseIds.length > 0) {
      const courseModules = await prisma.module.findMany({
        where: { courseId: { in: courseIds } },
        select: { id: true, title: true, courseId: true },
      });
      const moduleIds = courseModules.map((m) => m.id);
      const moduleMap = new Map(courseModules.map((m) => [m.id, m]));

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
            where: { userId },
            select: { id: true },
            take: 1,
          },
        },
        orderBy: { dueDate: "desc" },
      });

      for (const quiz of courseQuizRecords) {
        const mod = moduleMap.get(quiz.moduleId);
        const enrollment = enrollments.find(
          (e) => e.batch?.courseId === mod?.courseId,
        );
        const courseName = enrollment?.batch?.course?.title ?? "—";
        result.push({
          id: quiz.id,
          courseId: mod?.courseId ?? "",
          courseName,
          moduleName: mod?.title ?? "—",
          unitName: "Quiz",
          assignmentName: quiz.title,
          dueDate: quiz.dueDate?.toISOString() ?? new Date().toISOString(),
          status: quiz.attempts.length > 0 ? "SUBMITTED" : "PENDING",
          type: "QUIZ",
          submissionId: quiz.attempts[0]?.id ?? null,
        });
      }

      // Assignment model records created via admin course builder (batchId is empty/null)
      // These are course-content assignments that don't belong to a specific batch.
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
        const enrollment = enrollments.find(
          (e) => e.batch?.courseId === mod?.courseId,
        );
        const courseName = enrollment?.batch?.course?.title ?? "—";
        const submission = assignment.submissions[0];
        result.push({
          id: assignment.id,
          courseId: assignment.courseId,
          courseName,
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
    const enrollments = await prisma.enrollmentRequest.findMany({
      where: {
        userId,
        status: "APPROVED",
        batchId: { not: null },
      },
      select: {
        batchId: true,
        batch: {
          select: {
            id: true,
            course: {
              select: {
                title: true,
                thumbnailUrl: true,
              },
            },
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
                      select: {
                        watchedSeconds: true,
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

    const items: ContinueLearningItem[] = [];

    for (const enrollment of enrollments) {
      if (!enrollment.batch || !enrollment.batchId) continue;

      for (const session of enrollment.batch.sessions) {
        if (!session.recording) continue;

        const watchedSeconds =
          session.recording.progress[0]?.watchedSeconds ?? 0;
        const totalSeconds = session.recording.duration ?? 1;
        const watchedPercent = Math.min(
          100,
          Math.round((watchedSeconds / totalSeconds) * 100),
        );

        // Only include if partially watched (not completed and not unwatched)
        if (watchedPercent > 0 && watchedPercent < 100) {
          items.push({
            recordingId: session.recording.id,
            batchId: enrollment.batchId,
            courseTitle: `${enrollment.batch.course?.title || "Package Course"} — Batch ${enrollment.batch.id.slice(0, 8)}`,
            dayLabel: `Day ${items.filter((i) => i.batchId === enrollment.batchId).length + 1}`,
            watchedPercent,
            thumbnail: enrollment.batch.course?.thumbnailUrl || "📚",
          });
        }
      }
    }

    return { continueLearning: items.slice(0, 10) };
  },
};
