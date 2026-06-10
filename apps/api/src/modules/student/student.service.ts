import { prisma } from "../../utils/prisma";

export interface OverdueAssignmentItem {
    id: string;
    courseName: string;
    unitName: string;
    assignmentName: string;
    dueDate: string;
    status: "PENDING" | "SUBMITTED";
    type: "QUIZ" | "ASSIGNMENT";
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
    async getOverdueAssignments(userId: string): Promise<OverdueAssignmentItem[]> {
        // Fetch approved student enrollments
        const enrollments = await prisma.enrollmentRequest.findMany({
            where: {
                userId,
                status: "APPROVED",
                batchId: { not: null },
            },
            select: {
                batchId: true,
            },
        });

        const batchIds = enrollments.map((e) => e.batchId as string);
        if (batchIds.length === 0) return [];

        // Fetch all assignments for these batches
        const assignments = await prisma.assignment.findMany({
            where: {
                batchId: { in: batchIds },
            },
            include: {
                course: { select: { title: true } },
                batch: { select: { name: true } },
                submissions: {
                    where: { studentId: userId },
                    select: { id: true, status: true },
                },
            },
            orderBy: { dueDate: 'desc' },
        });

        return assignments.map((assignment) => {
            const submission = assignment.submissions[0];
            const status = submission ? "SUBMITTED" as const : "PENDING" as const;
            return {
                id: assignment.id,
                courseName: assignment.course.title,
                unitName: assignment.type === 'QUIZ' ? "Quiz" : "Assignment",
                assignmentName: assignment.title,
                dueDate: assignment.dueDate.toISOString(),
                status,
                type: assignment.type as "QUIZ" | "ASSIGNMENT",
            };
        });
    },

    async getContinueLearning(userId: string): Promise<{ continueLearning: ContinueLearningItem[] }> {
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
                            orderBy: { scheduledAt: 'desc' },
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

                const watchedSeconds = session.recording.progress[0]?.watchedSeconds ?? 0;
                const totalSeconds = session.recording.duration ?? 1;
                const watchedPercent = Math.min(100, Math.round((watchedSeconds / totalSeconds) * 100));

                // Only include if partially watched (not completed and not unwatched)
                if (watchedPercent > 0 && watchedPercent < 100) {
                    items.push({
                        recordingId: session.recording.id,
                        batchId: enrollment.batchId,
                        courseTitle: `${enrollment.batch.course.title} — Batch ${enrollment.batch.id.slice(0, 8)}`,
                        dayLabel: `Day ${items.filter(i => i.batchId === enrollment.batchId).length + 1}`,
                        watchedPercent,
                        thumbnail: enrollment.batch.course.thumbnailUrl || "📚",
                    });
                }
            }
        }

        return { continueLearning: items.slice(0, 10) };
    },
};
