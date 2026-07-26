import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { instructorController } from "./instructor.controller";

const router = Router();

// All instructor routes require authentication + INSTRUCTOR role
router.use(requireAuth);
router.use(requireRole([UserRole.INSTRUCTOR]));

// GET /api/instructor/analytics — scoped analytics for instructor
router.get("/analytics", instructorController.getAnalytics);

// GET /api/instructor/batches — instructor's assigned batches
router.get("/batches", instructorController.getMyBatches);

// GET /api/instructor/courses — instructor's courses (via batches)
router.get("/courses", instructorController.getMyCourses);

export const instructorRouter = router;
