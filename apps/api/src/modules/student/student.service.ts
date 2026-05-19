import { prisma } from "../../utils/prisma";

export interface OverdueAssignmentItem {
    id: string;
    courseName: string;
    unitName: string;
    assignmentName: string;
    dueDate: string;
    status: "PENDING" | "SUBMITTED";
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
};
