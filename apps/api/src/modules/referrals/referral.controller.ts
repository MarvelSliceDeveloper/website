import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import {
  CreateReferralSchema,
  SendCouponSchema,
  referralService,
} from "./referral.service";
import { handleControllerError } from "../../utils/errors";

export const referralController = {
  // Admin: List all referrals (optional ?status= filter)
  async listReferrals(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const validStatuses = ["PENDING", "APPROVED", "REJECTED", "COUPON_SENT"];
      const referrals = await referralService.listReferrals(
        status && validStatuses.includes(status)
          ? (status as "PENDING" | "APPROVED" | "REJECTED" | "COUPON_SENT")
          : undefined,
      );
      return res.json(referrals);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Student: Submit a referral
  async createReferral(req: AuthRequest, res: Response) {
    try {
      const parsed = CreateReferralSchema.parse(req.body);
      const referral = await referralService.createReferral(
        req.user!.userId,
        parsed,
      );
      return res.status(201).json(referral);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin: Approve / reject a referral
  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body as {
        status: "PENDING" | "APPROVED" | "REJECTED" | "COUPON_SENT";
        adminNote?: string;
      };
      if (
        !["PENDING", "APPROVED", "REJECTED", "COUPON_SENT"].includes(status)
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await referralService.updateStatus(id, status, adminNote);
      return res.json(updated);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin: Create + attach a coupon code to a referral
  async sendCoupon(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const parsed = SendCouponSchema.parse(req.body);
      const updated = await referralService.sendCoupon(id, parsed);
      return res.json(updated);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
