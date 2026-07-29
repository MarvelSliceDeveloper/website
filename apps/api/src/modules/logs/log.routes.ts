import { Router } from "express";
import {
  requireAuth,
  requireSuperAdmin,
} from "../../middleware/auth.middleware";
import { logController } from "./log.controller";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// GET /api/admin/logs — list Graph API logs with pagination + filters
router.get("/", logController.list);

// GET /api/admin/logs/stats — log statistics for last 30 days
router.get("/stats", logController.stats);

export const logRouter = router;
