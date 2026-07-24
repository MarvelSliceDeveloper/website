import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";

export const CreateCouponSchema = z.object({
  code: z.string().optional(), // If empty, will auto-generate
  title: z.string().min(2).max(100),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().min(0).default(0), // in rupees
  maxDiscountAmount: z.number().positive().optional().nullable(), // in rupees
  usageLimit: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export function generateCouponCode(prefix = "LMS"): string {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${randomHex}`;
}

export const couponService = {
  // Generates or validates code and creates new coupon
  async createCoupon(input: z.infer<typeof CreateCouponSchema>) {
    let code = input.code
      ? input.code.trim().toUpperCase()
      : generateCouponCode();

    // Check code uniqueness
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      if (input.code) {
        throw new AppError(400, "Coupon code already exists");
      }
      code = generateCouponCode();
    }

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

    // Convert values from rupees to paise for minOrderAmount and maxDiscountAmount
    const minOrderAmountPaise = Math.round((input.minOrderAmount || 0) * 100);
    const maxDiscountAmountPaise = input.maxDiscountAmount
      ? Math.round(input.maxDiscountAmount * 100)
      : null;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        title: input.title,
        discountType: input.discountType,
        discountValue: input.discountValue,
        minOrderAmount: minOrderAmountPaise,
        maxDiscountAmount: maxDiscountAmountPaise,
        usageLimit: input.usageLimit ?? null,
        expiresAt,
      },
    });

    return coupon;
  },

  // Lists all coupons with usage metrics
  async listCoupons() {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return coupons;
  },

  // Toggles active status
  async toggleCoupon(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new AppError(404, "Coupon not found");

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
    return updated;
  },

  // Deletes coupon
  async deleteCoupon(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new AppError(404, "Coupon not found");

    await prisma.coupon.delete({ where: { id } });
    return { success: true };
  },

  // Validates coupon against an order amount (in paise)
  async validateCoupon(code: string, originalAmountPaise: number) {
    const cleanCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      throw new AppError(404, "Invalid coupon code");
    }

    if (!coupon.isActive) {
      throw new AppError(400, "This coupon is no longer active");
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new AppError(400, "This coupon has expired");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError(400, "This coupon usage limit has been reached");
    }

    if (originalAmountPaise < coupon.minOrderAmount) {
      const minRs = (coupon.minOrderAmount / 100).toFixed(0);
      throw new AppError(
        400,
        `Minimum package amount to apply this coupon is ₹${minRs}`,
      );
    }

    // Calculate discount in paise
    let discountPaise = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountPaise = Math.round(
        (originalAmountPaise * coupon.discountValue) / 100,
      );
      if (
        coupon.maxDiscountAmount &&
        discountPaise > coupon.maxDiscountAmount
      ) {
        discountPaise = coupon.maxDiscountAmount;
      }
    } else {
      // FIXED in Rupees -> convert to paise
      discountPaise = Math.round(coupon.discountValue * 100);
    }

    // Cap discount to not exceed original amount
    discountPaise = Math.min(discountPaise, originalAmountPaise);
    const finalAmountPaise = Math.max(0, originalAmountPaise - discountPaise);

    return {
      couponId: coupon.id,
      code: coupon.code,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      originalAmountPaise,
      discountAmountPaise: discountPaise,
      finalAmountPaise,
    };
  },
};
