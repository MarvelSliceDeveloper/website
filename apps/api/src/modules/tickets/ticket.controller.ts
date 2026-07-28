import type { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  ticketService,
  CreateTicketSchema,
  AddMessageSchema,
  AssignMentorSchema,
  ScheduleSessionSchema,
  CompleteTicketSchema,
  UpdateStatusSchema,
} from "./ticket.service";
import { notificationService } from "../notifications/notification.service";
import { handleControllerError } from "../../utils/errors";

export const ticketController = {
  // POST /api/tickets
  // Handles ticket creation request
  async createTicket(req: AuthRequest, res: Response) {
    try {
      const data = CreateTicketSchema.parse(req.body);
      const ticket = await ticketService.createTicket(req.user!.userId, data);

      if (data.type === "MENTORSHIP") {
        notificationService.notifyMentorshipCreated(ticket.id);

        const { tickets } = await ticketService.listTickets({
          userId: req.user!.userId,
          type: "MENTORSHIP",
        });

        return res.status(201).json({ ticket, tickets });
      } else {
        notificationService.notifySupportTicketCreated(ticket.id);
      }

      res.status(201).json({ ticket });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // GET /api/tickets
  // Handles ticket listing request
  async listTickets(req: AuthRequest, res: Response) {
    try {
      const role = req.user!.role;
      const type = req.query.type as "MENTORSHIP" | "SUPPORT" | undefined;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      let result;
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        const mentorId = type === "MENTORSHIP" ? undefined : undefined;
        result = await ticketService.listTickets({
          role,
          type,
          status,
          mentorId,
          page,
          limit,
        });
      } else if (role === "INSTRUCTOR") {
        if (type === "SUPPORT") {
          result = await ticketService.listTickets({
            userId: req.user!.userId,
            type: "SUPPORT",
            status,
            page,
            limit,
          });
        } else {
          result = await ticketService.listTickets({
            mentorId: req.user!.userId,
            type: "MENTORSHIP",
            status,
            page,
            limit,
          });
        }
      } else {
        result = await ticketService.listTickets({
          userId: req.user!.userId,
          type,
          status,
          page,
          limit,
        });
      }

      res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // GET /api/tickets/:id
  // Handles single ticket retrieval
  async getTicket(req: AuthRequest, res: Response) {
    try {
      const ticket = await ticketService.getTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const userId = req.user!.userId;
      const role = req.user!.role;
      const isOwner =
        ticket.type === "SUPPORT"
          ? (ticket as any).userId === userId
          : (ticket as any).studentId === userId;
      const isAssignedMentor =
        ticket.type === "MENTORSHIP" && (ticket as any).mentorId === userId;

      if (
        role !== "ADMIN" &&
        role !== "SUPER_ADMIN" &&
        !isOwner &&
        !isAssignedMentor
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json({ ticket });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // PATCH /api/tickets/:id/assign
  // Handles mentor assignment request
  async assignMentor(req: AuthRequest, res: Response) {
    try {
      const data = AssignMentorSchema.parse(req.body);
      const ticket = await ticketService.assignMentor(
        req.params.id,
        req.user!.userId,
        data,
      );
      notificationService.notifyMentorshipStatusChange(
        req.params.id,
        "ASSIGNED",
      );
      res.json({ ticket });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // PATCH /api/tickets/:id/schedule
  // Handles session scheduling request
  async scheduleSession(req: AuthRequest, res: Response) {
    try {
      const data = ScheduleSessionSchema.parse(req.body);
      const ticket = await ticketService.scheduleSession(
        req.params.id,
        req.user!.userId,
        data,
      );
      notificationService.notifyMentorshipStatusChange(
        req.params.id,
        "SCHEDULED",
      );
      res.json({ ticket });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // PATCH /api/tickets/:id/complete
  // Handles ticket completion request
  async completeTicket(req: AuthRequest, res: Response) {
    try {
      const data = CompleteTicketSchema.parse(req.body);
      const ticket = await ticketService.completeTicket(req.params.id, data);
      notificationService.notifyMentorshipStatusChange(
        req.params.id,
        "COMPLETED",
      );
      res.json({ ticket });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // PATCH /api/tickets/:id/cancel
  // Handles ticket cancellation request
  async cancelTicket(req: AuthRequest, res: Response) {
    try {
      const ticket = await ticketService.cancelMentorshipTicket(req.params.id);
      notificationService.notifyMentorshipStatusChange(
        req.params.id,
        "CANCELLED",
      );
      res.json({ ticket });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // POST /api/tickets/:id/messages
  // Handles adding a message to a ticket
  async addMessage(req: AuthRequest, res: Response) {
    try {
      const data = AddMessageSchema.parse(req.body);
      const ticket = await ticketService.getTicket(req.params.id);
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const role = req.user!.role;
      const userId = req.user!.userId;
      const isOwner =
        ticket.type === "SUPPORT"
          ? (ticket as any).userId === userId
          : (ticket as any).studentId === userId;

      if (role !== "ADMIN" && role !== "SUPER_ADMIN" && !isOwner) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const message = await ticketService.addMessage(
        req.params.id,
        req.user!.userId,
        data,
      );
      notificationService.notifySupportTicketNewMessage(
        req.params.id,
        req.user!.userId,
      );

      res.status(201).json({ message });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // PATCH /api/tickets/:id/status
  // Handles support ticket status update
  async updateStatus(req: AuthRequest, res: Response) {
    try {
      if (req.user!.role !== "ADMIN" && req.user!.role !== "SUPER_ADMIN") {
        return res
          .status(403)
          .json({ error: "Only admins can update ticket status" });
      }

      const data = UpdateStatusSchema.parse(req.body);
      const ticket = await ticketService.updateStatus(req.params.id, data);
      notificationService.notifySupportTicketStatusChanged(
        req.params.id,
        data.status,
      );

      res.json({ ticket });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // GET /api/tickets/mentors
  // Handles listing available mentors
  async getMentors(req: AuthRequest, res: Response) {
    try {
      const mentors = await ticketService.getAvailableMentors();
      res.json({ mentors });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // GET /api/tickets/stats
  // Handles ticket statistics request
  async getStats(req: AuthRequest, res: Response) {
    try {
      const type = (req.query.type as "MENTORSHIP" | "SUPPORT") || "MENTORSHIP";
      const stats = await ticketService.getStats(type);
      res.json({ stats });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
};
