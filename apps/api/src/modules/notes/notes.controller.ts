import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { notesService } from './notes.service';

export const notesController = {
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const courseId = req.query.courseId as string | undefined;
      const moduleId = req.query.moduleId as string | undefined;
      const isSticky = req.query.isSticky === 'true' ? true : undefined;
      const notes = await notesService.list(req.user.userId, courseId, moduleId, isSticky);
      return res.status(200).json({ notes });
    } catch (error: any) {
      console.error('Error listing notes:', error.message);
      return res.status(500).json({ error: 'Failed to list notes' });
    }
  },

  async get(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const note = await notesService.get(req.params.id, req.user.userId);
      if (!note) return res.status(404).json({ error: 'Note not found' });
      return res.status(200).json({ note });
    } catch (error: any) {
      console.error('Error getting note:', error.message);
      return res.status(500).json({ error: 'Failed to get note' });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { courseId, moduleId, title, body, isSticky } = req.body;
      if (!courseId) return res.status(400).json({ error: 'courseId is required' });
      const note = await notesService.create({
        userId: req.user.userId,
        courseId,
        moduleId: moduleId || undefined,
        title: title || '',
        body: body || '',
        isSticky: isSticky || false,
      });
      return res.status(201).json({ note });
    } catch (error: any) {
      console.error('Error creating note:', error.message);
      return res.status(500).json({ error: 'Failed to create note' });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { title, body, isSticky } = req.body;
      const result = await notesService.update(req.params.id, req.user.userId, { title, body, isSticky });
      if (result.count === 0) return res.status(404).json({ error: 'Note not found' });
      return res.status(200).json({ message: 'Note updated' });
    } catch (error: any) {
      console.error('Error updating note:', error.message);
      return res.status(500).json({ error: 'Failed to update note' });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const result = await notesService.delete(req.params.id, req.user.userId);
      if (result.count === 0) return res.status(404).json({ error: 'Note not found' });
      return res.status(200).json({ message: 'Note deleted' });
    } catch (error: any) {
      console.error('Error deleting note:', error.message);
      return res.status(500).json({ error: 'Failed to delete note' });
    }
  },
};
