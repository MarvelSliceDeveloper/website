import { Router } from "express";
import { catalogueController } from "./catalogue.controller";
import { cacheMiddleware } from "../../middleware/cache.middleware";

const router = Router();

// Public — no auth, cached with ETag & stale-while-revalidate for fast delivery
router.get(
  "/",
  cacheMiddleware({ maxAge: 120, staleWhileRevalidate: true }),
  catalogueController.list,
);
router.get(
  "/:id/batches",
  cacheMiddleware({ maxAge: 60, staleWhileRevalidate: true }),
  catalogueController.listBatches,
);
router.get(
  "/:slug",
  cacheMiddleware({ maxAge: 120, staleWhileRevalidate: true }),
  catalogueController.getBySlug,
);
router.post("/:id/checkout", catalogueController.checkout);
router.post("/:id/verify", catalogueController.verify);
router.post("/:id/enroll", catalogueController.enroll);

export const catalogueRouter = router;
