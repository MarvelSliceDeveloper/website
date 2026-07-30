import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import { instructorService } from "./instructor.service";

export const instructorController = {
  // GET /api/instructor/analytics
  // Returns course completion rates, student retention, video drop-off, and quiz scores
  // scoped to this instructor's batches/courses only.
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

  // GET /api/instructor/batches
  // Returns all batches where this instructor is the assigned teacher or a course mentor.
  // Includes course title, enrollment count, and session count.
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

  // GET /api/instructor/courses
  // Returns unique courses from the instructor's assigned batches.
  // Each course includes module and batch counts.
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

  // GET /api/instructor/courses/:courseId/recordings
  // Returns recordings from the instructor's batches for this course.
  async getMyCourseRecordings(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const recordings = await instructorService.getMyCourseRecordings(
        req.user.userId,
        req.params.courseId,
      );
      return res.json(recordings);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
