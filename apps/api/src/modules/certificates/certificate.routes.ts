import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { certificateController } from "./certificate.controller";

const router = Router();

router.use(requireAuth);

// GET /api/certificates — list student's certificates with claimable courses
router.get("/", certificateController.listMyCertificates);

// GET /api/certificates/package/:packageId/status — get package Special Exam status
router.get(
  "/package/:packageId/status",
  certificateController.getPackageStatus,
);

// POST /api/certificates/claim — claim a certificate for a completed course
router.post("/claim", certificateController.claim);

// POST /api/certificates/claim-package — claim a certificate for a completed package
router.post("/claim-package", certificateController.claimPackageCertificate);

// GET /api/certificates/:id/download — download certificate PDF
router.get("/:id/download", certificateController.download);

export const certificateRouter = router;
