import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Request } from "express";
import multer from "multer";

export const NOTIFICATION_ATTACHMENT_FIELD = "attachment";
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB

const apiRoot = __dirname.includes("dist")
  ? path.resolve(__dirname, "..")
  : path.resolve(__dirname, "..", "..", "..");

const uploadsRoot = path.join(apiRoot, "uploads");
const notificationUploadsDir = path.join(uploadsRoot, "notifications");

fs.mkdirSync(notificationUploadsDir, { recursive: true });

// Allow zip + PDF (like assignment deliverables)
const attachmentMimeTypes = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream", // some browsers send this for .zip/.pdf
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, notificationUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `notif_${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".zip" || ext === ".pdf") {
    return cb(null, true);
  }
  if (!attachmentMimeTypes.has(file.mimetype)) {
    return cb(new Error("Only ZIP or PDF files are allowed as attachments."));
  }
  return cb(null, true);
};

export const uploadNotificationAttachment = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_ATTACHMENT_BYTES },
}).single(NOTIFICATION_ATTACHMENT_FIELD);

export function buildAttachmentUrl(req: Request, filename: string) {
  const host = req.get("host");
  const protocol = req.protocol;
  return `${protocol}://${host}/uploads/notifications/${filename}`;
}
