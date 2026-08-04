import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import {
  quizService,
  CreateQuizSchema,
  UpdateQuizSchema,
} from "./quiz.service";

export const quizController = {
  async getQuestions(req: AuthRequest, res: Response) {
    try {
      const quiz = await quizService.getQuizQuestions(req.params.quizId);
      return res.status(200).json(quiz);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
  async addQuiz(req: AuthRequest, res: Response) {
    try {
      const data = CreateQuizSchema.parse(req.body);
      const quiz = await quizService.addQuiz(req.params.moduleId, data);
      return res.status(201).json(quiz);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async updateQuiz(req: AuthRequest, res: Response) {
    try {
      const data = UpdateQuizSchema.parse(req.body);
      const quiz = await quizService.updateQuiz(req.params.id, data);
      return res.json(quiz);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async deleteQuiz(req: AuthRequest, res: Response) {
    try {
      await quizService.deleteQuiz(req.params.id);
      return res.json({ message: "Quiz deleted" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async reorderQuizzes(req: AuthRequest, res: Response) {
    try {
      const { quizIds } = req.body;
      if (!Array.isArray(quizIds))
        return res.status(400).json({ error: "quizIds must be an array" });
      await quizService.reorderQuizzes(req.params.moduleId, quizIds);
      return res.json({ message: "Quizzes reordered" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
