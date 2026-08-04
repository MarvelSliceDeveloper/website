import { Router } from "express";
import { permissionController } from "./permission.controller";
import {
  requireAuth,
  requireSuperAdmin,
} from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get("/", permissionController.list);
router.put("/", permissionController.update);

export const permissionRouter = router;
