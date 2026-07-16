import { Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  quizService,
  CreateQuizSchema,
  UpdateQuizSchema,
} from "./quiz.service";

export const quizController = {
  async addQuiz(req: AuthRequest, res: Response) {
    try {
      const data = CreateQuizSchema.parse(req.body);
      const quiz = await quizService.addQuiz(req.params.moduleId, data);
      return res.status(201).json(quiz);
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      if (error.message === "Module not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
    }
  },

  async updateQuiz(req: AuthRequest, res: Response) {
    try {
      const data = UpdateQuizSchema.parse(req.body);
      const quiz = await quizService.updateQuiz(req.params.id, data);
      return res.json(quiz);
    } catch (error: any) {
      if (error instanceof ZodError)
        return res.status(400).json({ error: error.errors });
      if (error.message === "Quiz not found")
        return res.status(404).json({ error: error.message });
      return res.status(400).json({ error: error.message });
    }
  },

  async deleteQuiz(req: AuthRequest, res: Response) {
    try {
      await quizService.deleteQuiz(req.params.id);
      return res.json({ message: "Quiz deleted" });
    } catch (error: any) {
      if (error.message === "Quiz not found")
        return res.status(404).json({ error: error.message });
      return res.status(500).json({ error: error.message });
    }
  },
};
