import type { Response } from "express";
import { prisma } from "../../utils/prisma";
import type { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";

export const quizTemplateController = {
  async list(req: AuthRequest, res: Response) {
    try {
      const templates = await prisma.quizTemplate.findMany({
        include: {
          questions: {
            include: { options: true },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json({ templates });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const template = await prisma.quizTemplate.findUnique({
        where: { id },
        include: {
          questions: {
            include: { options: true },
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Quiz template not found" });
      }

      return res.json({ template });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const { title, description, category, questions } = req.body;

      if (!title || !Array.isArray(questions)) {
        return res
          .status(400)
          .json({ error: "Title and questions are required" });
      }

      const template = await prisma.quizTemplate.create({
        data: {
          title,
          description,
          category,
          questions: {
            create: questions.map(
              (
                q: {
                  text: string;
                  marks?: number;
                  orderIndex?: number;
                  options: { optionText: string; isCorrect?: boolean }[];
                },
                idx: number,
              ) => ({
                text: q.text,
                marks: q.marks ?? 1,
                orderIndex: q.orderIndex ?? idx,
                options: {
                  create: q.options.map((o) => ({
                    optionText: o.optionText,
                    isCorrect: o.isCorrect ?? false,
                  })),
                },
              }),
            ),
          },
        },
        include: {
          questions: {
            include: { options: true },
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      return res.status(201).json({ template });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, category, questions } = req.body;

      const existing = await prisma.quizTemplate.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Quiz template not found" });
      }

      const template = await prisma.$transaction(async (tx) => {
        await tx.quizTemplateOption.deleteMany({
          where: { question: { quizTemplateId: id } },
        });
        await tx.quizTemplateQuestion.deleteMany({
          where: { quizTemplateId: id },
        });

        return tx.quizTemplate.update({
          where: { id },
          data: {
            title,
            description,
            category,
            questions: {
              create: (questions ?? []).map(
                (
                  q: {
                    text: string;
                    marks?: number;
                    orderIndex?: number;
                    options: { optionText: string; isCorrect?: boolean }[];
                  },
                  idx: number,
                ) => ({
                  text: q.text,
                  marks: q.marks ?? 1,
                  orderIndex: q.orderIndex ?? idx,
                  options: {
                    create: q.options.map((o) => ({
                      optionText: o.optionText,
                      isCorrect: o.isCorrect ?? false,
                    })),
                  },
                }),
              ),
            },
          },
          include: {
            questions: {
              include: { options: true },
              orderBy: { orderIndex: "asc" },
            },
          },
        });
      });

      return res.json({ template });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.quizTemplate.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Quiz template not found" });
      }

      await prisma.quizTemplate.delete({ where: { id } });
      return res.json({ message: "Quiz template deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
