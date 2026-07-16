import { z } from "zod";
import { prisma } from "../../utils/prisma";

export const CreateAssignmentSchema = z.object({
  title: z.string().min(2).max(200),
  type: z.enum(["QUIZ", "ASSIGNMENT"]).default("ASSIGNMENT"),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  maxPoints: z.number().int().min(1).default(100),
});

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  type: z.enum(["QUIZ", "ASSIGNMENT"]).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  maxPoints: z.number().int().min(1).optional(),
});

export const assignmentService = {
  async addAssignment(
    moduleId: string,
    courseId: string,
    batchId: string,
    data: z.infer<typeof CreateAssignmentSchema>,
  ) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    return prisma.assignment.create({
      data: {
        courseId,
        batchId,
        moduleId,
        title: data.title,
        type: data.type,
        description: data.description || "",
        dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
        maxPoints: data.maxPoints,
      },
    });
  },

  async updateAssignment(
    assignmentId: string,
    data: z.infer<typeof UpdateAssignmentSchema>,
  ) {
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing) throw new Error("Assignment not found");

    return prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.type && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.maxPoints && { maxPoints: data.maxPoints }),
      },
    });
  },

  async deleteAssignment(assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new Error("Assignment not found");

    await prisma.assignment.delete({ where: { id: assignmentId } });
    return { deleted: true };
  },
};
