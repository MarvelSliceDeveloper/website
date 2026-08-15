import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { referralController } from "./referral.controller";

export const referralRouter = Router();

// Student: submit a referral (any authenticated user)
referralRouter.post("/", requireAuth, referralController.createReferral);

// Admin / SuperAdmin: manage referrals
referralRouter.use(
  requireAuth,
  requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]),
);

referralRouter.get("/", referralController.listReferrals);
referralRouter.patch("/:id/status", referralController.updateStatus);
referralRouter.post("/:id/send-coupon", referralController.sendCoupon);
