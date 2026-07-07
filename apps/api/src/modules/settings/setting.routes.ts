import { Router } from "express";
import { settingController } from "./setting.controller";
import {
  requireAuth,
  requireSuperAdmin,
} from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get("/", settingController.list);
router.put("/:key", settingController.update);

export const settingRouter = router;
