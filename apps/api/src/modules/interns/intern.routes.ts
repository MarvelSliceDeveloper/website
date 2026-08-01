import { Router } from "express";
import { internController } from "./intern.controller";
import {
  requireAuth,
  requireRole,
} from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

// ── Public intern application routes (mounted at /api/interns) ──
export const internRouter = Router();

internRouter.get("/program", internController.getInternshipProgram);
internRouter.get("/fields", internController.getInternFields);
internRouter.post("/apply", internController.createInternOrder);

// ── Admin intern management (mounted at /api/admin/interns) ──
export const adminInternRouter = Router();

adminInternRouter.use(
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
);

adminInternRouter.get("/", internController.listInterns);
adminInternRouter.get("/fields", internController.listInternFields);
adminInternRouter.post("/fields", internController.createInternField);
adminInternRouter.patch("/fields/:id", internController.updateInternField);
adminInternRouter.delete("/fields/:id", internController.deleteInternField);
adminInternRouter.patch("/program-fee", internController.updateProgramFee);
adminInternRouter.get("/sessions", internController.listInternSessions);
adminInternRouter.post("/sessions", internController.createInternSession);
adminInternRouter.delete("/sessions/:id", internController.deleteInternSession);
