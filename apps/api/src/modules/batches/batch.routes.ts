import { Router } from 'express';
import { batchController } from './batch.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';

const router = Router();

// All batch admin routes require authentication + ADMIN role
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));

// --- Helper endpoints (for dropdowns) ---

// GET /api/admin/batches/instructors — list available instructors
router.get('/instructors', batchController.getInstructors);

// GET /api/admin/batches/courses — list published courses
router.get('/courses', batchController.getCourses);

// --- Batch CRUD ---

// GET /api/admin/batches — list all batches
router.get('/', batchController.list);

// POST /api/admin/batches — create a new batch
router.post('/', batchController.create);

// GET /api/admin/batches/:id — get batch detail
router.get('/:id', batchController.getById);

// PUT /api/admin/batches/:id — update batch
router.put('/:id', batchController.update);

// DELETE /api/admin/batches/:id — delete batch
router.delete('/:id', batchController.delete);

// --- Student management ---

// GET /api/admin/batches/:id/students — list students in batch
router.get('/:id/students', batchController.listStudents);

// POST /api/admin/batches/:id/students — add students to batch
router.post('/:id/students', batchController.addStudents);

// DELETE /api/admin/batches/:id/students/:uid — remove student
router.delete('/:id/students/:uid', batchController.removeStudent);

export const batchRouter = router;
