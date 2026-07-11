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
import { ZodError } from "zod";

function handleError(res: Response, error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.errors });
  }
  const message = error instanceof Error ? error.message : fallback;
  if (message.includes("not found"))
    return res.status(404).json({ error: message });
  if (message.includes("Cannot assign"))
    return res.status(400).json({ error: message });
  console.error(`${fallback}:`, message);
  return res.status(500).json({ error: fallback });
}

export const ticketController = {
  // POST /api/tickets
  // Handles ticket creation request
  async createTicket(req: AuthRequest, res: Response) {
    try {
      const data = CreateTicketSchema.parse(req.body);
      const ticket = await ticketService.createTicket(req.user!.userId, data);

      if (data.type === "MENTORSHIP") {
        notificationService.notifyMentorshipCreated(ticket.id);
      } else {
        notificationService.notifySupportTicketCreated(ticket.id);
      }

      res.status(201).json({ ticket });
    } catch (error) {
      handleError(res, error, "Failed to create ticket");
    }
  },

  // GET /api/tickets
  // Handles ticket listing request
  async listTickets(req: AuthRequest, res: Response) {
    try {
      const role = req.user!.role;
      const type = req.query.type as "MENTORSHIP" | "SUPPORT" | undefined;
      const status = req.query.status as string | undefined;

      let tickets;
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        const mentorId = type === "MENTORSHIP" ? undefined : undefined;
        tickets = await ticketService.listTickets({
          role,
          type,
          status,
          mentorId,
        });
      } else if (role === "INSTRUCTOR") {
        if (type === "SUPPORT") {
          tickets = await ticketService.listTickets({
            userId: req.user!.userId,
            type: "SUPPORT",
            status,
          });
        } else {
          tickets = await ticketService.listTickets({
            mentorId: req.user!.userId,
            type: "MENTORSHIP",
            status,
          });
        }
      } else {
        tickets = await ticketService.listTickets({
          userId: req.user!.userId,
          type,
          status,
        });
      }

      res.json({ tickets });
    } catch (error) {
      handleError(res, error, "Failed to list tickets");
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
    } catch (error) {
      handleError(res, error, "Failed to get ticket");
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
    } catch (error) {
      handleError(res, error, "Failed to assign mentor");
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
    } catch (error) {
      handleError(res, error, "Failed to schedule session");
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
    } catch (error) {
      handleError(res, error, "Failed to complete ticket");
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
    } catch (error) {
      handleError(res, error, "Failed to cancel ticket");
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
    } catch (error) {
      handleError(res, error, "Failed to add message");
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
    } catch (error) {
      handleError(res, error, "Failed to update status");
    }
  },

  // GET /api/tickets/mentors
  // Handles listing available mentors
  async getMentors(req: AuthRequest, res: Response) {
    try {
      const mentors = await ticketService.getAvailableMentors();
      res.json({ mentors });
    } catch (error) {
      handleError(res, error, "Failed to get mentors");
    }
  },

  // GET /api/tickets/stats
  // Handles ticket statistics request
  async getStats(req: AuthRequest, res: Response) {
    try {
      const type = (req.query.type as "MENTORSHIP" | "SUPPORT") || "MENTORSHIP";
      const stats = await ticketService.getStats(type);
      res.json({ stats });
    } catch (error) {
      handleError(res, error, "Failed to get stats");
    }
  },
};
