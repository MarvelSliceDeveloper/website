import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { Request } from "express";
import multer from "multer";
import { ensureUploadsDir } from "../../utils/uploads";

const MODULE_RESOURCE_FIELD = "resource";
const MAX_RESOURCE_BYTES = 50 * 1024 * 1024; // 50MB

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const extensionByMime: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const modulesUploadsDir = ensureUploadsDir("modules");

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const courseId = req.params.courseId || "unknown";
    const moduleId = req.params.id || "unknown";
    const dir = path.join(modulesUploadsDir, courseId, moduleId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = extensionByMime[file.mimetype] || ".bin";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(
      new Error(
        "Only PDF, DOCX, PPTX, XLSX, JPG, PNG, and WebP files are allowed.",
      ),
    );
  }
  return cb(null, true);
};

const lessonStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const courseId = req.params.courseId || "unknown";
    const lessonId = req.params.lessonId || "unknown";
    const dir = path.join(modulesUploadsDir, courseId, "lessons", lessonId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = extensionByMime[file.mimetype] || ".bin";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadLessonResource = multer({
  storage: lessonStorage,
  fileFilter,
  limits: { fileSize: MAX_RESOURCE_BYTES },
}).single(MODULE_RESOURCE_FIELD);

const practicalPdfStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const courseId = req.params.courseId || "unknown";
    const dir = path.join(
      ensureUploadsDir("courses"),
      courseId,
      "practicals",
      "pdfs",
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = extensionByMime[file.mimetype] || ".pdf";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const pdfFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    return cb(new Error("Only PDF files are allowed."));
  }
  return cb(null, true);
};

export const uploadPracticalPdf = multer({
  storage: practicalPdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: MAX_RESOURCE_BYTES },
}).single("pdf");

export function buildLessonResourceUrl(
  req: Request,
  courseId: string,
  lessonId: string,
  filename: string,
) {
  const host = req.get("host");
  const protocol = req.protocol;
  const webUrl =
    process.env.WEB_URL ||
    `${protocol}://${host || "localhost:3000"}`;
  return `${webUrl.replace(/\/$/, "")}/uploads/modules/${courseId}/lessons/${lessonId}/${filename}`;
}

const certPdfStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const courseId = req.params.courseId || "unknown";
    const dir = path.join(
      ensureUploadsDir("courses"),
      courseId,
      "certification",
      "pdfs",
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = extensionByMime[file.mimetype] || ".pdf";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadCertificationPdf = multer({
  storage: certPdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: MAX_RESOURCE_BYTES },
}).single("pdf");

export function buildCertificationPdfUrl(
  req: Request,
  courseId: string,
  filename: string,
) {
  const host = req.get("host");
  const protocol = req.protocol;
  const webUrl =
    process.env.WEB_URL ||
    `${protocol}://${host || "localhost:3000"}`;
  return `${webUrl.replace(/\/$/, "")}/uploads/courses/${courseId}/certification/pdfs/${filename}`;
}
