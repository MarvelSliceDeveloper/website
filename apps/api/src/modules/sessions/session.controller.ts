import { Response } from "express";
import * as XLSX from "xlsx";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import {
  sessionService,
  CreateSessionSchema,
  UpdateSessionSchema,
} from "./session.service";

export const sessionController = {
  // POST /api/sessions — creates a new live session
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const data = CreateSessionSchema.parse(req.body);
      const session = await sessionService.createSession(req.user.userId, data);

      return res.status(201).json({ session });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/sessions — lists sessions with filters
  async list(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { batchId, courseId, status, page, limit } = req.query;

      // Only filter by instructorId for INSTRUCTOR role — admins should see all sessions
      const sessions = await sessionService.listSessions({
        batchId: batchId as string | undefined,
        courseId: courseId as string | undefined,
        status: status as
          | "scheduled"
          | "live"
          | "completed"
          | "cancelled"
          | undefined,
        instructorId:
          req.user.role === "INSTRUCTOR" ? req.user.userId : undefined,
        studentId: req.user.role === "STUDENT" ? req.user.userId : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      return res.status(200).json({ sessions });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/sessions/:id — gets a session by ID
  async getById(req: AuthRequest, res: Response) {
    try {
      const session = await sessionService.getSession(req.params.id);
      return res.status(200).json({ session });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // PATCH /api/sessions/:id — updates a session
  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const data = UpdateSessionSchema.parse(req.body);
      const session = await sessionService.updateSession(
        req.params.id,
        req.user.userId,
        data,
      );

      return res.status(200).json({ session });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // DELETE /api/sessions/:id — cancels or deletes a session
  async cancel(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const session = await sessionService.cancelSession(
        req.params.id,
        req.user.userId,
      );
      const isDeleted =
        req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN";
      return res.status(200).json({
        message: isDeleted ? "Session deleted" : "Session cancelled",
        session,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // POST /api/sessions/bulk-upload — parse Excel and create sessions
  async bulkUpload(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ error: "Excel file has no sheets" });
      }

      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
      }) as Record<string, unknown>[];

      if (rows.length === 0) {
        return res.status(400).json({ error: "Excel sheet is empty" });
      }

      const expectedHeaders = [
        "batchId",
        "title",
        "startDateTime",
        "endDateTime",
      ];
      const actualHeaders = Object.keys(rows[0]);
      const missingHeaders = expectedHeaders.filter(
        (h) => !actualHeaders.includes(h),
      );

      if (missingHeaders.length > 0) {
        return res.status(400).json({
          error: `Missing required columns: ${missingHeaders.join(", ")}. Required columns: batchId, title, startDateTime, endDateTime. Optional: moduleId, customJoinUrl, instructorOverride`,
        });
      }

      const created: unknown[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const batchId = String(row.batchId ?? "").trim();
        const title = String(row.title ?? "").trim();
        const startDateTime = String(row.startDateTime ?? "").trim();
        const endDateTime = String(row.endDateTime ?? "").trim();

        if (!batchId || !title || !startDateTime || !endDateTime) {
          errors.push(
            `Row ${i + 2}: Missing required fields (batchId, title, startDateTime, endDateTime)`,
          );
          continue;
        }

        try {
          const parseResult = CreateSessionSchema.safeParse({
            batchId,
            courseId: row.courseId ? String(row.courseId).trim() : undefined,
            moduleId: row.moduleId ? String(row.moduleId).trim() : undefined,
            title,
            startDateTime,
            endDateTime,
            customJoinUrl: row.customJoinUrl
              ? String(row.customJoinUrl).trim()
              : undefined,
            instructorOverride: row.instructorOverride
              ? String(row.instructorOverride).trim()
              : undefined,
          });

          if (!parseResult.success) {
            errors.push(
              `Row ${i + 2}: ${parseResult.error.errors.map((e) => e.message).join(", ")}`,
            );
            continue;
          }

          const session = await sessionService.createSession(
            req.user.userId,
            parseResult.data,
          );
          created.push(session);
        } catch (err: unknown) {
          errors.push(
            `Row ${i + 2}: ${err instanceof Error ? err.message : "Failed to create session"}`,
          );
        }
      }

      return res.status(201).json({
        created: created.length,
        errors,
        sessions: created,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/sessions/template — download an Excel template
  async downloadTemplate(req: AuthRequest, res: Response) {
    try {
      const ws = XLSX.utils.json_to_sheet([
        {
          batchId: "batch_abc123",
          title: "Session 1: Orientation & Setup",
          startDateTime: "2025-01-15T10:00:00",
          endDateTime: "2025-01-15T11:00:00",
          moduleId: "module_xyz",
          customJoinUrl: "",
          instructorOverride: "",
        },
        {
          batchId: "batch_abc123",
          title: "Session 2: Q&A",
          startDateTime: "2025-01-22T10:00:00",
          endDateTime: "2025-01-22T11:30:00",
          moduleId: "",
          customJoinUrl: "",
          instructorOverride: "user_instructor123",
        },
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sessions");

      const buffer = XLSX.write(wb, {
        type: "buffer",
        bookType: "xlsx",
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="sessions-template.xlsx"',
      );
      res.send(buffer);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
