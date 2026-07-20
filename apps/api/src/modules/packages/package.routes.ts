import { Router } from "express";
import { packageController } from "./package.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);

// --- Helper endpoints ---

// GET /api/admin/packages/courses — list published courses for dropdown
router.get(
  "/courses",
  requireRole([UserRole.ADMIN]),
  packageController.getAvailableCourses,
);

// --- Package CRUD ---

// GET /api/admin/packages — list all packages
router.get("/", requireRole([UserRole.ADMIN]), packageController.list);

// POST /api/admin/packages — create a new package
router.post("/", requireRole([UserRole.ADMIN]), packageController.create);

// GET /api/admin/packages/:id — get package detail
router.get("/:id", requireRole([UserRole.ADMIN]), packageController.getById);

// PUT /api/admin/packages/:id — update package
router.put("/:id", requireRole([UserRole.ADMIN]), packageController.update);

// DELETE /api/admin/packages/:id — delete package
router.delete("/:id", requireRole([UserRole.ADMIN]), packageController.delete);

// PATCH /api/admin/packages/:id/status — update package status
router.patch(
  "/:id/status",
  requireRole([UserRole.ADMIN]),
  packageController.updateStatus,
);

// POST /api/admin/packages/:id/enroll — enroll student into package
router.post(
  "/:id/enroll",
  requireRole([UserRole.ADMIN]),
  packageController.enrollStudent,
);

export const packageRouter = router;

// --- Package Enrollments ---

const enrollmentRouter = Router();

enrollmentRouter.use(requireAuth);

// GET /api/admin/package-enrollments — list enrollments
enrollmentRouter.get(
  "/",
  requireRole([UserRole.ADMIN]),
  packageController.listEnrollments,
);

// PATCH /api/admin/package-enrollments/:id/approve — approve enrollment
enrollmentRouter.patch(
  "/:id/approve",
  requireRole([UserRole.ADMIN]),
  packageController.approveEnrollment,
);

// PATCH /api/admin/package-enrollments/:id/reject — reject enrollment
enrollmentRouter.patch(
  "/:id/reject",
  requireRole([UserRole.ADMIN]),
  packageController.rejectEnrollment,
);

export const packageEnrollmentRouter = enrollmentRouter;

// --- Public Package Routes (no auth required) ---

export const publicPackageRouter = Router();

// GET /api/packages/public — public catalogue of ACTIVE packages with prices
publicPackageRouter.get("/public", packageController.getPublicCatalogue);

// GET /api/packages/public/:slug — single ACTIVE package with full detail
publicPackageRouter.get("/public/:slug", packageController.getPublicPackage);
