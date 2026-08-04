import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { notificationController } from "./notification.controller";
import {
  uploadNotificationAttachment,
  buildAttachmentUrl,
} from "./notification.upload";

const router = Router();

router.use(requireAuth);

router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/read-all", notificationController.markAllAsRead);
router.delete("/:id", notificationController.delete);
router.post("/clear-read", notificationController.clearRead);
router.get("/preferences", notificationController.getPreferences);
router.patch("/preferences", notificationController.updatePreference);
router.post(
  "/send",
  requireRole([UserRole.ADMIN, UserRole.INSTRUCTOR]),
  uploadNotificationAttachment,
  (req, res, next) => {
    // Store attachment file info on req.body for the controller
    if (req.file) {
      req.body._attachmentUrl = buildAttachmentUrl(req, req.file.filename);
      req.body._attachmentName = req.file.originalname;
    }
    next();
  },
  notificationController.sendNotification,
);

export const notificationRouter = router;
