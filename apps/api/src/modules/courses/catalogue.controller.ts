import { Request, Response } from "express";
import { handleControllerError } from "../../utils/errors";
import { courseService } from "./course.service";

export const catalogueController = {
  async list(req: Request, res: Response) {
    try {
      const { category, search, page, limit } = req.query as any;
      const result = await courseService.listCatalogue({
        category: category as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
  async getBySlug(req: Request, res: Response) {
    try {
      const course = await courseService.getCatalogueBySlug(req.params.slug);
      return res.json({ course });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
  async checkout(req: Request, res: Response) {
    try {
      const { name, email, phone } = req.body;
      if (!name || !email || !phone) return res.status(400).json({ error: "name, email, phone required" });
      const result = await courseService.createCatalogueCheckout(req.params.id, { name, email, phone });
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
  async verify(req: Request, res: Response) {
    try {
      const result = await courseService.verifyCataloguePayment(req.params.id, req.body);
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
