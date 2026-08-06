import { Router } from "express";
import multer from "multer";
import { sessionController } from "./session.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// All session routes require authentication
router.use(requireAuth);

// GET /api/sessions/template — download Excel template
router.get(
  "/template",
  requireRole([UserRole.ADMIN]),
  sessionController.downloadTemplate,
);

// POST /api/sessions/bulk-upload — bulk create sessions from Excel
router.post(
  "/bulk-upload",
  requireRole([UserRole.ADMIN]),
  upload.single("file"),
  sessionController.bulkUpload,
);

// POST /api/sessions — create a new session (admins + instructors)
router.post(
  "/",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  sessionController.create,
);

// GET /api/sessions — list sessions
router.get("/", sessionController.list);

// GET /api/sessions/:id — get session details
router.get("/:id", sessionController.getById);

// PATCH /api/sessions/:id — update a session (admins or assigned instructor)
router.patch(
  "/:id",
  requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  sessionController.update,
);

// DELETE /api/sessions/:id — cancel a session (admins or assigned instructor)
router.delete(
  "/:id",
  requireRole([UserRole.INSTRUCTOR, UserRole.ADMIN]),
  sessionController.cancel,
);

export const sessionRouter = router;
