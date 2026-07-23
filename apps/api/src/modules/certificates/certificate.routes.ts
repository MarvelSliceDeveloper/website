import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { certificateController } from "./certificate.controller";

const router = Router();

router.use(requireAuth);

// GET /api/certificates — list student's certificates with claimable courses
router.get("/", certificateController.listMyCertificates);

// POST /api/certificates/claim — claim a certificate for a completed course
router.post("/claim", certificateController.claim);

// GET /api/certificates/:id/download — download certificate PDF
router.get("/:id/download", certificateController.download);

export const certificateRouter = router;
