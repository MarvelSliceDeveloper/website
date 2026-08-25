import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";

export const AssignMentorSchema = z.object({
  courseId: z.string(),
  mentorId: z.string(),
});

export const batchMentorService = {
  async assign(batchId: string, data: z.infer<typeof AssignMentorSchema>) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new AppError(404, "Batch not found");

    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) throw new AppError(404, "Course not found");

    const mentor = await prisma.user.findUnique({
      where: { id: data.mentorId },
    });
    if (
      !mentor ||
      (mentor.role !== "INSTRUCTOR" &&
        mentor.role !== "ADMIN" &&
        mentor.role !== "SUPER_ADMIN")
    ) {
      throw new AppError(400, "User is not an instructor or admin");
    }

    return prisma.batchCourseMentor.upsert({
      where: {
        batchId_courseId: { batchId, courseId: data.courseId },
      },
      create: {
        batchId,
        courseId: data.courseId,
        mentorId: data.mentorId,
      },
      update: {
        mentorId: data.mentorId,
      },
      include: {
        course: { select: { id: true, title: true } },
        mentor: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async list(batchId: string) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new AppError(404, "Batch not found");

    return prisma.batchCourseMentor.findMany({
      where: { batchId },
      include: {
        course: { select: { id: true, title: true } },
        mentor: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async remove(batchId: string, courseId: string) {
    const mentor = await prisma.batchCourseMentor.findUnique({
      where: { batchId_courseId: { batchId, courseId } },
    });
    if (!mentor) throw new AppError(404, "Mentor assignment not found");

    await prisma.batchCourseMentor.delete({
      where: { batchId_courseId: { batchId, courseId } },
    });
    return { deleted: true };
  },
};
