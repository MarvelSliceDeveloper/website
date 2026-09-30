import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { manualOrdersController } from "./manual-orders.controller";

// Student (logged-in) routes — mounted at /api/courses
export const manualStudentRouter = Router();

manualStudentRouter.get(
  "/catalogue/:id/payment-options",
  manualOrdersController.getOptions,
);
manualStudentRouter.post(
  "/catalogue/:id/manual-order",
  requireAuth,
  manualOrdersController.submit,
);
manualStudentRouter.get(
  "/manual-orders/mine",
  requireAuth,
  manualOrdersController.mine,
);

// Package (single-packet page) routes — mounted at /api/packages
export const manualPackageRouter = Router();

manualPackageRouter.get(
  "/:id/payment-options",
  manualOrdersController.getPackageOptions,
);
manualPackageRouter.post(
  "/:id/manual-order",
  requireAuth,
  manualOrdersController.submitPackage,
);

// Admin routes — mounted at /api/admin
export const manualAdminRouter = Router();

manualAdminRouter.use(requireAuth);
manualAdminRouter.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

manualAdminRouter.get("/manual-orders", manualOrdersController.list);
manualAdminRouter.patch(
  "/manual-orders/:id/approve",
  manualOrdersController.approve,
);
manualAdminRouter.patch(
  "/manual-orders/:id/reject",
  manualOrdersController.reject,
);
manualAdminRouter.get("/payment-settings", manualOrdersController.getSettings);
manualAdminRouter.put(
  "/payment-settings",
  manualOrdersController.updateSettings,
);
