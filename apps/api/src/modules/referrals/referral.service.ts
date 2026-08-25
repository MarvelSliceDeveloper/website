import { z } from "zod";
import type { ReferralStatus } from "@prisma/client";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { couponService, generateCouponCode } from "../coupons/coupon.service";
import { emailService } from "../../services/email.service";

export const CreateReferralSchema = z.object({
  refereeName: z.string().min(2).max(100),
  refereeEmail: z.string().email(),
  refereePhone: z.string().min(7).max(20).optional().nullable(),
});

export const SendCouponSchema = z.object({
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  discountValue: z.number().positive(),
  usageLimit: z.number().int().positive().default(1),
  expiresAt: z.string().optional().nullable(),
  adminNote: z.string().max(500).optional().nullable(),
});

export const referralService = {
  // Admin: List all referrals, optionally filtered by status
  async listReferrals(status?: ReferralStatus) {
    return prisma.referral.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        referrer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
  },

  // Student: Submit a new referral
  async createReferral(
    userId: string,
    input: z.infer<typeof CreateReferralSchema>,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });
    if (!user) throw new AppError(401, "User not found");

    // Prevent duplicate submissions for the same referee email by the same student
    const existing = await prisma.referral.findFirst({
      where: {
        referrerId: userId,
        refereeEmail: input.refereeEmail.trim().toLowerCase(),
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (existing) {
      throw new AppError(409, "You have already referred this email");
    }

    return prisma.referral.create({
      data: {
        referrerId: user.id,
        referrerName: user.name,
        referrerEmail: user.email,
        refereeName: input.refereeName.trim(),
        refereeEmail: input.refereeEmail.trim().toLowerCase(),
        refereePhone: input.refereePhone?.trim() ?? null,
      },
    });
  },

  // Admin: Approve / reject a referral ("OK" action)
  async updateStatus(id: string, status: ReferralStatus, adminNote?: string) {
    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral) throw new AppError(404, "Referral not found");
    if (referral.status === "COUPON_SENT" && status !== "COUPON_SENT") {
      throw new AppError(
        400,
        "Cannot change a referral that already has a coupon",
      );
    }

    return prisma.referral.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote?.trim() || referral.adminNote,
      },
    });
  },

  // Admin: Create a coupon for the referred person and attach it to the referral
  async sendCoupon(id: string, input: z.infer<typeof SendCouponSchema>) {
    const referral = await prisma.referral.findUnique({ where: { id } });
    if (!referral) throw new AppError(404, "Referral not found");
    if (referral.couponCode || referral.status === "COUPON_SENT") {
      throw new AppError(400, "Coupon already sent for this referral");
    }

    // Create the coupon via the existing coupon module (REF-XXXXX auto code)
    const coupon = await couponService.createCoupon({
      code: generateCouponCode("REF"),
      title: `Referral Reward — ${referral.refereeName}`,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: 0,
      usageLimit: input.usageLimit,
      expiresAt: input.expiresAt,
    });

    const updated = await prisma.referral.update({
      where: { id },
      data: {
        status: "COUPON_SENT",
        couponId: coupon.id,
        couponCode: coupon.code,
        adminNote: input.adminNote?.trim() || referral.adminNote,
      },
    });

    // Notify the referred person with their coupon code (graceful if email not configured)
    const discountLabel =
      coupon.discountType === "PERCENTAGE"
        ? `${coupon.discountValue}% OFF`
        : `₹${coupon.discountValue} OFF`;
    void emailService
      .sendEmail({
        to: [{ email: referral.refereeEmail, name: referral.refereeName }],
        subject: "Your Referral Coupon Code from Marvel Slice",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
            <h2>Congratulations, ${referral.refereeName}!</h2>
            <p>${referral.referrerName} referred you to Marvel Slice. As a welcome gift, here is your exclusive coupon:</p>
            <p style="text-align:center;padding:12px;background:#f1f5f9;border-radius:8px;font-family:monospace;font-size:18px;font-weight:bold;letter-spacing:1px">${coupon.code}</p>
            <p style="text-align:center">Apply code <strong>${coupon.code}</strong> at checkout to get <strong>${discountLabel}</strong> on any package.</p>
            <p style="color:#64748b;font-size:12px">Expires: ${coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("en-IN") : "No expiry"}</p>
          </div>
        `,
        text: `Congratulations ${referral.refereeName}! ${referral.referrerName} referred you to Marvel Slice. Your coupon code is: ${coupon.code} (${discountLabel}).`,
        tags: ["referral-coupon"],
      })
      .catch(() => false);

    return updated;
  },
};
