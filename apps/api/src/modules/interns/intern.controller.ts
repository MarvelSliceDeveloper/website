import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { internService } from "./intern.service";
import { notificationService } from "../notifications/notification.service";
import { googleSheetsService, type SavedSheet } from "../../services/google-sheets.service";
import { handleControllerError } from "../../utils/errors";

export const internController = {
  // Public — returns internship program details (flat fee, name)
  async getInternshipProgram(_req: AuthRequest, res: Response) {
    try {
      const program = await internService.getInternshipProgram();
      if (!program) {
        return res
          .status(200)
          .json({ program: null, message: "Internship applications are closed." });
      }
      return res.status(200).json({ program });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (_req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Public — internship fields of choice (Web Development, Backend, ...)
  async getInternFields(_req: AuthRequest, res: Response) {
    try {
      const fields = await internService.getInternFields();
      return res.status(200).json({ fields });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (_req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Public — create intern application (one field) + Razorpay order
  async createInternOrder(req: AuthRequest, res: Response) {
    try {
      const { name, phone, email, designation, fieldId } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "name is required" });
      }
      if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "email is required" });
      }
      if (!["WORKING", "STUDYING"].includes(designation)) {
        return res
          .status(400)
          .json({ error: "designation must be WORKING or STUDYING" });
      }
      if (!fieldId || typeof fieldId !== "string") {
        return res
          .status(400)
          .json({ error: "fieldId is required — each intern selects one field" });
      }

      const result = await internService.createInternOrder({
        name: name.trim(),
        phone: typeof phone === "string" ? phone.trim() : undefined,
        email: email.trim(),
        designation,
        fieldId,
      });

      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — list interns
  async listInterns(req: AuthRequest, res: Response) {
    try {
      const { page, limit, fieldId } = req.query;
      const result = await internService.listInterns({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        fieldId: typeof fieldId === "string" ? fieldId : undefined,
      });
      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — list internship fields (field management)
  async listInternFields(_req: AuthRequest, res: Response) {
    try {
      const fields = await internService.listInternFields();
      return res.status(200).json({ fields });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (_req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — create internship field
  async createInternField(req: AuthRequest, res: Response) {
    try {
      const { name, description, fee, isActive, order } = req.body;
      const field = await internService.createInternField({
        name,
        description,
        fee,
        isActive,
        order,
      });
      return res.status(201).json(field);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — update internship field
  async updateInternField(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, fee, isActive, order } = req.body;
      const field = await internService.updateInternField(id, {
        name,
        description,
        fee,
        isActive,
        order,
      });
      return res.status(200).json(field);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — delete internship field
  async deleteInternField(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const field = await internService.deleteInternField(id, req.user!.userId);
      return res.status(200).json(field);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — update flat internship program fee
  async updateProgramFee(req: AuthRequest, res: Response) {
    try {
      const { fee } = req.body;
      if (
        typeof fee !== "number" ||
        !Number.isInteger(fee) ||
        fee < 0
      ) {
        return res
          .status(400)
          .json({ error: "fee must be a non-negative integer (paise)" });
      }
      const program = await internService.updateProgramFee(fee);
      return res.status(200).json(program);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — create intern session (online class), then notify interns
  async createInternSession(req: AuthRequest, res: Response) {
    try {
      const { title, description, scheduledAt, scheduledEndAt, joinUrl, targetFieldId } = req.body;

      if (!title || typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "title is required" });
      }
      if (!scheduledAt || isNaN(new Date(scheduledAt).getTime())) {
        return res.status(400).json({ error: "scheduledAt is a required valid date" });
      }

      const session = await internService.createInternSession({
        title: title.trim(),
        description,
        scheduledAt,
        scheduledEndAt,
        joinUrl,
        targetFieldId,
        createdBy: req.user!.userId,
      });

      // Fire-and-forget notification to interns (all or by field)
      notificationService
        .notifyInternSessionScheduled(session.id)
        .catch((err: Error) =>
          console.error("[interns] Failed to notify interns:", err),
        );

      return res.status(201).json(session);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — list intern sessions
  async listInternSessions(req: AuthRequest, res: Response) {
    try {
      const { page, limit, status } = req.query;
      const result = await internService.listInternSessions({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: typeof status === "string" ? status : undefined,
      });
      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — delete intern session
  async deleteInternSession(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const session = await internService.deleteInternSession(id, req.user!.userId);
      return res.status(200).json(session);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — list saved assignment-tracker sheet IDs
  async listSavedSheets(_req: AuthRequest, res: Response) {
    try {
      const sheets = await googleSheetsService.getSavedSheets();
      return res.status(200).json({ sheets });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (_req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — save a new assignment-tracker sheet ID (with optional gid)
  async saveSheet(req: AuthRequest, res: Response) {
    try {
      const { id, name, gid } = req.body;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Sheet ID is required" });
      }
      const sheets = await googleSheetsService.saveSheet({
        id: id.trim(),
        name: (name || `Sheet ${id.slice(-8)}`).trim(),
        gid: typeof gid === "string" ? gid : undefined,
      });
      return res.status(200).json({ sheets });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — delete a saved sheet ID (optionally narrow by gid)
  async deleteSavedSheet(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { gid } = req.query;
      const sheetGid = typeof gid === "string" ? gid : undefined;
      const sheets = await googleSheetsService.removeSheet(id, sheetGid);
      return res.status(200).json({ sheets });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
// REPLACE these two handlers inside your existing intern.controller.ts
// (the rest of the file — listInterns, createInternField, etc. — stays
// exactly as it is; only getAssignmentSheet and listSheetTabs change).
// ─────────────────────────────────────────────────────────────────────────

  // Admin — fetch assignment tracker data for a given sheet ID + optional gid
  async getAssignmentSheet(req: AuthRequest, res: Response) {
    try {
      const { sheetId, gid } = req.query;
      const id = typeof sheetId === "string" ? sheetId.trim() : null;

      if (!id) {
        return res.status(400).json({
          error: "sheetId query parameter is required",
        });
      }

      // If no gid param, try to find saved sheet's gid
      let sheetGid = typeof gid === "string" ? gid : "0";
      if (!gid) {
        const saved = await googleSheetsService.getSavedSheets();
        const match = saved.find((s) => s.id === id);
        if (match?.gid) sheetGid = match.gid;
      }

      const data = await googleSheetsService.fetchSheet(id, sheetGid);
      return res.status(200).json(data);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin — list available tabs (gid + real title) in a spreadsheet, plus
  // the spreadsheet's own title.
  async listSheetTabs(req: AuthRequest, res: Response) {
    try {
      const { sheetId } = req.query;
      const id = typeof sheetId === "string" ? sheetId.trim() : null;
      if (!id) {
        return res.status(400).json({ error: "sheetId query parameter is required" });
      }
      const metadata = await googleSheetsService.listSheetTabs(id);
      return res.status(200).json(metadata); // { spreadsheetTitle, tabs: [{gid,title}] }
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};