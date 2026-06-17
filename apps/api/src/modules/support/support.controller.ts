import type { Request, Response } from 'express';
import { supportService, CreateTicketSchema, AddMessageSchema, UpdateStatusSchema } from './support.service';
import { notificationService } from '../notifications/notification.service';
import { SupportTicketStatus } from '@prisma/client';

export const supportController = {
  async createTicket(req: Request, res: Response) {
    try {
      const parsed = CreateTicketSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const ticket = await supportService.createTicket(req.user!.userId, parsed.data);

      await notificationService.notifySupportTicketCreated(ticket.id);

      res.status(201).json({ ticket });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create ticket';
      res.status(500).json({ error: message });
    }
  },

  async listTickets(req: Request, res: Response) {
    try {
      const role = req.user!.role;
      const status = req.query.status as SupportTicketStatus | undefined;

      let tickets;
      if (role === 'ADMIN') {
        tickets = await supportService.listAllTickets(status);
      } else {
        tickets = await supportService.listUserTickets(req.user!.userId);
      }

      res.json({ tickets });
    } catch {
      res.status(500).json({ error: 'Failed to list tickets' });
    }
  },

  async getTicket(req: Request, res: Response) {
    try {
      const ticket = await supportService.getTicket(req.params.id);
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      const role = req.user!.role;
      if (role !== 'ADMIN' && ticket.userId !== req.user!.userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      res.json({ ticket });
    } catch {
      res.status(500).json({ error: 'Failed to get ticket' });
    }
  },

  async addMessage(req: Request, res: Response) {
    try {
      const parsed = AddMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      const ticket = await supportService.getTicket(req.params.id);
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      const role = req.user!.role;
      if (role !== 'ADMIN' && ticket.userId !== req.user!.userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const message = await supportService.addMessage(req.params.id, req.user!.userId, parsed.data);

      await notificationService.notifySupportTicketNewMessage(req.params.id, req.user!.userId);

      res.status(201).json({ message });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add message';
      res.status(500).json({ error: message });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const parsed = UpdateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        return;
      }

      if (req.user!.role !== 'ADMIN') {
        res.status(403).json({ error: 'Only admins can update ticket status' });
        return;
      }

      const ticket = await supportService.updateStatus(req.params.id, parsed.data);

      await notificationService.notifySupportTicketStatusChanged(req.params.id, parsed.data.status);

      res.json({ ticket });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      res.status(500).json({ error: message });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const stats = await supportService.getSupportStats();
      res.json({ stats });
    } catch {
      res.status(500).json({ error: 'Failed to get stats' });
    }
  },
};
