import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { appendToContentOrder, removeFromContentOrder } from "./module.service";

export const CreateQuizSchema = z.object({
  title: z.string().min(2).max(200),
  dueDate: z.string().datetime().optional().nullable(),
  isSpecialExam: z.boolean().default(false),
  passingScore: z.number().min(0).max(100).default(65),
  timeLimitMin: z.number().min(1).optional().nullable(),
  maxAttempts: z.number().min(1).optional().nullable(),
  examType: z.enum(["MCQ", "ASSIGNMENT", "CODING_TESTCASE", "ALL_IN_ONE"]).default("MCQ"),
  hasMcq: z.boolean().default(true),
  hasAssignment: z.boolean().default(false),
  hasCoding: z.boolean().default(false),
  assignmentInstructions: z.string().optional().nullable(),
  assignmentPdfUrl: z.string().optional().nullable(),
  codingPrompt: z.string().optional().nullable(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional(),
      }),
    )
    .optional()
    .nullable(),
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
    .optional()
    .default([]),
});

export const UpdateQuizSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  isSpecialExam: z.boolean().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  timeLimitMin: z.number().min(1).optional().nullable(),
  maxAttempts: z.number().min(1).optional().nullable(),
  examType: z.enum(["MCQ", "ASSIGNMENT", "CODING_TESTCASE", "ALL_IN_ONE"]).optional(),
  hasMcq: z.boolean().optional(),
  hasAssignment: z.boolean().optional(),
  hasCoding: z.boolean().optional(),
  assignmentInstructions: z.string().optional().nullable(),
  assignmentPdfUrl: z.string().optional().nullable(),
  codingPrompt: z.string().optional().nullable(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional(),
      }),
    )
    .optional()
    .nullable(),
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
    .optional(),
});

export const quizService = {
  async getQuizQuestions(quizId: string) {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) throw new AppError(404, "Quiz not found");

    const questions = quiz.questions.map((q, qIdx) => {
      const rawOptions = q.options as Array<{
        label: string;
        isCorrect: boolean;
      }>;
      const options = rawOptions.map((opt, oIdx) => ({
        id: `${oIdx}`,
        optionText: opt.label,
        isCorrect: opt.isCorrect,
      }));

      return {
        id: q.id,
        questionText: q.text,
        marks: 1,
        orderIndex: qIdx,
        options,
      };
    });

    return {
      id: quiz.id,
      title: quiz.title,
      description: "",
      dueDate: quiz.dueDate ? quiz.dueDate.toISOString() : "",
      isSpecialExam: quiz.isSpecialExam,
      passingScore: quiz.passingScore,
      timeLimitMin: quiz.timeLimitMin,
      maxAttempts: quiz.maxAttempts,
      examType: quiz.examType,
      hasMcq: quiz.hasMcq,
      hasAssignment: quiz.hasAssignment,
      hasCoding: quiz.hasCoding,
      assignmentInstructions: quiz.assignmentInstructions,
      assignmentPdfUrl: quiz.assignmentPdfUrl,
      codingPrompt: quiz.codingPrompt,
      testCases: quiz.testCases,
      maxPoints: questions.reduce((sum, q) => sum + q.marks, 0),
      questionCount: questions.length,
      questions,
    };
  },
  async addQuiz(moduleId: string, data: z.infer<typeof CreateQuizSchema>) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new AppError(404, "Module not found");

    const quiz = await prisma.quiz.create({
      data: {
        moduleId,
        title: data.title,
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        isSpecialExam: data.isSpecialExam ?? false,
        passingScore: data.passingScore ?? 65,
        timeLimitMin: data.timeLimitMin ?? null,
        maxAttempts: data.maxAttempts ?? null,
        examType: data.examType ?? "MCQ",
        hasMcq: data.hasMcq ?? true,
        hasAssignment: data.hasAssignment ?? false,
        hasCoding: data.hasCoding ?? false,
        assignmentInstructions: data.assignmentInstructions ?? null,
        assignmentPdfUrl: data.assignmentPdfUrl ?? null,
        codingPrompt: data.codingPrompt ?? null,
        testCases: data.testCases ? JSON.parse(JSON.stringify(data.testCases)) : undefined,
        questions: {
          create: (data.questions || []).map((q) => ({
            text: q.text,
            options: q.options,
          })),
        },
      },
      include: { questions: true },
    });

    await appendToContentOrder(moduleId, "QUIZ", quiz.id);

    return quiz;
  },

  async updateQuiz(quizId: string, data: z.infer<typeof UpdateQuizSchema>) {
    const existing = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!existing) throw new AppError(404, "Quiz not found");

    if (data.questions !== undefined) {
      await prisma.question.deleteMany({ where: { quizId } });
    }

    return prisma.quiz.update({
      where: { id: quizId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.isSpecialExam !== undefined && { isSpecialExam: data.isSpecialExam }),
        ...(data.passingScore !== undefined && { passingScore: data.passingScore }),
        ...(data.timeLimitMin !== undefined && { timeLimitMin: data.timeLimitMin }),
        ...(data.maxAttempts !== undefined && { maxAttempts: data.maxAttempts }),
        ...(data.examType && { examType: data.examType }),
        ...(data.hasMcq !== undefined && { hasMcq: data.hasMcq }),
        ...(data.hasAssignment !== undefined && { hasAssignment: data.hasAssignment }),
        ...(data.hasCoding !== undefined && { hasCoding: data.hasCoding }),
        ...(data.assignmentInstructions !== undefined && {
          assignmentInstructions: data.assignmentInstructions,
        }),
        ...(data.assignmentPdfUrl !== undefined && {
          assignmentPdfUrl: data.assignmentPdfUrl,
        }),
        ...(data.codingPrompt !== undefined && { codingPrompt: data.codingPrompt }),
        ...(data.testCases !== undefined && {
          testCases: data.testCases ? JSON.parse(JSON.stringify(data.testCases)) : null,
        }),
        ...(data.testCases !== undefined && {
          testCases: data.testCases ? JSON.parse(JSON.stringify(data.testCases)) : null,
        }),
        ...(data.questions !== undefined && {
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
    if (!quiz) throw new AppError(404, "Quiz not found");

    await prisma.question.deleteMany({ where: { quizId } });
    await prisma.quiz.delete({ where: { id: quizId } });
    await removeFromContentOrder(quiz.moduleId, quizId);
    return { deleted: true };
  },

  async reorderQuizzes(moduleId: string, quizIds: string[]) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new AppError(404, "Module not found");

    const quizzes = await prisma.quiz.findMany({
      where: { moduleId },
      select: { id: true },
    });
    const existingIds = new Set(quizzes.map((q) => q.id));
    if (!quizIds.every((id) => existingIds.has(id)))
      throw new AppError(400, "Some quiz IDs do not belong to this module");

    await Promise.all(
      quizIds.map((id, index) =>
        prisma.quiz.update({ where: { id }, data: { order: index } }),
      ),
    );
    return { reordered: true };
  },
};
