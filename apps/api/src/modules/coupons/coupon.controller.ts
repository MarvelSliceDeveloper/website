import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { couponService, CreateCouponSchema } from "./coupon.service";
import { handleControllerError } from "../../utils/errors";
import { prisma } from "../../utils/prisma";

export const couponController = {
  // Admin: Create coupon
  async createCoupon(req: AuthRequest, res: Response) {
    try {
      const parsed = CreateCouponSchema.parse(req.body);
      const coupon = await couponService.createCoupon(parsed);
      return res.status(201).json(coupon);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin: List all coupons
  async listCoupons(req: AuthRequest, res: Response) {
    try {
      const coupons = await couponService.listCoupons();
      return res.json(coupons);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin: Toggle active status
  async toggleCoupon(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updated = await couponService.toggleCoupon(id);
      return res.json(updated);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Admin: Delete coupon
  async deleteCoupon(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await couponService.deleteCoupon(id);
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // Public/Student: Validate coupon for a package
  async validateCoupon(req: AuthRequest, res: Response) {
    try {
      const { code, packageId } = req.body;
      if (!code || !packageId) {
        return res.status(400).json({ error: "code and packageId are required" });
      }

      const pkg = await prisma.coursePackage.findUnique({
        where: { id: packageId },
        select: { price: true },
      });

      if (!pkg || !pkg.price) {
        return res.status(404).json({ error: "Package not found or not priced" });
      }

      const result = await couponService.validateCoupon(code, pkg.price);
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
