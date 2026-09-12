import { Router } from "express";
import { catalogueController } from "./catalogue.controller";

const router = Router();

// Public — no auth, will be mounted before CSRF? CSRF already exempt for checkout routes via app.ts patch below
router.get("/", catalogueController.list);
router.get("/:id/batches", catalogueController.listBatches);
router.get("/:slug", catalogueController.getBySlug);
router.post("/:id/checkout", catalogueController.checkout);
router.post("/:id/verify", catalogueController.verify);
router.post("/:id/enroll", catalogueController.enroll);

export const catalogueRouter = router;
