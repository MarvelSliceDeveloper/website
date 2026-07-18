import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../utils/prisma";

type ContentItemType = "LESSON" | "QUIZ" | "ASSIGNMENT";

export async function appendToContentOrder(
  moduleId: string,
  type: ContentItemType,
  id: string,
) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { contentOrder: true },
  });
  if (!mod) return;

  const current = (mod.contentOrder as Array<{ type: ContentItemType; id: string }>) ?? [];
  const updated = [...current, { type, id }];
  await prisma.module.update({
    where: { id: moduleId },
    data: { contentOrder: updated },
  });
}

export async function removeFromContentOrder(
  moduleId: string,
  id: string,
) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { contentOrder: true },
  });
  if (!mod || !mod.contentOrder) return;

  const current = mod.contentOrder as Array<{ type: ContentItemType; id: string }>;
  const updated = current.filter((item) => item.id !== id);
  await prisma.module.update({
    where: { id: moduleId },
    data: { contentOrder: updated.length > 0 ? updated : Prisma.DbNull },
  });
}

// --- Zod Schemas ---

export const CreateModuleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  isFreePreview: z.boolean().optional(),
});

export const UpdateModuleSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  isFreePreview: z.boolean().optional(),
});

export const ReorderModulesSchema = z.object({
  moduleIds: z.array(z.string().cuid()),
});

export const ReorderContentSchema = z.object({
  contentOrder: z.array(
    z.object({
      type: z.enum(["LESSON", "QUIZ", "ASSIGNMENT"]),
      id: z.string().cuid(),
    }),
  ),
});

export const moduleService = {
  // Adds a module (container) to a course with auto-assigned order
  async addModule(courseId: string, data: z.infer<typeof CreateModuleSchema>) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error("Course not found");

    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastModule?.order ?? -1) + 1;

    return prisma.module.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        order: nextOrder,
        isFreePreview: data.isFreePreview ?? false,
      },
    });
  },

  // Updates a module's title/description
  async updateModule(
    moduleId: string,
    data: z.infer<typeof UpdateModuleSchema>,
  ) {
    const existing = await prisma.module.findUnique({
      where: { id: moduleId },
    });
    if (!existing) throw new Error("Module not found");

    return prisma.module.update({
      where: { id: moduleId },
      data,
    });
  },

  // Deletes a module and re-orders remaining ones
  async deleteModule(moduleId: string) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    await prisma.module.delete({ where: { id: moduleId } });

    // Re-order remaining modules
    const remaining = await prisma.module.findMany({
      where: { courseId: module.courseId },
      orderBy: { order: "asc" },
    });

    await Promise.all(
      remaining.map((m, index) =>
        prisma.module.update({
          where: { id: m.id },
          data: { order: index },
        }),
      ),
    );

    return { deleted: true };
  },

  // Reorders modules by an ordered array of IDs
  async reorderModules(courseId: string, moduleIds: string[]) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error("Course not found");

    // Verify all moduleIds belong to this course
    const modules = await prisma.module.findMany({
      where: { courseId },
      select: { id: true },
    });

    const existingIds = new Set(modules.map((m) => m.id));
    const allBelong = moduleIds.every((id) => existingIds.has(id));
    if (!allBelong)
      throw new Error("Some module IDs do not belong to this course");

    // Update order for each module
    await Promise.all(
      moduleIds.map((id, index) =>
        prisma.module.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { reordered: true };
  },

  async reorderContent(
    moduleId: string,
    contentOrder: Array<{ type: string; id: string }>,
  ) {
    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, courseId: true },
    });
    if (!mod) throw new Error("Module not found");

    // Verify all item IDs belong to this module
    const [lessons, quizzes, assignments] = await Promise.all([
      prisma.lesson.findMany({
        where: { moduleId },
        select: { id: true },
      }),
      prisma.quiz.findMany({
        where: { moduleId },
        select: { id: true },
      }),
      prisma.assignment.findMany({
        where: { moduleId },
        select: { id: true },
      }),
    ]);

    const validIds = new Set([
      ...lessons.map((l) => l.id),
      ...quizzes.map((q) => q.id),
      ...assignments.map((a) => a.id),
    ]);

    for (const item of contentOrder) {
      if (!validIds.has(item.id)) {
        throw new Error(`Item ${item.id} does not belong to this module`);
      }
    }

    await prisma.module.update({
      where: { id: moduleId },
      data: { contentOrder: contentOrder },
    });

    return { reordered: true };
  },
};
