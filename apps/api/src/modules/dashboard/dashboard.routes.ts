import { Router, Response } from "express";
import {
  requireAuth,
  requireRole,
  AuthRequest,
} from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { dashboardController } from "./dashboard.controller";

const router = Router();

router.use(requireAuth);
// GET /api/admin/dashboard/stats — aggregated dashboard statistics
router.get("/stats", requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), dashboardController.getStats);

// GET /api/admin/dashboard/analytics — detailed learning analytics
router.get("/analytics", requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR]), dashboardController.getAnalytics);

export const dashboardRouter = router;
