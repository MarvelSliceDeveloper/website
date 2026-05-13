import { Router } from 'express';
import { courseController } from './course.controller';
import { moduleController } from './module.controller';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';

const router = Router();

// All course admin routes require authentication + ADMIN role
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));

// --- Course Routes ---

// GET /api/admin/courses — list all courses with filters
router.get('/', courseController.list);

// POST /api/admin/courses — create a new course (draft)
router.post('/', courseController.create);

// GET /api/admin/courses/:id — get full course detail with modules
router.get('/:id', courseController.getById);

// PUT /api/admin/courses/:id — update course fields
router.put('/:id', courseController.update);

// DELETE /api/admin/courses/:id — soft-delete (archive) course
router.delete('/:id', courseController.delete);

// POST /api/admin/courses/:id/publish — validate and publish
router.post('/:id/publish', courseController.publish);

// POST /api/admin/courses/:id/unpublish — revert to draft
router.post('/:id/unpublish', courseController.unpublish);

// --- Module Routes ---

// POST /api/admin/courses/:id/modules — add a module to a course
router.post('/:id/modules', moduleController.addModule);

// PATCH /api/admin/courses/:id/modules/reorder — reorder modules (drag-and-drop)
router.patch('/:id/modules/reorder', moduleController.reorderModules);

// PUT /api/admin/modules/:id — update a module
router.put('/modules/:id', moduleController.updateModule);

// DELETE /api/admin/modules/:id — delete a module
router.delete('/modules/:id', moduleController.deleteModule);

export const courseRouter = router;
