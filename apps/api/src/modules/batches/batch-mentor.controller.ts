import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import { batchMentorService, AssignMentorSchema } from "./batch-mentor.service";

export const batchMentorController = {
  async assign(req: AuthRequest, res: Response) {
    try {
      const data = AssignMentorSchema.parse(req.body);
      const result = await batchMentorService.assign(req.params.batchId, data);
      return res.status(201).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async list(req: AuthRequest, res: Response) {
    try {
      const mentors = await batchMentorService.list(req.params.batchId);
      return res.json(mentors);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async remove(req: AuthRequest, res: Response) {
    try {
      await batchMentorService.remove(req.params.batchId, req.params.courseId);
      return res.json({ message: "Mentor removed" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
