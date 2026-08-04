import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { certificateService } from "./certificate.service";
import { handleControllerError } from "../../utils/errors";
import {
  getPackageSpecialExamProgress,
  checkAndIssuePackageCertificate,
} from "./certificate-completion.service";

export const certificateController = {
  // Lists all certificates and claimable ones for the user
  async listMyCertificates(req: AuthRequest, res: Response) {
    try {
      const data = await certificateService.getMyCertificates(req.user!.userId);
      return res.json(data);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Claims a certificate for a completed course
  async claim(req: AuthRequest, res: Response) {
    try {
      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({ error: "courseId is required" });
      }

      const certificate = await certificateService.claimCertificate(
        req.user!.userId,
        courseId,
      );
      return res.status(201).json({ certificate });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Gets package Special Exam progress and eligibility
  async getPackageStatus(req: AuthRequest, res: Response) {
    try {
      const { packageId } = req.params;
      const { batchId } = req.query;
      const progress = await getPackageSpecialExamProgress(
        req.user!.userId,
        packageId,
        batchId as string,
      );
      return res.json(progress);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Claims a certificate for a completed package
  async claimPackageCertificate(req: AuthRequest, res: Response) {
    try {
      const { packageId, batchId } = req.body;
      if (!packageId) {
        return res.status(400).json({ error: "packageId is required" });
      }

      const result = await checkAndIssuePackageCertificate(
        req.user!.userId,
        packageId,
        batchId,
      );
      return res.status(201).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Downloads certificate PDF
  async download(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { pdfBuffer, fileName } = await certificateService.generatePdf(
        req.user!.userId,
        id,
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      return res.send(pdfBuffer);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
