import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { recordingController } from './recording.controller';
import { UserRole } from '@lms/types';

const router = Router();

// All recording routes require authentication
router.use(requireAuth);

// GET /api/recordings?batchId=... - List recordings for a batch
router.get('/', recordingController.listForBatch);

// POST /api/recordings/progress - Update watch progress
router.post('/progress', recordingController.updateProgress);

// GET /api/recordings/:id - Get recording details
router.get('/:id', recordingController.getById);

// GET /api/recordings/:id/url - Get fresh SharePoint playback URL
router.get('/:id/url', recordingController.getPlaybackUrl);

// POST /api/recordings/:sessionId/sync - Manually trigger sync (Instructor/Admin)
router.post(
  '/:sessionId/sync',
  requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  recordingController.manualSync
);

export const recordingRouter = router;
