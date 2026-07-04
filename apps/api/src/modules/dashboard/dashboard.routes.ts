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
router.use(requireRole([UserRole.ADMIN]));

// GET /api/admin/dashboard/stats — aggregated dashboard statistics
router.get("/stats", dashboardController.getStats);

export const dashboardRouter = router;
