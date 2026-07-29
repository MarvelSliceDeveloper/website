import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { profileController } from "./profile.controller";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.INSTRUCTOR]));

// GET /api/instructor/profile — Get own profile + user info
router.get("/profile", profileController.getProfile);

// PUT /api/instructor/profile — Save/update own profile
router.put("/profile", profileController.upsertProfile);

// GET /api/instructor/profile/status — Get onboarding status
router.get("/profile/status", profileController.getOnboardingStatus);

// POST /api/instructor/profile/upload — Upload photo/resume
router.post("/profile/upload", profileController.uploadFile);

export { router as profileRouter };
