import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { batchController } from './batch.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/batches/:id — get batch detail (student-accessible)
router.get('/:id', batchController.getByIdForStudent);

export const studentBatchRouter = router;
