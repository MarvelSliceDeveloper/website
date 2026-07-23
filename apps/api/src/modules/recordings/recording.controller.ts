import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { recordingService } from "./recording.service";
import { handleControllerError } from "../../utils/errors";

export const recordingController = {
  // GET /api/recordings?batchId= — lists recordings for a batch
  async listForBatch(req: AuthRequest, res: Response) {
    try {
      const { batchId } = req.query;
      if (!batchId)
        return res.status(400).json({ error: "batchId is required" });

      const recordings = await recordingService.getRecordingsForBatch(
        batchId as string,
        req.user!.userId,
      );
      res.json({ recordings });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // GET /api/recordings/:id — gets a recording by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const recording = await recordingService.getRecording(
        req.params.id,
        req.user!.userId,
      );
      res.json({ recording });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // GET /api/recordings/:id/url — fetches recording playback URL
  async getPlaybackUrl(req: AuthRequest, res: Response) {
    try {
      const data = await recordingService.getPlaybackUrl(
        req.params.id,
        req.user!.userId,
      );
      res.json(data);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // POST /api/recordings/progress — updates watch progress
  async updateProgress(req: AuthRequest, res: Response) {
    try {
      const { recordingId, watchedSeconds } = req.body;
      if (!recordingId || watchedSeconds === undefined) {
        return res
          .status(400)
          .json({ error: "recordingId and watchedSeconds are required" });
      }

      const progress = await recordingService.updateProgress(
        req.user!.userId,
        recordingId,
        watchedSeconds,
      );
      res.json({ progress });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },

  // POST /api/recordings/:sessionId/sync — manually syncs a recording
  async manualSync(req: AuthRequest, res: Response) {
    try {
      const recording = await recordingService.syncRecordingsForSession(
        req.params.sessionId,
      );
      if (!recording) {
        return res
          .status(404)
          .json({ error: "Recording not found in Microsoft Teams yet" });
      }
      res.json({ message: "Recording synced successfully", recording });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
};
