import { Router, type Response } from "express";
import { apiKeyController } from "./api-key.controller";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get("/", apiKeyController.list);
router.post("/", apiKeyController.create);
router.delete("/:id", apiKeyController.revoke);
router.patch("/:id", apiKeyController.update);

// GET /api/admin/api-keys/youtube-status — check if YouTube API key is configured
router.get("/youtube-status", (_req: AuthRequest, res: Response) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  return res.json({
    configured: !!apiKey,
    masked: apiKey
      ? apiKey.slice(0, 4) + "..." + apiKey.slice(-4)
      : null,
  });
});

export const apiKeyRouter = router;
