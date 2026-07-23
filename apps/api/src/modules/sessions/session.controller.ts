import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import {
  sessionService,
  CreateSessionSchema,
  UpdateSessionSchema,
} from "./session.service";

export const sessionController = {
  // POST /api/sessions — creates a new live session
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const data = CreateSessionSchema.parse(req.body);
      const session = await sessionService.createSession(req.user.userId, data);

      return res.status(201).json({ session });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/sessions — lists sessions with filters
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { batchId, courseId, status, page, limit } = req.query;

      // Only filter by instructorId for INSTRUCTOR role — admins should see all sessions
      const sessions = await sessionService.listSessions({
        batchId: batchId as string | undefined,
        courseId: courseId as string | undefined,
        status: status as
          | "scheduled"
          | "live"
          | "completed"
          | "cancelled"
          | undefined,
        instructorId:
          req.user.role === "INSTRUCTOR" ? req.user.userId : undefined,
        studentId: req.user.role === "STUDENT" ? req.user.userId : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      return res.status(200).json({ sessions });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/sessions/:id — gets a session by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const session = await sessionService.getSession(req.params.id);
      return res.status(200).json({ session });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // PATCH /api/sessions/:id — updates a session
  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const data = UpdateSessionSchema.parse(req.body);
      const session = await sessionService.updateSession(
        req.params.id,
        req.user.userId,
        data,
      );

      return res.status(200).json({ session });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // DELETE /api/sessions/:id — cancels or deletes a session
  async cancel(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const session = await sessionService.cancelSession(
        req.params.id,
        req.user.userId,
      );
      const isDeleted =
        req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN";
      return res.status(200).json({
        message: isDeleted ? "Session deleted" : "Session cancelled",
        session,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
