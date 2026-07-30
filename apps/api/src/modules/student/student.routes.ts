import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { studentController } from "./student.controller";
import { packageController } from "../packages/package.controller";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.STUDENT]));

router.get("/assignments/overdue", studentController.listOverdueAssignments);
router.get("/continue-learning", studentController.getContinueLearning);
router.get("/packages", packageController.getStudentPackages);
router.get("/payments", studentController.getPaymentHistory);
router.get("/profile", studentController.getProfile);
router.patch("/profile", studentController.updateProfile);

export const studentRouter = router;
