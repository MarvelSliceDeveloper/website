import { Response } from 'express';
import { ZodError } from 'zod';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  sessionService,
  CreateSessionSchema,
  UpdateSessionSchema,
} from './session.service';

export const sessionController = {
  /**
   * POST /api/sessions
   * Create a new live session (instructor only).
   */
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const data = CreateSessionSchema.parse(req.body);
      const session = await sessionService.createSession(req.user.userId, data);

      return res.status(201).json({ session });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message.includes('not the instructor') || error.message.includes('not found')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('already scheduled')) {
        return res.status(409).json({ error: error.message });
      }
      console.error('Error creating session:', error.message);
      return res.status(500).json({ error: 'Failed to create session' });
    }
  },

  /**
   * GET /api/sessions
   * List sessions with optional filters.
   */
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { batchId, courseId, status } = req.query;

      // Only filter by instructorId for INSTRUCTOR role — admins should see all sessions
      const sessions = await sessionService.listSessions({
        batchId: batchId as string | undefined,
        courseId: courseId as string | undefined,
        status: status as 'scheduled' | 'live' | 'completed' | 'cancelled' | undefined,
        instructorId: req.user.role === 'INSTRUCTOR' ? req.user.userId : undefined,
        studentId: req.user.role === 'STUDENT' ? req.user.userId : undefined,
      });

      return res.status(200).json({ sessions });
    } catch (error: any) {
      console.error('Error listing sessions:', error.message);
      return res.status(500).json({ error: 'Failed to list sessions' });
    }
  },

  /**
   * GET /api/sessions/:id
   * Get a single session by ID.
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const session = await sessionService.getSession(req.params.id);
      return res.status(200).json({ session });
    } catch (error: any) {
      if (error.message === 'Session not found') {
        return res.status(404).json({ error: 'Session not found' });
      }
      console.error('Error getting session:', error.message);
      return res.status(500).json({ error: 'Failed to get session' });
    }
  },

  /**
   * PATCH /api/sessions/:id
   * Update a session (instructor only).
   */
  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const data = UpdateSessionSchema.parse(req.body);
      const session = await sessionService.updateSession(req.params.id, req.user.userId, data);

      return res.status(200).json({ session });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the instructor')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error updating session:', error.message);
      return res.status(500).json({ error: 'Failed to update session' });
    }
  },

  /**
   * DELETE /api/sessions/:id
   * Cancel a session (instructor only). Soft-deletes by setting endedAt.
   */
  async cancel(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const session = await sessionService.cancelSession(req.params.id, req.user.userId);
      return res.status(200).json({ message: 'Session cancelled', session });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the instructor')) {
        return res.status(403).json({ error: error.message });
      }
      console.error('Error cancelling session:', error.message);
      return res.status(500).json({ error: 'Failed to cancel session' });
    }
  },

};
