import { Router, Request, Response, NextFunction } from "express";
import { courseController } from "./course.controller";
import { moduleController } from "./module.controller";
import { lessonController } from "./lesson.controller";
import { quizController } from "./quiz.controller";
import { assignmentController } from "./assignment.controller";
import { practicalController } from "./practical.controller";
import { uploadCourseThumbnail } from "./course.upload";
import { uploadLessonResource, uploadPracticalPdf, uploadCertificationPdf, buildCertificationPdfUrl } from "./modules.upload";
import { requireAuth, requireRole, AuthRequest } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { prisma } from "../../utils/prisma";
import { moduleService } from "./module.service";
import { courseService } from "./course.service";
import { handleControllerError } from "../../utils/errors";

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

// PATCH /api/admin/courses/modules/:moduleId/content/reorder — cross-type reorder
router.patch(
  "/modules/:moduleId/content/reorder",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  moduleController.reorderContent,
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

// PATCH /api/admin/courses/lessons/:lessonId/resources/reorder — reorder resources
router.patch(
  "/lessons/:lessonId/resources/reorder",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  lessonController.reorderResources,
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

// PATCH /api/admin/courses/modules/:moduleId/quizzes/reorder — reorder quizzes
router.patch(
  "/modules/:moduleId/quizzes/reorder",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  quizController.reorderQuizzes,
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

// PATCH /api/admin/courses/modules/:moduleId/assignments/reorder — reorder assignments
router.patch(
  "/modules/:moduleId/assignments/reorder",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  assignmentController.reorderAssignments,
);

// --- Practical Routes ---

// POST /api/admin/courses/modules/:moduleId/practicals — add a practical to a module
router.post(
  "/modules/:moduleId/practicals",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  practicalController.addPractical,
);

// PUT /api/admin/courses/modules/practicals/:id — update a practical
router.put(
  "/modules/practicals/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  practicalController.updatePractical,
);

// DELETE /api/admin/courses/modules/practicals/:id — delete a practical
router.delete(
  "/modules/practicals/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  practicalController.deletePractical,
);

// POST /api/admin/courses/:courseId/practicals/pdf — upload a PDF for a practical
router.post(
  "/:courseId/practicals/pdf",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  (req: Request, res: Response, next: NextFunction) =>
    uploadPracticalPdf(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      return next();
    }),
  practicalController.uploadPdf,
);

// POST /api/admin/courses/:courseId/practicals/:practicalId/resources — upload resource to a practical
router.post(
  "/:courseId/practicals/:practicalId/resources",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  (req: Request, res: Response, next: NextFunction) =>
    uploadLessonResource(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      return next();
    }),
  practicalController.uploadResource,
);

// DELETE /api/admin/courses/practicals/:practicalId/resources/:resourceId — delete resource from practical
router.delete(
  "/practicals/:practicalId/resources/:resourceId",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  practicalController.deleteResource,
);

// --- Certification Module Routes ---

// GET /api/admin/courses/:courseId/certification — get certification module + quiz
router.get(
  "/:courseId/certification",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  async (req: AuthRequest, res: Response) => {
    try {
      const courseId = await courseService.resolveCourseId(
        req.params.courseId,
      );
      const certModule = await moduleService.getCertificationModule(
        courseId,
      );
      return res.json({
        module: certModule
          ? { id: certModule.id, title: certModule.title }
          : null,
        quiz: certModule?.quizzes[0]
          ? {
              id: certModule.quizzes[0].id,
              title: certModule.quizzes[0].title,
              passingScore: certModule.quizzes[0].passingScore,
              timeLimitMin: certModule.quizzes[0].timeLimitMin,
              hasMcq: certModule.quizzes[0].hasMcq,
              hasAssignment: certModule.quizzes[0].hasAssignment,
              assignmentInstructions:
                certModule.quizzes[0].assignmentInstructions,
              assignmentPdfUrl:
                certModule.quizzes[0].assignmentPdfUrl,
              questionCount: certModule.quizzes[0].questions.length,
              questions: certModule.quizzes[0].questions.map((q) => ({
                id: q.id,
                text: q.text,
                options: (q.options as Array<{
                  label: string;
                  isCorrect: boolean;
                }>) ?? [],
              })),
            }
          : null,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
);

// PUT /api/admin/courses/:courseId/certification — update certification module settings
router.put(
  "/:courseId/certification",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  async (req: AuthRequest, res: Response) => {
    try {
      const courseId = await courseService.resolveCourseId(
        req.params.courseId,
      );
      const certModule = await moduleService.ensureCertificationModule(
        courseId,
      );
      const updated = await moduleService.updateCertificationModule(
        courseId,
        req.body,
      );
      return res.json(updated || certModule);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
);

// POST /api/admin/courses/:courseId/certification/pdf — upload assignment PDF for certification exam
router.post(
  "/:courseId/certification/pdf",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  (req: Request, res: Response, next: NextFunction) =>
    uploadCertificationPdf(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      return next();
    }),
  async (req: AuthRequest, res: Response) => {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }
      const courseId = await courseService.resolveCourseId(
        req.params.courseId,
      );
      const url = buildCertificationPdfUrl(
        req,
        courseId,
        file.filename,
      );

      // Update the certification quiz's assignmentPdfUrl
      const certModule = await moduleService.getCertificationModule(
        courseId,
      );
      if (certModule?.quizzes[0]) {
        await prisma.quiz.update({
          where: { id: certModule.quizzes[0].id },
          data: { assignmentPdfUrl: url },
        });
      }

      return res.json({ url });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
);

export const courseRouter = router;
