import crypto from "crypto";
import type { Request } from "express";
import multer from "multer";
import { ensureUploadsDir } from "../../utils/uploads";

export const COURSE_THUMBNAIL_FIELD = "thumbnail";
export const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const courseUploadsDir = ensureUploadsDir("courses");

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
  const webUrl = process.env.WEB_URL?.trim();
  if (webUrl) {
    return `${webUrl.replace(/\/$/, "")}/uploads/courses/${filename}`;
  }
  // Behind 1-2 reverse proxies (host Apache -> Docker nginx -> api) the
  // original proto is in X-Forwarded-Proto (may be "https, http" chain).
  const forwardedProto = (req.headers["x-forwarded-proto"] as string) || "";
  const proto =
    forwardedProto.split(",")[0]?.trim() || req.protocol || "https";
  const host = req.get("host") || "lms.marvelslice.com";
  return `${proto}://${host.replace(/\/$/, "")}/uploads/courses/${filename}`;
}
