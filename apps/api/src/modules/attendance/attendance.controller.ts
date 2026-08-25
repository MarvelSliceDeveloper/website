import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { attendanceService } from "./attendance.service";
import { handleControllerError } from "../../utils/errors";

export const attendanceController = {
  // POST /api/attendance/:sessionId/join — records student joining a session
  async joinSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { sessionId } = req.params;
      const attendance = await attendanceService.recordAttendance(
        req.user.userId,
        sessionId,
      );

      return res
        .status(200)
        .json({ message: "Attendance recorded", attendance });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/attendance/:sessionId/leave — records student leaving a session
  async leaveSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { sessionId } = req.params;
      const attendance = await attendanceService.leaveSession(
        req.user.userId,
        sessionId,
      );

      return res.status(200).json({ message: "Session left", attendance });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/attendance/:sessionId — lists attendance for a session
  async getSessionAttendance(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { sessionId } = req.params;
      const list = await attendanceService.listForSession(sessionId);

      return res.status(200).json({ attendance: list });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/attendance/:sessionId/heartbeat — student presence ping
  async heartbeat(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { sessionId } = req.params;
      const record = await attendanceService.heartbeat(
        req.user.userId,
        sessionId,
      );

      return res.status(200).json({ ok: true, record });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/attendance/:sessionId/stats — session analytics (Admins & Instructors)
  async getSessionStats(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { sessionId } = req.params;
      const { stats } = await attendanceService.getSessionStats(sessionId);

      return res.status(200).json({ stats });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
