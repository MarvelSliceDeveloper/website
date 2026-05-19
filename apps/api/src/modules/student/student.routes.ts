import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { studentController } from "./student.controller";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.STUDENT]));

router.get("/assignments/overdue", studentController.listOverdueAssignments);

export const studentRouter = router;
