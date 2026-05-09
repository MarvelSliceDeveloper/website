import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { recordingService } from './recording.service';

export const recordingController = {
  /**
   * GET /api/recordings?batchId=...
   */
  async listForBatch(req: AuthRequest, res: Response) {
    try {
      const { batchId } = req.query;
      if (!batchId) return res.status(400).json({ error: 'batchId is required' });

      const recordings = await recordingService.getRecordingsForBatch(
        batchId as string,
        req.user!.userId
      );
      res.json({ recordings });
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  },

  /**
   * GET /api/recordings/:id
   */
  async getById(req: AuthRequest, res: Response) {
    try {
      const recording = await recordingService.getRecording(
        req.params.id,
        req.user!.userId
      );
      res.json({ recording });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  /**
   * GET /api/recordings/:id/url
   */
  async getPlaybackUrl(req: AuthRequest, res: Response) {
    try {
      const data = await recordingService.getPlaybackUrl(
        req.params.id,
        req.user!.userId
      );
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch recording URL' });
    }
  },

  /**
   * POST /api/recordings/progress
   */
  async updateProgress(req: AuthRequest, res: Response) {
    try {
      const { recordingId, watchedSeconds } = req.body;
      if (!recordingId || watchedSeconds === undefined) {
        return res.status(400).json({ error: 'recordingId and watchedSeconds are required' });
      }

      const progress = await recordingService.updateProgress(
        req.user!.userId,
        recordingId,
        watchedSeconds
      );
      res.json({ progress });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * POST /api/recordings/:sessionId/sync (Admin/Instructor only)
   */
  async manualSync(req: AuthRequest, res: Response) {
    try {
      const recording = await recordingService.syncRecordingsForSession(req.params.sessionId);
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found in Microsoft Teams yet' });
      }
      res.json({ message: 'Recording synced successfully', recording });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
