import { Router } from "express";
import { twoFactorController } from "./2fa.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.post("/setup", requireAuth, twoFactorController.setup);
router.post("/verify", requireAuth, twoFactorController.verify);
router.post("/disable", requireAuth, twoFactorController.disable);
router.get("/status", requireAuth, twoFactorController.status);
router.post("/challenge", twoFactorController.challenge);

export const twoFactorRouter = router;
