import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
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

      const { grade, feedback, latePenaltyPercent } = GradeSubmissionSchema.parse(req.body);
      const submission = await assignmentService.gradeSubmission(
        req.user.userId,
        req.params.submissionId,
        grade,
        feedback,
        latePenaltyPercent,
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
