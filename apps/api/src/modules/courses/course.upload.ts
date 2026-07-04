import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Request } from "express";
import multer from "multer";

export const COURSE_THUMBNAIL_FIELD = "thumbnail";
export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const apiRoot = __dirname.includes("dist")
  ? path.resolve(__dirname, "..")
  : path.resolve(__dirname, "..", "..", "..");

const uploadsRoot = path.join(apiRoot, "uploads");
const courseUploadsDir = path.join(uploadsRoot, "courses");

fs.mkdirSync(courseUploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, courseUploadsDir),
  filename: (_req, file, cb) => {
    const ext = extensionByMime[file.mimetype] || ".bin";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, and WebP images are allowed."));
  }
  return cb(null, true);
};

export const uploadCourseThumbnail = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_THUMBNAIL_BYTES },
}).single(COURSE_THUMBNAIL_FIELD);

export function buildCourseThumbnailUrl(req: Request, filename: string) {
  const host = req.get("host");
  const protocol = req.protocol;
  return `${protocol}://${host}/uploads/courses/${filename}`;
}
