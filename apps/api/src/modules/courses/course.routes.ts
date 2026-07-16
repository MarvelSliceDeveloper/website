import { Router, Request, Response, NextFunction } from "express";
import { courseController } from "./course.controller";
import { moduleController } from "./module.controller";
import { lessonController } from "./lesson.controller";
import { quizController } from "./quiz.controller";
import { assignmentController } from "./assignment.controller";
import { uploadCourseThumbnail } from "./course.upload";
import { uploadLessonResource } from "./modules.upload";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

// All course admin routes require authentication
router.use(requireAuth);

// --- Course Routes ---

// GET /api/admin/courses — list all courses with filters
router.get(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.list,
);

// POST /api/admin/courses — create a new course (draft)
router.post(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.create,
);

// GET /api/admin/courses/:id — get full course detail with modules
router.get(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.getById,
);

// PUT /api/admin/courses/:id — update course fields
router.put(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.update,
);

// POST /api/admin/courses/:id/thumbnail — upload course thumbnail image
router.post(
  "/:id/thumbnail",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  (req: Request, res: Response, next: NextFunction) =>
    uploadCourseThumbnail(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      return next();
    }),
  courseController.uploadThumbnail,
);

// DELETE /api/admin/courses/:id — soft-delete (archive) course
router.delete(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.delete,
);

// DELETE /api/admin/courses/:id/permanent — permanently delete course and all related data (admin only)
router.delete(
  "/:id/permanent",
  requireRole([UserRole.ADMIN]),
  courseController.permanentDelete,
);

// POST /api/admin/courses/:id/recover — recover from archive to draft
router.post(
  "/:id/recover",
  requireRole([UserRole.ADMIN]),
  courseController.recover,
);

// POST /api/admin/courses/:id/publish — validate and publish
router.post(
  "/:id/publish",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.publish,
);

// POST /api/admin/courses/:id/unpublish — revert to draft
router.post(
  "/:id/unpublish",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.unpublish,
);

// GET /api/admin/courses/:courseId/sessions — list sessions for a course
router.get(
  "/:courseId/sessions",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.listSessions,
);

// GET /api/admin/courses/:courseId/recordings — list recordings for a course
router.get(
  "/:courseId/recordings",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  courseController.listRecordings,
);

// --- Module Routes ---

// POST /api/admin/courses/:id/modules — add a module to a course
router.post(
  "/:id/modules",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  moduleController.addModule,
);

// PATCH /api/admin/courses/:id/modules/reorder — reorder modules (drag-and-drop)
router.patch(
  "/:id/modules/reorder",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  moduleController.reorderModules,
);

// PUT /api/admin/modules/:id — update a module
router.put(
  "/modules/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  moduleController.updateModule,
);

// DELETE /api/admin/modules/:id — delete a module
router.delete(
  "/modules/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  moduleController.deleteModule,
);

// --- Lesson Routes ---

// POST /api/admin/courses/modules/:moduleId/lessons — add a lesson to a module
router.post(
  "/modules/:moduleId/lessons",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  lessonController.addLesson,
);

// PATCH /api/admin/courses/modules/:moduleId/lessons/reorder — reorder lessons
router.patch(
  "/modules/:moduleId/lessons/reorder",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  lessonController.reorderLessons,
);

// PUT /api/admin/courses/modules/lessons/:id — update a lesson
router.put(
  "/modules/lessons/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  lessonController.updateLesson,
);

// DELETE /api/admin/courses/modules/lessons/:id — delete a lesson
router.delete(
  "/modules/lessons/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  lessonController.deleteLesson,
);

// --- Lesson Resource Routes ---

// POST /api/admin/courses/:courseId/lessons/:lessonId/resources — upload resource file to a lesson
router.post(
  "/:courseId/lessons/:lessonId/resources",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  (req: Request, res: Response, next: NextFunction) =>
    uploadLessonResource(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      return next();
    }),
  lessonController.uploadResource,
);

// DELETE /api/admin/courses/lessons/:lessonId/resources/:resourceId — delete resource from lesson
router.delete(
  "/lessons/:lessonId/resources/:resourceId",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  lessonController.deleteResource,
);

// --- Quiz Routes ---

// POST /api/admin/courses/modules/:moduleId/quizzes — add a quiz to a module
router.post(
  "/modules/:moduleId/quizzes",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  quizController.addQuiz,
);

// PUT /api/admin/courses/modules/quizzes/:id — update a quiz
router.put(
  "/modules/quizzes/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  quizController.updateQuiz,
);

// DELETE /api/admin/courses/modules/quizzes/:id — delete a quiz
router.delete(
  "/modules/quizzes/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  quizController.deleteQuiz,
);

// --- Assignment Routes ---

// POST /api/admin/courses/modules/:moduleId/assignments — add an assignment to a module
router.post(
  "/modules/:moduleId/assignments",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  assignmentController.addAssignment,
);

// PUT /api/admin/courses/modules/assignments/:id — update an assignment
router.put(
  "/modules/assignments/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  assignmentController.updateAssignment,
);

// DELETE /api/admin/courses/modules/assignments/:id — delete an assignment
router.delete(
  "/modules/assignments/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  assignmentController.deleteAssignment,
);

export const courseRouter = router;
