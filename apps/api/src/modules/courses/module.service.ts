import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";

type ContentItemType = "LESSON" | "QUIZ" | "ASSIGNMENT" | "PRACTICAL";

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

  const current =
    (mod.contentOrder as Array<{ type: ContentItemType; id: string }>) ?? [];
  const updated = [...current, { type, id }];
  await prisma.module.update({
    where: { id: moduleId },
    data: { contentOrder: updated },
  });
}

export async function removeFromContentOrder(moduleId: string, id: string) {
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { contentOrder: true },
  });
  if (!mod || !mod.contentOrder) return;

  const current = mod.contentOrder as Array<{
    type: ContentItemType;
    id: string;
  }>;
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
      type: z.enum(["LESSON", "QUIZ", "ASSIGNMENT", "PRACTICAL"]),
      id: z.string().cuid(),
    }),
  ),
});

// Ensures the certification module is always the LAST module in a course.
// Re-orders all modules so regular modules come first and any certification
// modules land at the end (preserving relative order among non-cert modules).
export async function ensureCertificationModuleLast(courseId: string) {
  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });

  const regular = modules.filter((m) => !m.isCertificationModule);
  const cert = modules.filter((m) => m.isCertificationModule);

  const ordered = [...regular, ...cert];

  await Promise.all(
    ordered.map((m, index) =>
      prisma.module.update({
        where: { id: m.id },
        data: { order: index },
      }),
    ),
  );

  return ordered;
}

export const moduleService = {
  // Adds a module (container) to a course with auto-assigned order
  async addModule(courseId: string, data: z.infer<typeof CreateModuleSchema>) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error("Course not found");

    const lastModule = await prisma.module.findFirst({
      where: { courseId, isCertificationModule: false },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastModule?.order ?? -1) + 1;

    const module = await prisma.module.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        order: nextOrder,
        isFreePreview: data.isFreePreview ?? false,
      },
    });

    await ensureCertificationModuleLast(courseId);
    return module;
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

    // Ensure certification module stays last
    await ensureCertificationModuleLast(module.courseId);

    return { deleted: true };
  },

  // Reorders modules by an ordered array of IDs
  async reorderModules(courseId: string, moduleIds: string[]) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error("Course not found");

    // Verify all moduleIds belong to this course
    const modules = await prisma.module.findMany({
      where: { courseId },
      select: { id: true, isCertificationModule: true },
    });

    const existingIds = new Set(modules.map((m) => m.id));
    const allBelong = moduleIds.every((id) => existingIds.has(id));
    if (!allBelong)
      throw new Error("Some module IDs do not belong to this course");

    const certIds = new Set(
      modules.filter((m) => m.isCertificationModule).map((m) => m.id),
    );

    // Certification module(s) must always be last — strip them from the
    // provided order and append them at the end.
    const reorderedIds = [
      ...moduleIds.filter((id) => !certIds.has(id)),
      ...moduleIds.filter((id) => certIds.has(id)),
    ];

    // Update order for each module
    await Promise.all(
      reorderedIds.map((id, index) =>
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
    const [lessons, quizzes, assignments, practicals] = await Promise.all([
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
      prisma.practical.findMany({
        where: { moduleId },
        select: { id: true },
      }),
    ]);

    const validIds = new Set([
      ...lessons.map((l) => l.id),
      ...quizzes.map((q) => q.id),
      ...assignments.map((a) => a.id),
      ...practicals.map((p) => p.id),
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

  async getCertificationModule(courseId: string) {
    return prisma.module.findFirst({
      where: { courseId, isCertificationModule: true },
      include: {
        quizzes: {
          include: { questions: true },
          orderBy: { order: "asc" },
        },
        assignments: { orderBy: { dueDate: "asc" } },
      },
    });
  },

  async createCertificationModule(courseId: string) {
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastModule?.order ?? -1) + 1;

    const certModule = await prisma.module.create({
      data: {
        courseId,
        title: "Certification Exam",
        description: "Final certification examination for this course",
        order: nextOrder,
        isCertificationModule: true,
        isFreePreview: false,
      },
    });

    await prisma.quiz.create({
      data: {
        moduleId: certModule.id,
        title: "Certification Exam",
        isSpecialExam: true,
        passingScore: 60,
        timeLimitMin: 30,
        hasMcq: true,
        hasAssignment: false,
        hasCoding: false,
        examType: "MCQ",
      },
    });

    await ensureCertificationModuleLast(courseId);

    return certModule;
  },

  async ensureCertificationModule(courseId: string) {
    const existing = await this.getCertificationModule(courseId);
    if (existing) return existing;
    return this.createCertificationModule(courseId);
  },

  async updateCertificationModule(
    courseId: string,
    data: {
      title?: string;
      passingScore?: number;
      timeLimitMin?: number | null;
      hasAssignment?: boolean;
      assignmentInstructions?: string | null;
      assignmentPdfUrl?: string | null;
      questions?: Array<{
        text: string;
        options: Array<{ label: string; isCorrect: boolean }>;
      }>;
    },
  ) {
    const certModule = await this.getCertificationModule(courseId);
    if (!certModule) {
      throw new AppError(404, "Certification module not found for this course");
    }

    const quiz = certModule.quizzes[0];
    if (!quiz) {
      throw new AppError(404, "Certification quiz not found");
    }

    if (data.title !== undefined) {
      await prisma.module.update({
        where: { id: certModule.id },
        data: { title: data.title },
      });
    }

    if (data.questions !== undefined) {
      await prisma.question.deleteMany({ where: { quizId: quiz.id } });
      await prisma.question.createMany({
        data: data.questions.map((q) => ({
          quizId: quiz.id,
          text: q.text,
          options: q.options,
        })),
      });
    }

    await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        ...(data.passingScore !== undefined && {
          passingScore: data.passingScore,
        }),
        ...(data.timeLimitMin !== undefined && {
          timeLimitMin: data.timeLimitMin,
        }),
        ...(data.hasAssignment !== undefined && {
          hasAssignment: data.hasAssignment,
          examType: data.hasAssignment ? "ALL_IN_ONE" : "MCQ",
        }),
        ...(data.assignmentInstructions !== undefined && {
          assignmentInstructions: data.assignmentInstructions,
        }),
        ...(data.assignmentPdfUrl !== undefined && {
          assignmentPdfUrl: data.assignmentPdfUrl,
        }),
      },
    });

    await ensureCertificationModuleLast(courseId);

    return this.getCertificationModule(courseId);
  },
};
