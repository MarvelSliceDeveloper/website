import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { ticketController } from "../tickets/ticket.controller";
import type { AuthRequest } from "../../middleware/auth.middleware";
import type { Response, NextFunction } from "express";

export const supportRouter = Router();

supportRouter.use(requireAuth);

// Set type=SUPPORT so the unified controller routes to support logic
function setSupportType(req: AuthRequest, _res: Response, next: NextFunction) {
  req.query.type = "SUPPORT" as any;
  next();
}

function setSupportBody(req: AuthRequest, _res: Response, next: NextFunction) {
  req.body.type = "SUPPORT";
  next();
}

supportRouter.post("/tickets", setSupportBody, ticketController.createTicket);
supportRouter.get("/tickets", setSupportType, ticketController.listTickets);
supportRouter.get(
  "/tickets/stats",
  setSupportType,
  requireRole([UserRole.ADMIN]),
  ticketController.getStats,
);
supportRouter.get("/tickets/:id", ticketController.getTicket);
supportRouter.post("/tickets/:id/messages", ticketController.addMessage);
supportRouter.patch("/tickets/:id/status", ticketController.updateStatus);
