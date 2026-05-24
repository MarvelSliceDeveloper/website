import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { attendanceService } from './attendance.service';

export const attendanceController = {
  /**
   * POST /api/attendance/:sessionId/join
   * Record that a student clicked "Join Now" and joined the session.
   */
  async joinSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { sessionId } = req.params;
      const attendance = await attendanceService.recordAttendance(req.user.userId, sessionId);

      return res.status(200).json({ message: 'Attendance recorded', attendance });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('not enrolled')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error recording attendance:', error.message);
      return res.status(500).json({ error: 'Failed to record attendance' });
    }
  },

  /**
   * GET /api/attendance/:sessionId
   * List all student attendance for a given session (Admin or Instructor only).
   */
  async getSessionAttendance(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { sessionId } = req.params;
      const list = await attendanceService.listForSession(sessionId);

      return res.status(200).json({ attendance: list });
    } catch (error: any) {
      console.error('Error getting session attendance:', error.message);
      return res.status(500).json({ error: 'Failed to get attendance records' });
    }
  },
};
