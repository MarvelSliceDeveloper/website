import { Router } from "express";
import { assignmentController } from "./assignment.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { uploadQuestionPdf, uploadAnswerFile } from "./assignment.upload";

const router = Router();

// All assignment routes require authentication
router.use(requireAuth);

// POST /api/assignments — create a new file-based assignment (admins + instructors)
router.post(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  assignmentController.create,
);

// POST /api/assignments/upload-pdf — upload question PDF (admins + instructors)
router.post(
  "/upload-pdf",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  uploadQuestionPdf,
  assignmentController.uploadPdf,
);

// GET /api/assignments — list assignments
router.get("/", assignmentController.list);

// GET /api/assignments/download-proxy — stream external files (e.g. Google Drive)
// with real download progress; must be registered before /:id routes.
router.get("/download-proxy", assignmentController.downloadProxy);

// POST /api/assignments/:id/submit/file — submit answer file (student only)
router.post(
  "/:id/submit/file",
  requireRole([UserRole.STUDENT]),
  uploadAnswerFile,
  assignmentController.submitFile,
);

// GET /api/assignments/submissions/:submissionId/result — get graded submission results
router.get(
  "/submissions/:submissionId/result",
  assignmentController.getSubmissionResult,
);

// GET /api/assignments/:id/submissions — list submissions (admins + instructors)
router.get(
  "/:id/submissions",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  assignmentController.listSubmissions,
);

// POST /api/assignments/submissions/:submissionId/grade — manually grade/feedback a submission (admins + instructors)
router.post(
  "/submissions/:submissionId/grade",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  assignmentController.grade,
);

export const assignmentRouter = router;
