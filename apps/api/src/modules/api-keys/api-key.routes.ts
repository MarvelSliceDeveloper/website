import { Router } from "express";
import { apiKeyController } from "./api-key.controller";
import {
  requireAuth,
  requireSuperAdmin,
} from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get("/", apiKeyController.list);
router.post("/", apiKeyController.create);
router.delete("/:id", apiKeyController.revoke);

export const apiKeyRouter = router;
