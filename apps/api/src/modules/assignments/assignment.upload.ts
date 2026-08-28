import crypto from "crypto";
import path from "path";
import type { Request } from "express";
import multer from "multer";
import { ensureUploadsDir } from "../../utils/uploads";

// ── Constants ────────────────────────────────────────────────────────────────

export const QUESTION_PDF_FIELD = "questionPdf";
export const ANSWER_FILE_FIELD = "answerFile";
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_ANSWER_BYTES = 25 * 1024 * 1024; // 25 MB

// ── Directories ──────────────────────────────────────────────────────────────

const assignmentUploadsDir = ensureUploadsDir("assignments");

// ── Instructor PDF Upload (question paper) ───────────────────────────────────

const pdfMimeTypes = new Set(["application/pdf"]);

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, assignmentUploadsDir),
  filename: (_req, file, cb) => {
    cb(null, `question_${crypto.randomUUID()}.pdf`);
  },
});

const pdfFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!pdfMimeTypes.has(file.mimetype)) {
    return cb(new Error("Only PDF files are allowed for question papers."));
  }
  return cb(null, true);
};

export const uploadQuestionPdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: MAX_PDF_BYTES },
}).single(QUESTION_PDF_FIELD);

// ── Student Answer File Upload ───────────────────────────────────────────────

const answerMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "text/plain",
]);

const answerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, assignmentUploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `answer_${crypto.randomUUID()}${ext}`);
  },
});

const answerFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!answerMimeTypes.has(file.mimetype)) {
    return cb(
      new Error(
        "File type not allowed. Accepted: PDF, images, Word docs, ZIP, or plain text.",
      ),
    );
  }
  return cb(null, true);
};

export const uploadAnswerFile = multer({
  storage: answerStorage,
  fileFilter: answerFilter,
  limits: { fileSize: MAX_ANSWER_BYTES },
}).single(ANSWER_FILE_FIELD);

// ── URL builders ─────────────────────────────────────────────────────────────

export function buildAssignmentFileUrl(req: Request, filename: string) {
  const host = req.get("host");
  const protocol = req.protocol;
  const webUrl =
    process.env.WEB_URL ||
    `${protocol}://${host || "localhost:3000"}`;
  return `${webUrl.replace(/\/$/, "")}/uploads/assignments/${filename}`;
}
