import { Router } from "express";
import { paymentController } from "./payment.controller";
import { requireAuth, optionalAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

// ── Public / Authenticated payment routes (mounted at /api/payments) ──
export const paymentRouter = Router();

paymentRouter.post("/create-order", optionalAuth, paymentController.createOrder);
paymentRouter.post("/verify", paymentController.verifyPayment);
paymentRouter.get("/batches", paymentController.getAvailableBatches);
paymentRouter.post("/enroll", requireAuth, paymentController.enrollInBatch);
paymentRouter.post("/consent", requireAuth, paymentController.createConsentEnrollment);

// ── Admin payment routes (mounted at /api/admin/payments) ──
export const adminPaymentRouter = Router();

adminPaymentRouter.use(requireAuth, requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

adminPaymentRouter.get("/", paymentController.getAdminPayments);
adminPaymentRouter.get("/revenue", paymentController.getRevenueStats);
