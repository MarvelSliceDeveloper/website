import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { appendToContentOrder, removeFromContentOrder } from "./module.service";

export const CreateAssignmentSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(["QUIZ", "ASSIGNMENT"]).default("ASSIGNMENT"),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  daysFromEnrollment: z.number().int().min(0).optional(),
  maxPoints: z.number().int().min(1).default(100),
  questionPdfUrl: z.string().url().optional().or(z.literal("")),
});

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  type: z.enum(["QUIZ", "ASSIGNMENT"]).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  daysFromEnrollment: z.number().int().min(0).nullable().optional(),
  maxPoints: z.number().int().min(1).optional(),
  questionPdfUrl: z.string().url().optional().or(z.literal("")),
});

export const assignmentService = {
  async addAssignment(
    moduleId: string,
    courseId: string,
    batchId: string | null,
    data: z.infer<typeof CreateAssignmentSchema>,
  ) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        ...(batchId ? { batchId } : {}),
        moduleId,
        title: data.title,
        type: data.type,
        description: data.description || "",
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        daysFromEnrollment: data.daysFromEnrollment,
        maxPoints: data.maxPoints,
        ...(data.questionPdfUrl ? { questionPdfUrl: data.questionPdfUrl } : {}),
      },
    });

    await appendToContentOrder(moduleId, "ASSIGNMENT", assignment.id);

    return assignment;
  },

  async updateAssignment(
    assignmentId: string,
    data: z.infer<typeof UpdateAssignmentSchema>,
  ) {
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) throw new AppError(404, "Assignment not found");

    return prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.type && { type: data.type }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.daysFromEnrollment !== undefined && {
          daysFromEnrollment: data.daysFromEnrollment,
        }),
        ...(data.maxPoints && { maxPoints: data.maxPoints }),
        ...(data.questionPdfUrl !== undefined && {
          questionPdfUrl: data.questionPdfUrl || null,
        }),
      },
    });
  },

  async deleteAssignment(assignmentId: string, deletedBy?: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new AppError(404, "Assignment not found");

    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy ?? null,
      },
    });
    if (assignment.moduleId) {
      await removeFromContentOrder(assignment.moduleId, assignmentId);
    }
    return { deleted: true };
  },

  async reorderAssignments(moduleId: string, assignmentIds: string[]) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    const assignments = await prisma.assignment.findMany({
      where: { moduleId },
      select: { id: true },
    });
    const existingIds = new Set(assignments.map((a) => a.id));
    if (!assignmentIds.every((id) => existingIds.has(id)))
      throw new Error("Some assignment IDs do not belong to this module");

    await Promise.all(
      assignmentIds.map((id, index) =>
        prisma.assignment.update({ where: { id }, data: { order: index } }),
      ),
    );
    return { reordered: true };
  },
};
