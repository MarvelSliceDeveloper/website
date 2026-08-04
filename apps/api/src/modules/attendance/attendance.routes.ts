import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { attendanceController } from "./attendance.controller";
import { UserRole } from "@lms/types";

const router = Router();

// All attendance routes require authentication
router.use(requireAuth);

// POST /api/attendance/:sessionId/join - Join session and record attendance
router.post("/:sessionId/join", attendanceController.joinSession);

// POST /api/attendance/:sessionId/leave - Leave session and compute duration
router.post("/:sessionId/leave", attendanceController.leaveSession);

// POST /api/attendance/:sessionId/heartbeat - Student presence ping
router.post("/:sessionId/heartbeat", attendanceController.heartbeat);

// GET /api/attendance/:sessionId/stats - Session analytics (Admins & Instructors only)
router.get(
  "/:sessionId/stats",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR]),
  attendanceController.getSessionStats,
);

// GET /api/attendance/:sessionId - Get list of students who attended (Admins & Instructors only)
router.get(
  "/:sessionId",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  attendanceController.getSessionAttendance,
);

export const attendanceRouter = router;
