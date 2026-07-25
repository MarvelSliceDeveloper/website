/**
 * Payment service — handles Razorpay integration, guest user creation,
 * order/payment verification, and batch enrollment after successful payment.
 *
 * Guest users are created with a dummy password and mustChangePassword=true.
 * Welcome email with credentials is sent after successful enrollment.
 */
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { paginate, PaginationParams } from "../../utils/paginate";
import { emailService } from "../../services/email.service";
import { authService } from "../auth/auth.service";

function getRazorpayInstance() {
  const Razorpay = require("razorpay");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Verifies Razorpay payment signature using HMAC-SHA256.
 *
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Signature from Razorpay callback
 * @returns true if signature matches expected HMAC
 */
export function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

/**
 * Generates a 10-character random password for guest accounts.
 *
 * Excludes ambiguous characters (i, l, o, I, L, O, 0, 1) for readability.
 * Uses only alphanumeric characters from a safe subset.
 *
 * @returns Random 10-character password string
 */
export function generateDummyPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

export const paymentService = {
  async createGuestUser(name: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Existing user — just generate a new JWT
      const tokens = authService.generateTokens({
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        mustChangePassword: user.mustChangePassword,
        sessionTimeoutMin: user.sessionTimeoutMin,
      });
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
      };
    }

    // New user — create with dummy password
    const dummyPassword = generateDummyPassword();
    const hashed = await bcrypt.hash(dummyPassword, 12);

    user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: hashed,
        mustChangePassword: true,
        role: "STUDENT",
      },
    });

    const tokens = authService.generateTokens({
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      mustChangePassword: user.mustChangePassword,
      sessionTimeoutMin: user.sessionTimeoutMin,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    };
  },

  async checkNotEnrolled(packageId: string, userId?: string, email?: string) {
    const emailLower = email?.trim().toLowerCase();
    let targetUserId = userId;

    if (!targetUserId && emailLower) {
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
        select: { id: true },
      });
      targetUserId = user?.id;
    }

    if (!targetUserId) return;

    const [existingEnrollment, existingPayment] = await Promise.all([
      prisma.packageEnrollment.findFirst({
        where: { packageId, userId: targetUserId, status: "APPROVED" },
      }),
      prisma.payment.findFirst({
        where: {
          packageId,
          userId: targetUserId,
          status: { in: ["PENDING", "PAID"] },
        },
      }),
    ]);

    if (existingEnrollment) {
      throw new AppError(409, "You are already enrolled in this package");
    }

    if (existingPayment) {
      throw new AppError(
        409,
        "A payment for this package is already being processed",
      );
    }
  },

  async createOrder(userId: string, packageId: string, couponCode?: string) {
    await this.checkNotEnrolled(packageId, userId);

    const pkg = await prisma.coursePackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) throw new AppError(404, "Package not found");
    if (!pkg.price || pkg.price <= 0) throw new AppError(400, "Package is not priced");
    if (pkg.status !== "ACTIVE") throw new AppError(400, "Package is not available");

    let finalAmount = pkg.price;
    let discountAmount = 0;
    let couponId: string | null = null;

    if (couponCode && couponCode.trim()) {
      const { couponService } = await import("../coupons/coupon.service");
      const validation = await couponService.validateCoupon(
        couponCode,
        pkg.price,
      );
      finalAmount = validation.finalAmountPaise;
      discountAmount = validation.discountAmountPaise;
      couponId = validation.couponId;
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: finalAmount,
      currency: "INR",
      receipt: `rcpt_${Date.now().toString(36)}_${userId.slice(-8)}`,
    });

    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId,
        couponId,
        discountAmount,
        amount: finalAmount,
        razorpayOrderId: order.id,
        status: "PENDING",
      },
    });

    return {
      orderId: order.id,
      amount: finalAmount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
      discountAmount,
    };
  },

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { package: true, user: { select: { name: true, email: true } } },
    });
    if (!payment) throw new AppError(404, "Payment record not found");
    if (payment.status !== "PENDING")
      throw new AppError(400, "Payment already processed");

    const isValid = verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!isValid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", razorpayPaymentId, razorpaySignature },
      });
      throw new AppError(400, "Payment signature verification failed");
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", razorpayPaymentId, razorpaySignature },
    });

    emailService
      .sendInvoiceEmail({
        name: payment.user?.name || "Valued Customer",
        email: payment.user?.email || "",
        invoice: {
          paymentId: payment.id,
          packageName: payment.package.name,
          amount: payment.amount,
          discountAmount: payment.discountAmount,
          orderId: razorpayOrderId,
        },
      })
      .catch((err: Error) =>
        console.error("[payment] Failed to send invoice email:", err),
      );

    if (payment.couponId) {
      await prisma.coupon
        .update({
          where: { id: payment.couponId },
          data: { usedCount: { increment: 1 } },
        })
        .catch((err: unknown) =>
          console.error("[payment] Failed to increment coupon count:", err),
        );
    }

    return {
      paymentId: payment.id,
      packageId: payment.packageId,
      userId: payment.userId,
      amount: payment.amount,
    };
  },

  async getAvailableBatches(packageId: string) {
    const batches = await prisma.batch.findMany({
      where: {
        packageId,
        status: { in: ["UPCOMING", "ACTIVE"] },
      },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: "asc" },
    });

    return batches.map((b) => ({
      id: b.id,
      name: b.name,
      startDate: b.startDate,
      endDate: b.endDate,
      course: b.course,
      seatsAvailable: b.maxStudents
        ? b.maxStudents - b._count.enrollments
        : null,
      status: b.status,
    }));
  },

  async enrollInBatch(
    paymentId: string,
    batchId: string,
    name: string,
    email: string,
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { package: { include: { courses: true } } },
    });
    if (!payment || payment.status !== "PAID")
      throw new AppError(400, "Payment not completed");

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const isNewUser = !user;

    if (isNewUser) {
      const dummyPassword = generateDummyPassword();
      const hashed = await bcrypt.hash(dummyPassword, 12);
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashed,
          mustChangePassword: true,
          role: "STUDENT",
        },
      });

      emailService
        .sendWelcomeEmail({
          name,
          email: email.toLowerCase(),
          credentials: { email: email.toLowerCase(), password: dummyPassword },
          invoice: {
            paymentId: payment.id,
            packageName: payment.package.name,
            amount: payment.amount,
            discountAmount: payment.discountAmount,
          },
        })
        .catch((err: Error) =>
          console.error("[payment] Failed to send welcome email:", err),
        );
    } else if (user.mustChangePassword) {
      const dummyPassword = generateDummyPassword();
      const hashed = await bcrypt.hash(dummyPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed },
      });

      emailService
        .sendWelcomeEmail({
          name,
          email: email.toLowerCase(),
          credentials: { email: email.toLowerCase(), password: dummyPassword },
          invoice: {
            paymentId: payment.id,
            packageName: payment.package.name,
            amount: payment.amount,
            discountAmount: payment.discountAmount,
          },
        })
        .catch((err: Error) =>
          console.error("[payment] Failed to send welcome email:", err),
        );
    }

    if (!user) {
      throw new AppError(500, "User could not be found or created");
    }

    const enrollment = await prisma.packageEnrollment.create({
      data: {
        userId: user.id,
        packageId: payment.packageId,
        paymentId: payment.id,
        status: "APPROVED",
      },
    });

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { course: true },
    });

    const courseIds = batch?.courseId
      ? [batch.courseId]
      : payment.package.courses.map((pc) => pc.courseId);

    for (const courseId of courseIds) {
      await prisma.packageEnrollmentCourse.create({
        data: {
          enrollmentId: enrollment.id,
          courseId,
          batchId,
        },
      });
    }

    return { isNewUser, email: email.toLowerCase() };
  },

  async createConsentEnrollment(
    paymentId: string,
    name: string,
    email: string,
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { package: true },
    });
    if (!payment || payment.status !== "PAID")
      throw new AppError(400, "Payment not completed");

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const isNewUser = !user;

    if (isNewUser) {
      const dummyPassword = generateDummyPassword();
      const hashed = await bcrypt.hash(dummyPassword, 12);
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashed,
          mustChangePassword: true,
          role: "STUDENT",
        },
      });

      emailService
        .sendWelcomeEmail({
          name,
          email: email.toLowerCase(),
          credentials: { email: email.toLowerCase(), password: dummyPassword },
          invoice: {
            paymentId: payment.id,
            packageName: payment.package.name,
            amount: payment.amount,
            discountAmount: payment.discountAmount,
          },
        })
        .catch((err: Error) =>
          console.error("[payment] Failed to send welcome email:", err),
        );
    } else if (user.mustChangePassword) {
      const dummyPassword = generateDummyPassword();
      const hashed = await bcrypt.hash(dummyPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashed },
      });

      emailService
        .sendWelcomeEmail({
          name,
          email: email.toLowerCase(),
          credentials: { email: email.toLowerCase(), password: dummyPassword },
          invoice: {
            paymentId: payment.id,
            packageName: payment.package.name,
            amount: payment.amount,
            discountAmount: payment.discountAmount,
          },
        })
        .catch((err: Error) =>
          console.error("[payment] Failed to send welcome email:", err),
        );
    }

    if (!user) {
      throw new AppError(500, "User could not be found or created");
    }

    const enrollment = await prisma.packageEnrollment.create({
      data: {
        userId: user.id,
        packageId: payment.packageId,
        paymentId: payment.id,
        status: "PENDING",
      },
    });

    return {
      enrollmentId: enrollment.id,
      isNewUser,
      email: email.toLowerCase(),
    };
  },

  async getAdminPayments(params?: PaginationParams) {
    const { page, limit } = params || {};
    const {
      skip,
      take,
      page: currentPage,
      limit: currentLimit,
    } = paginate({ page, limit });

    const where = { status: { not: "PENDING" as const } };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true } },
          package: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    const items = payments.map((p) => ({
      id: p.id,
      studentName: p.user.name,
      studentEmail: p.user.email,
      packageName: p.package.name,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      razorpayPaymentId: p.razorpayPaymentId,
      createdAt: p.createdAt,
    }));

    return { items, total, page: currentPage, limit: currentLimit };
  },

  async getRevenueStats() {
    const allPayments = await prisma.payment.findMany({
      orderBy: { createdAt: "asc" },
    });

    const totalRevenue = allPayments
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPayments = allPayments.length;
    const successful = allPayments.filter((p) => p.status === "PAID").length;
    const failed = allPayments.filter((p) => p.status === "FAILED").length;
    const refunded = allPayments.filter((p) => p.status === "REFUNDED").length;

    const monthlyMap = new Map<string, number>();
    for (const p of allPayments.filter((p) => p.status === "PAID")) {
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + p.amount);
    }
    const monthlyRevenue = Array.from(monthlyMap.entries()).map(
      ([month, amount]) => ({
        month,
        amount,
      }),
    );

    return {
      totalRevenue,
      totalPayments,
      successful,
      failed,
      refunded,
      monthlyRevenue,
    };
  },
};
