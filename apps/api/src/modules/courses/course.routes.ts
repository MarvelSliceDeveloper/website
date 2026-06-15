import { Router, Request, Response, NextFunction } from 'express';
import { courseController } from './course.controller';
import { moduleController } from './module.controller';
import { uploadCourseThumbnail } from './course.upload';
import { uploadModuleResource } from './modules.upload';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';
import { UserRole } from '@lms/types';

const router = Router();

// All course admin routes require authentication
router.use(requireAuth);

// --- Course Routes ---

// GET /api/admin/courses — list all courses with filters
router.get('/', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.list);

// POST /api/admin/courses — create a new course (draft)
router.post('/', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.create);

// GET /api/admin/courses/:id — get full course detail with modules
router.get('/:id', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.getById);

// PUT /api/admin/courses/:id — update course fields
router.put('/:id', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.update);

// POST /api/admin/courses/:id/thumbnail — upload course thumbnail image
router.post(
    '/:id/thumbnail',
    requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
    (req: Request, res: Response, next: NextFunction) =>
        uploadCourseThumbnail(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            return next();
        }),
    courseController.uploadThumbnail
);

// DELETE /api/admin/courses/:id — soft-delete (archive) course
router.delete('/:id', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.delete);

// POST /api/admin/courses/:id/publish — validate and publish
router.post('/:id/publish', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.publish);

// POST /api/admin/courses/:id/unpublish — revert to draft
router.post('/:id/unpublish', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.unpublish);

// GET /api/admin/courses/:courseId/sessions — list sessions for a course
router.get('/:courseId/sessions', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.listSessions);

// GET /api/admin/courses/:courseId/recordings — list recordings for a course
router.get('/:courseId/recordings', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), courseController.listRecordings);

// --- Module Routes ---

// POST /api/admin/courses/:id/modules — add a module to a course
router.post('/:id/modules', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), moduleController.addModule);

// PATCH /api/admin/courses/:id/modules/reorder — reorder modules (drag-and-drop)
router.patch('/:id/modules/reorder', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), moduleController.reorderModules);

// PUT /api/admin/modules/:id — update a module
router.put('/modules/:id', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), moduleController.updateModule);

// DELETE /api/admin/modules/:id — delete a module
router.delete('/modules/:id', requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]), moduleController.deleteModule);

// --- Module Resources Routes ---

// POST /api/admin/courses/:courseId/modules/:id/resources — upload resource file
router.post(
  '/:courseId/modules/:id/resources',
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  (req: Request, res: Response, next: NextFunction) =>
    uploadModuleResource(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return next();
    }),
  moduleController.uploadResource
);

// DELETE /api/admin/courses/modules/:id/resources/:resourceId — delete resource file
router.delete(
  '/modules/:id/resources/:resourceId',
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  moduleController.deleteResource
);
export const courseRouter = router;
