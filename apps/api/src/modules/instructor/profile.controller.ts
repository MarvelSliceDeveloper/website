import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { handleControllerError } from "../../utils/errors";
import { profileService } from "./profile.service";
import {
  uploadInstructorFiles,
  buildInstructorFileUrl,
  PHOTO_FIELD,
  RESUME_FIELD,
} from "./instructor-upload";

export const profileController = {
  // GET /api/instructor/profile
  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const result = await profileService.getProfile(req.user.userId);
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // PUT /api/instructor/profile
  async upsertProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const profile = await profileService.upsertProfile(
        req.user.userId,
        req.body,
      );
      return res.json(profile);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async uploadFile(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const userId = req.user.userId;

      uploadInstructorFiles(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }

        const files = req.files as
          | { [fieldname: string]: Express.Multer.File[] }
          | undefined;
        const updateData: Record<string, string> = {};

        if (files?.[PHOTO_FIELD]?.length) {
          updateData.photoUrl = buildInstructorFileUrl(
            req,
            files[PHOTO_FIELD][0].filename,
          );
        }
        if (files?.[RESUME_FIELD]?.length) {
          updateData.resumeUrl = buildInstructorFileUrl(
            req,
            files[RESUME_FIELD][0].filename,
          );
        }

        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: "No files uploaded" });
        }

        const profile = await profileService.upsertProfile(userId, updateData);
        return res.json(profile);
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /api/instructor/profile/status
  async getOnboardingStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const status = await profileService.getOnboardingStatus(req.user.userId);
      return res.json(status);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
