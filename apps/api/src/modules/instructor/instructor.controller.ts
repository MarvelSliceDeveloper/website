import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import { instructorService } from "./instructor.service";

export const instructorController = {
  // GET /api/instructor/analytics — instructor-scoped analytics
  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const analytics = await instructorService.getAnalytics(req.user.userId);
      return res.json(analytics);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/instructor/batches — instructor's assigned batches
  async getMyBatches(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const batches = await instructorService.getMyBatches(req.user.userId);
      return res.json(batches);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/instructor/courses — instructor's courses (via batches)
  async getMyCourses(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const courses = await instructorService.getMyCourses(req.user.userId);
      return res.json(courses);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
