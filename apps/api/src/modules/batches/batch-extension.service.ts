import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";

export const CreateExtensionSchema = z.object({
  assignmentId: z.string().optional(),
  quizId: z.string().optional(),
  extendedDueDate: z.string().datetime(),
  reason: z.string().optional(),
}).refine(data => data.assignmentId || data.quizId, {
  message: "Either assignmentId or quizId is required",
});

export const batchExtensionService = {
  async create(batchId: string, data: z.infer<typeof CreateExtensionSchema>, grantedById: string) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new AppError(404, "Batch not found");

    let originalDueDate: Date | null = null;

    if (data.assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: data.assignmentId },
      });
      if (!assignment) throw new AppError(404, "Assignment not found");
      if (assignment.batchId !== batchId) throw new AppError(400, "Assignment does not belong to this batch");
      originalDueDate = assignment.dueDate;

      const existing = await prisma.batchAssignmentExtension.findUnique({
        where: { batchId_assignmentId: { batchId, assignmentId: data.assignmentId } },
      });
      if (existing) {
        return prisma.batchAssignmentExtension.update({
          where: { id: existing.id },
          data: {
            extendedDueDate: new Date(data.extendedDueDate),
            reason: data.reason ?? existing.reason,
            grantedById,
          },
        });
      }
    }

    if (data.quizId) {
      const quiz = await prisma.quiz.findUnique({
        where: { id: data.quizId },
      });
      if (!quiz) throw new AppError(404, "Quiz not found");
      if (!quiz.dueDate) throw new AppError(400, "Quiz has no due date to extend");
      originalDueDate = quiz.dueDate;

      const existing = await prisma.batchAssignmentExtension.findUnique({
        where: { batchId_quizId: { batchId, quizId: data.quizId } },
      });
      if (existing) {
        return prisma.batchAssignmentExtension.update({
          where: { id: existing.id },
          data: {
            extendedDueDate: new Date(data.extendedDueDate),
            reason: data.reason ?? existing.reason,
            grantedById,
          },
        });
      }
    }

    if (!originalDueDate) throw new AppError(400, "Could not determine original due date");

    return prisma.batchAssignmentExtension.create({
      data: {
        batchId,
        assignmentId: data.assignmentId ?? null,
        quizId: data.quizId ?? null,
        originalDueDate,
        extendedDueDate: new Date(data.extendedDueDate),
        grantedById,
        reason: data.reason ?? null,
      },
      include: {
        assignment: { select: { id: true, title: true } },
        quiz: { select: { id: true, title: true } },
        grantedBy: { select: { id: true, name: true } },
      },
    });
  },

  async list(batchId: string) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new AppError(404, "Batch not found");

    return prisma.batchAssignmentExtension.findMany({
      where: { batchId },
      include: {
        assignment: { select: { id: true, title: true } },
        quiz: { select: { id: true, title: true } },
        grantedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async remove(batchId: string, extensionId: string) {
    const ext = await prisma.batchAssignmentExtension.findFirst({
      where: { id: extensionId, batchId },
    });
    if (!ext) throw new AppError(404, "Extension not found");

    await prisma.batchAssignmentExtension.delete({ where: { id: extensionId } });
    return { deleted: true };
  },
};
