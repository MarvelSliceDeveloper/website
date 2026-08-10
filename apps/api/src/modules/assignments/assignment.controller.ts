import { Response } from "express";
import { Readable } from "stream";
import { AuthRequest } from "../../middleware/auth.middleware";
import { AppError, handleControllerError } from "../../utils/errors";
import { ssrfSafeFetch } from "../../utils/ssrf";
import {
  assignmentService,
  CreateFileAssignmentSchema,
  GradeSubmissionSchema,
} from "./assignment.service";
import { buildAssignmentFileUrl } from "./assignment.upload";

export const assignmentController = {
  // POST /api/assignments — creates a new file-based assignment
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const data = CreateFileAssignmentSchema.parse(req.body);
      const assignment = await assignmentService.createFileAssignment(
        req.user.userId,
        data,
        data.questionPdfUrl,
      );
      return res.status(201).json({ assignment });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/assignments — lists assignments scoped by role
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { batchId, courseId } = req.query;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await assignmentService.listAssignments({
        batchId: batchId as string | undefined,
        courseId: courseId as string | undefined,
        instructorId:
          req.user.role === "INSTRUCTOR" ? req.user.userId : undefined,
        studentId: req.user.role === "STUDENT" ? req.user.userId : undefined,
        page,
        limit,
      });

      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/assignments/download-proxy — streams an external file (e.g. Google Drive)
  // through the API so the client can show real download progress without CORS issues.
  async downloadProxy(req: AuthRequest, res: Response) {
    const { log } = req as any;
    try {
      const rawUrl = req.query.url;
      if (typeof rawUrl !== "string" || !rawUrl) {
        throw new AppError(400, "Missing url query parameter");
      }
      let target: URL;
      try {
        target = new URL(rawUrl);
      } catch {
        throw new AppError(400, "Invalid url");
      }
      if (!/^https?:$/.test(target.protocol)) {
        throw new AppError(400, "Only http(s) URLs are allowed");
      }

      const upstream = await ssrfSafeFetch(rawUrl, {
        signal: AbortSignal.timeout(30_000),
      });
      if (!upstream.ok || !upstream.body) {
        throw new AppError(
          upstream.status || 502,
          `Remote server responded with ${upstream.status}`,
        );
      }

      const upstreamDisposition = upstream.headers.get("content-disposition");
      let filename = "assignment-question";
      if (upstreamDisposition) {
        const star = /filename\*=UTF-8''([^;]+)/i.exec(upstreamDisposition);
        const plain = /filename="?([^";]+)"?/i.exec(upstreamDisposition);
        if (star?.[1]) filename = decodeURIComponent(star[1]);
        else if (plain?.[1]) filename = plain[1];
      }
      filename = filename.replace(/[^\w.-]+/g, "_").slice(0, 150);

      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
      const contentLength = upstream.headers.get("content-length");

      res.status(200);
      res.setHeader("Content-Type", contentType);
      res.setHeader("X-Download-Filename", encodeURIComponent(filename));
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      );
      if (contentLength) res.setHeader("Content-Length", contentLength);
      res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Disposition, X-Download-Filename");

      const body = Readable.fromWeb(upstream.body as never);
      body.on("error", () => {
        if (!res.headersSent) res.status(502);
        res.end();
      });
      body.pipe(res);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/assignments/submissions/:submissionId/result — gets score breakdown
  async getSubmissionResult(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const result = await assignmentService.getSubmissionResult(
        req.params.submissionId,
        req.user.userId,
        req.user.role,
      );

      return res.status(200).json({ result });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/assignments/:id/submissions — lists all student submissions
  async listSubmissions(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      if (req.user.role !== "INSTRUCTOR" && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
      }

      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const result = await assignmentService.listSubmissionsForAssignment(
        req.params.id,
        req.user.userId,
        page,
        limit,
      );

      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/assignments/submissions/:submissionId/grade — manually grades a submission
  async grade(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      if (req.user.role !== "INSTRUCTOR" && req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied" });
      }

      const { grade, feedback } = GradeSubmissionSchema.parse(req.body);
      const submission = await assignmentService.gradeSubmission(
        req.user.userId,
        req.params.submissionId,
        grade,
        feedback,
      );

      if (process.env.AUTO_CERTIFICATE !== "false" && submission.studentId) {
        const { checkAndIssueForAssignment } =
          await import("../certificates/certificate-completion.service");
        checkAndIssueForAssignment(
          submission.assignmentId,
          submission.studentId,
        ).catch((err: unknown) =>
          (req as any).log?.error?.("[certificate] Auto-issue failed:", err),
        );
      }

      return res.status(200).json({ submission });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/assignments/upload-pdf — uploads a question PDF
  async uploadPdf(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }
      const fileUrl = buildAssignmentFileUrl(req, req.file.filename);
      return res.status(200).json({ fileUrl });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/assignments/:id/submit/file — submits a file answer for an assignment
  async submitFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });
      if (req.user.role !== "STUDENT") {
        return res
          .status(403)
          .json({ error: "Only students can submit assignments" });
      }
      if (!req.file) {
        return res.status(400).json({ error: "No answer file uploaded" });
      }

      const comment = req.body.comment?.trim() || undefined;
      const fileUrl = buildAssignmentFileUrl(req, req.file.filename);
      const submission = await assignmentService.submitFileAnswer(
        req.user.userId,
        req.params.id,
        fileUrl,
        comment,
      );

      return res.status(200).json({ submission });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
