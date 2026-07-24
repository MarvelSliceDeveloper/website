import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { couponController } from "./coupon.controller";

export const couponRouter = Router();

// Public / Student route for validating coupon
couponRouter.post("/validate", couponController.validateCoupon);

// Admin / SuperAdmin routes
couponRouter.use(
  requireAuth,
  requireRole([UserRole.SUPER_ADMIN]),
);

couponRouter.get("/", couponController.listCoupons);
couponRouter.post("/", couponController.createCoupon);
couponRouter.patch("/:id/toggle", couponController.toggleCoupon);
couponRouter.delete("/:id", couponController.deleteCoupon);
