import { Router } from "express";
import { authController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", requireAuth, authController.logout);

// GET /api/auth/me — return current authenticated user
router.get("/me", requireAuth, authController.me);

// PATCH /api/auth/me/profile — update name
router.patch("/me/profile", requireAuth, authController.updateProfile);

// PATCH /api/auth/me/password — change password
router.patch("/me/password", requireAuth, authController.changePassword);

// POST /api/auth/me/set-password — set initial password (mustChangePassword flow)
router.post("/me/set-password", requireAuth, authController.setPassword);

// POST /api/auth/forgot-password — send reset link by email
router.post("/forgot-password", authController.forgotPassword);

// POST /api/auth/reset-password — reset password with token
router.post("/reset-password", authController.resetPassword);

// --- Microsoft Azure AD OAuth ---
router.get("/azure-ad/status", requireAuth, authController.azureAdStatus);
router.get("/azure-ad/login", requireAuth, authController.azureAdLogin);
router.get("/azure-ad/callback", authController.azureAdCallback);

export const authRouter = router;
