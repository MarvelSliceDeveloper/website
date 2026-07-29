import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Request } from "express";
import multer from "multer";

export const PHOTO_FIELD = "photo";
export const RESUME_FIELD = "resume";
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB

const apiRoot = __dirname.includes("dist")
  ? path.resolve(__dirname, "..")
  : path.resolve(__dirname, "..", "..", "..");

const uploadsRoot = path.join(apiRoot, "uploads");
const instructorUploadsDir = path.join(uploadsRoot, "instructors");

fs.mkdirSync(instructorUploadsDir, { recursive: true });

const photoMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const resumeMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, instructorUploadsDir),
  filename: (_req, file, cb) => {
    const prefix = file.fieldname === PHOTO_FIELD ? "photo" : "resume";
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${prefix}_${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (file.fieldname === PHOTO_FIELD) {
    if (!photoMimeTypes.has(file.mimetype)) {
      return cb(new Error("Profile photo must be JPEG, PNG, or WebP."));
    }
  } else if (file.fieldname === RESUME_FIELD) {
    if (!resumeMimeTypes.has(file.mimetype)) {
      return cb(
        new Error("Resume must be PDF, DOC, DOCX, JPEG, or PNG."),
      );
    }
  }
  return cb(null, true);
}

export const uploadInstructorFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: Math.max(MAX_PHOTO_BYTES, MAX_RESUME_BYTES) },
}).fields([
  { name: PHOTO_FIELD, maxCount: 1 },
  { name: RESUME_FIELD, maxCount: 1 },
]);

export function buildInstructorFileUrl(req: Request, filename: string) {
  const host = req.get("host");
  const protocol = req.protocol;
  return `${protocol}://${host}/uploads/instructors/${filename}`;
}
