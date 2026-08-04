import { Router } from "express";
import { quizTemplateController } from "./quiz-template.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get("/", quizTemplateController.list);
router.get("/:id", quizTemplateController.getById);
router.post("/", quizTemplateController.create);
router.put("/:id", quizTemplateController.update);
router.delete("/:id", quizTemplateController.remove);

export const quizTemplateRouter = router;
