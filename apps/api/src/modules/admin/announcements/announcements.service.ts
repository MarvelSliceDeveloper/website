import { prisma } from "../../../utils/prisma";
import { AppError } from "../../../utils/errors";
import { emailService } from "../../../services/email.service";
import { notificationService } from "../../notifications/notification.service";

async function resolveUserIds(targetType: string, targetIds: string[]) {
  switch (targetType) {
    case "ROLE": {
      const role = targetIds[0] || "STUDENT";
      const users = await prisma.user.findMany({
        where: { role: role as any, deletedAt: null },
        select: { id: true, name: true, email: true },
      });
      return users;
    }

    case "PACKAGE": {
      const enrollments = await prisma.packageEnrollment.findMany({
        where: {
          packageId: { in: targetIds },
          status: "APPROVED",
        },
        select: { userId: true },
      });
      const userIds = [...new Set(enrollments.map((e) => e.userId))];
      return prisma.user.findMany({
        where: { id: { in: userIds }, deletedAt: null },
        select: { id: true, name: true, email: true },
      });
    }

    case "BATCH": {
      const pec = await prisma.packageEnrollmentCourse.findMany({
        where: { batchId: { in: targetIds } },
        select: { enrollment: { select: { userId: true } } },
      });
      const userIds = [...new Set(pec.map((e) => e.enrollment.userId))];
      return prisma.user.findMany({
        where: { id: { in: userIds }, deletedAt: null },
        select: { id: true, name: true, email: true },
      });
    }

    case "INSTRUCTOR_BATCH": {
      const batches = await prisma.batch.findMany({
        where: { id: { in: targetIds } },
        select: { instructorId: true },
      });
      const userIds = [
        ...new Set(
          batches
            .map((b) => b.instructorId)
            .filter((id): id is string => id !== null),
        ),
      ];
      return prisma.user.findMany({
        where: { id: { in: userIds }, deletedAt: null },
        select: { id: true, name: true, email: true },
      });
    }

    default:
      throw new AppError(400, `Unknown target type: ${targetType}`);
  }
}

export const announcementsService = {
  async create(data: {
    title: string;
    body: string;
    targetRole: string;
    targetType: string;
    targetIds: string[];
    createdBy: string;
  }) {
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        targetRole: data.targetRole as any,
        targetType: data.targetType,
        targetIds: data.targetIds,
        createdBy: data.createdBy,
      },
    });

    const users = await resolveUserIds(data.targetType, data.targetIds);

    if (users.length === 0) {
      return { announcement, notifiedCount: 0 };
    }

    const notifications = users.map((u) => ({
      userId: u.id,
      title: data.title,
      message: data.body,
      type: "ANNOUNCEMENT",
    }));

    notificationService
      .createMany(notifications)
      .catch((err: unknown) =>
        console.error("[announcements] Failed to create notifications:", err),
      );

    for (const user of users) {
      if (!user.email) continue;
      emailService
        .sendNotificationEmail(
          { name: user.name, email: user.email },
          "CUSTOM_NOTIFICATION",
          { title: data.title, message: data.body },
        )
        .catch((err: unknown) =>
          console.error(
            `[announcements] Failed to send email to ${user.email}:`,
            err,
          ),
        );
    }

    return { announcement, notifiedCount: users.length };
  },
};
