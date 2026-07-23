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
};
