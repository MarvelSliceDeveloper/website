import { prisma } from "../../utils/prisma";

export interface OverdueAssignmentItem {
    id: string;
    courseName: string;
    unitName: string;
    assignmentName: string;
    dueDate: string;
    status: "PENDING" | "SUBMITTED";
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
        const now = new Date();

        const enrollments = await prisma.enrollmentRequest.findMany({
            where: {
                userId,
                status: "APPROVED",
                batchId: { not: null },
            },
            select: {
                batch: {
                    select: {
                        id: true,
                        name: true,
                        course: {
                            select: {
                                title: true,
                            },
                        },
                        sessions: {
                            select: {
                                id: true,
                                scheduledAt: true,
                                module: {
                                    select: {
                                        title: true,
                                    },
                                },
                                recording: {
                                    select: {
                                        progress: {
                                            where: {
                                                userId,
                                            },
                                            select: {
                                                watchedSeconds: true,
                                                completedAt: true,
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

        const items: OverdueAssignmentItem[] = [];

        for (const enrollment of enrollments) {
            if (!enrollment.batch) continue;

            for (const session of enrollment.batch.sessions) {
                if (session.scheduledAt >= now) continue;

                const progressList = session.recording?.progress ?? [];
                const submitted =
                    progressList.length > 0 &&
                    progressList.some((entry) => entry.watchedSeconds > 0 || !!entry.completedAt);

                const unitName = session.module?.title ?? "General Module";
                items.push({
                    id: session.id,
                    courseName: enrollment.batch.course.title,
                    unitName,
                    assignmentName: `${unitName} - Submit Here`,
                    dueDate: session.scheduledAt.toISOString(),
                    status: submitted ? "SUBMITTED" : "PENDING",
                });
            }
        }

        return items.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
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
