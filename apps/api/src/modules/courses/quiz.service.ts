import { z } from "zod";
import { prisma } from "../../utils/prisma";

export const CreateQuizSchema = z.object({
  title: z.string().min(2).max(200),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        options: z
          .array(
            z.object({
              label: z.string().min(1),
              isCorrect: z.boolean().default(false),
            }),
          )
          .min(2),
      }),
    )
    .min(1),
});

export const UpdateQuizSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1),
        options: z
          .array(
            z.object({
              label: z.string().min(1),
              isCorrect: z.boolean().default(false),
            }),
          )
          .min(2),
      }),
    )
    .min(1)
    .optional(),
});

export const quizService = {
  async addQuiz(moduleId: string, data: z.infer<typeof CreateQuizSchema>) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    return prisma.quiz.create({
      data: {
        moduleId,
        title: data.title,
        questions: {
          create: data.questions.map((q, idx) => ({
            text: q.text,
            options: q.options,
          })),
        },
      },
      include: { questions: true },
    });
  },

  async updateQuiz(quizId: string, data: z.infer<typeof UpdateQuizSchema>) {
    const existing = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!existing) throw new Error("Quiz not found");

    if (data.questions) {
      await prisma.question.deleteMany({ where: { quizId } });
    }

    return prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.questions && {
          questions: {
            create: data.questions.map((q) => ({
              text: q.text,
              options: q.options,
            })),
          },
        }),
      },
      include: { questions: true },
    });
  },

  async deleteQuiz(quizId: string) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new Error("Quiz not found");

    await prisma.question.deleteMany({ where: { quizId } });
    await prisma.quiz.delete({ where: { id: quizId } });
    return { deleted: true };
  },

  async reorderQuizzes(moduleId: string, quizIds: string[]) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    const quizzes = await prisma.quiz.findMany({
      where: { moduleId },
      select: { id: true },
    });
    const existingIds = new Set(quizzes.map((q) => q.id));
    if (!quizIds.every((id) => existingIds.has(id)))
      throw new Error("Some quiz IDs do not belong to this module");

    await Promise.all(
      quizIds.map((id, index) =>
        prisma.quiz.update({ where: { id }, data: { order: index } }),
      ),
    );
    return { reordered: true };
  },
};
