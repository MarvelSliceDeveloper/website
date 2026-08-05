import { Router } from "express";
import { batchController } from "./batch.controller";
import { batchExtensionController } from "./batch-extension.controller";
import { batchMentorController } from "./batch-mentor.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

// All batch admin routes require authentication
router.use(requireAuth);

// --- Helper endpoints (for dropdowns) ---

// GET /api/admin/batches/instructors — list available instructors
router.get(
  "/instructors",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  batchController.getInstructors,
);

// GET /api/admin/batches/courses — list published courses
router.get(
  "/courses",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  batchController.getCourses,
);

// --- Batch CRUD ---

// GET /api/admin/batches — list all batches
router.get(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  batchController.list,
);

// POST /api/admin/batches — create a new batch
router.post("/", requireRole([UserRole.ADMIN]), batchController.create);

// GET /api/admin/batches/by-package/:packageId — get batches grouped by course for a package
router.get(
  "/by-package/:packageId",
  requireRole([UserRole.ADMIN]),
  batchController.getBatchesByPackage,
);

// GET /api/admin/batches/:id — get batch detail
router.get(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  batchController.getById,
);

// PUT /api/admin/batches/:id — update batch
router.put("/:id", requireRole([UserRole.ADMIN]), batchController.update);

// DELETE /api/admin/batches/:id — delete batch
router.delete("/:id", requireRole([UserRole.ADMIN]), batchController.delete);

// --- Course visibility management ---

// GET /api/admin/batches/:id/courses — list courses with visibility for this batch
router.get(
  "/:id/courses",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  batchController.getBatchCourses,
);

// PUT /api/admin/batches/:id/courses/:courseId/visibility — toggle course visibility
router.put(
  "/:id/courses/:courseId/visibility",
  requireRole([UserRole.ADMIN]),
  batchController.toggleVisibility,
);

// PUT /api/admin/batches/:id/courses/:courseId/exam-required — toggle course exam requirement
router.put(
  "/:id/courses/:courseId/exam-required",
  requireRole([UserRole.ADMIN]),
  batchController.toggleExamRequired,
);

// PUT /api/admin/batches/:id/exam-enabled — toggle batch-level exam enablement (controls certificate visibility)
router.put(
  "/:id/exam-enabled",
  requireRole([UserRole.ADMIN]),
  batchController.toggleExamEnabled,
);

// --- Extension management (batch-level) ---

// GET /api/admin/batches/:batchId/extensions — list extensions
router.get(
  "/:batchId/extensions",
  requireRole([UserRole.ADMIN]),
  batchExtensionController.list,
);

// POST /api/admin/batches/:batchId/extensions — grant extension for an assignment/quiz
router.post(
  "/:batchId/extensions",
  requireRole([UserRole.ADMIN]),
  batchExtensionController.create,
);

// DELETE /api/admin/batches/:batchId/extensions/:extensionId — revoke extension
router.delete(
  "/:batchId/extensions/:extensionId",
  requireRole([UserRole.ADMIN]),
  batchExtensionController.remove,
);

// --- Course mentor management ---

// GET /api/admin/batches/:batchId/mentors — list mentors for batch
router.get(
  "/:batchId/mentors",
  requireRole([UserRole.ADMIN]),
  batchMentorController.list,
);

// POST /api/admin/batches/:batchId/mentors — assign mentor to a course in the batch
router.post(
  "/:batchId/mentors",
  requireRole([UserRole.ADMIN]),
  batchMentorController.assign,
);

// DELETE /api/admin/batches/:batchId/mentors/:courseId — remove mentor from course
router.delete(
  "/:batchId/mentors/:courseId",
  requireRole([UserRole.ADMIN]),
  batchMentorController.remove,
);

// --- Student management ---

// GET /api/admin/batches/:id/students — list students in batch
router.get(
  "/:id/students",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  batchController.listStudents,
);

// POST /api/admin/batches/:id/students — add students to batch
router.post(
  "/:id/students",
  requireRole([UserRole.ADMIN]),
  batchController.addStudents,
);

// DELETE /api/admin/batches/:id/students/:uid — remove student
router.delete(
  "/:id/students/:uid",
  requireRole([UserRole.ADMIN]),
  batchController.removeStudent,
);

export const batchRouter = router;
