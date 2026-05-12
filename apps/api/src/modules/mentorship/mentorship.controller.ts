import { Response } from 'express';
import { TicketStatus } from '@prisma/client';
import { ZodError } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  mentorshipService,
  CreateTicketSchema,
  AssignMentorSchema,
  ScheduleSessionSchema,
} from './mentorship.service';

export const mentorshipController = {
  /**
   * POST /api/mentorship/tickets
   * Create a new mentorship ticket (student)
   */
  async createTicket(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const data = CreateTicketSchema.parse(req.body);
      const ticket = await mentorshipService.createTicket(req.user.userId, data);

      return res.status(201).json({
        success: true,
        message: 'Mentorship request submitted successfully',
        ticket
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating mentorship ticket:', error.message);
      return res.status(500).json({ error: 'Failed to create mentorship request' });
    }
  },

  /**
   * GET /api/mentorship/tickets/my
   * List tickets for the current student
   */
  async listMyTickets(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const tickets = await mentorshipService.listStudentTickets(req.user.userId);
      return res.status(200).json({ tickets });
    } catch (error: any) {
      console.error('Error listing tickets:', error.message);
      return res.status(500).json({ error: 'Failed to list tickets' });
    }
  },

  /**
   * GET /api/mentorship/tickets
   * List all tickets (admin only)
   */
  async listAllTickets(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      const tickets = await mentorshipService.listAllTickets(status as TicketStatus | undefined);
      return res.status(200).json({ tickets });
    } catch (error: any) {
      console.error('Error listing all tickets:', error.message);
      return res.status(500).json({ error: 'Failed to list tickets' });
    }
  },

  /**
   * GET /api/mentorship/tickets/:id
   * Get a single ticket by ID
   */
  async getTicket(req: AuthRequest, res: Response) {
    try {
      const ticket = await mentorshipService.getTicket(req.params.id);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Check if user has access to this ticket
      if (req.user?.role === 'STUDENT' && ticket.studentId !== req.user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.status(200).json({ ticket });
    } catch (error: any) {
      console.error('Error getting ticket:', error.message);
      return res.status(500).json({ error: 'Failed to get ticket' });
    }
  },

  /**
   * PATCH /api/mentorship/tickets/:id/assign
   * Assign a mentor to a ticket (admin only)
   */
  async assignMentor(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const data = AssignMentorSchema.parse(req.body);
      const ticket = await mentorshipService.assignMentor(req.params.id, req.user.userId, data);

      return res.status(200).json({
        success: true,
        message: 'Mentor assigned successfully',
        ticket
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Cannot assign')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error assigning mentor:', error.message);
      return res.status(500).json({ error: 'Failed to assign mentor' });
    }
  },

  /**
   * PATCH /api/mentorship/tickets/:id/schedule
   * Schedule a mentorship session (admin only)
   */
  async scheduleSession(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const data = ScheduleSessionSchema.parse(req.body);
      const ticket = await mentorshipService.scheduleSession(req.params.id, req.user.userId, data);

      return res.status(200).json({
        success: true,
        message: 'Session scheduled successfully',
        ticket
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error scheduling session:', error.message);
      return res.status(500).json({ error: 'Failed to schedule session' });
    }
  },

  /**
   * PATCH /api/mentorship/tickets/:id/complete
   * Complete a mentorship session (admin only)
   */
  async completeTicket(req: AuthRequest, res: Response) {
    try {
      const ticket = await mentorshipService.completeTicket(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Ticket marked as completed',
        ticket
      });
    } catch (error: any) {
      console.error('Error completing ticket:', error.message);
      return res.status(500).json({ error: 'Failed to complete ticket' });
    }
  },

  /**
   * PATCH /api/mentorship/tickets/:id/cancel
   * Cancel a mentorship ticket (admin only)
   */
  async cancelTicket(req: AuthRequest, res: Response) {
    try {
      const ticket = await mentorshipService.cancelTicket(req.params.id);
      return res.status(200).json({
        success: true,
        message: 'Ticket cancelled successfully',
        ticket
      });
    } catch (error: any) {
      console.error('Error cancelling ticket:', error.message);
      return res.status(500).json({ error: 'Failed to cancel ticket' });
    }
  },

  /**
   * GET /api/mentorship/mentors
   * Get available mentors (admin only)
   */
  async getMentors(req: AuthRequest, res: Response) {
    try {
      const mentors = await mentorshipService.getAvailableMentors();
      return res.status(200).json({ mentors });
    } catch (error: any) {
      console.error('Error getting mentors:', error.message);
      return res.status(500).json({ error: 'Failed to get mentors' });
    }
  },

  /**
   * GET /api/mentorship/stats
   * Get mentorship stats (admin only)
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await mentorshipService.getMentorshipStats();
      return res.status(200).json({ stats });
    } catch (error: any) {
      console.error('Error getting stats:', error.message);
      return res.status(500).json({ error: 'Failed to get stats' });
    }
  },
};
