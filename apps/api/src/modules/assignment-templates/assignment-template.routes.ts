import { Router } from "express";
import { assignmentTemplateController } from "./assignment-template.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get("/", assignmentTemplateController.list);
router.get("/:id", assignmentTemplateController.getById);
router.post("/", assignmentTemplateController.create);
router.put("/:id", assignmentTemplateController.update);
router.delete("/:id", assignmentTemplateController.remove);

export const assignmentTemplateRouter = router;
