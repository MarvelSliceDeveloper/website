import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../utils/prisma";
import { emailService } from "../../services/email.service";
import { authService } from "../auth/auth.service";

function getRazorpayInstance() {
  const Razorpay = require("razorpay");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function verifySignature(
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

function generateDummyPassword(): string {
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

    emailService
      .sendWelcomeEmail({
        name,
        email: normalizedEmail,
        credentials: { email: normalizedEmail, password: dummyPassword },
      })
      .catch((err: Error) =>
        console.error("[payment] Failed to send welcome email:", err),
      );

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

  async createOrder(userId: string, packageId: string) {
    const pkg = await prisma.coursePackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) throw new Error("Package not found");
    if (!pkg.price || pkg.price <= 0) throw new Error("Package is not priced");
    if (pkg.status !== "ACTIVE") throw new Error("Package is not available");

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: pkg.price,
      currency: "INR",
      receipt: `rcpt_${Date.now().toString(36)}_${userId.slice(-8)}`,
    });

    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId,
        amount: pkg.price,
        razorpayOrderId: order.id,
        status: "PENDING",
      },
    });

    return {
      orderId: order.id,
      amount: pkg.price,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentId: payment.id,
    };
  },

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { package: true },
    });
    if (!payment) throw new Error("Payment record not found");
    if (payment.status !== "PENDING")
      throw new Error("Payment already processed");

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
      throw new Error("Payment signature verification failed");
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", razorpayPaymentId, razorpaySignature },
    });

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
      throw new Error("Payment not completed");

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const isNewUser = !user;
    const dummyPassword = isNewUser ? generateDummyPassword() : undefined;

    if (isNewUser) {
      const hashed = await bcrypt.hash(dummyPassword!, 12);
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashed,
          mustChangePassword: true,
          role: "STUDENT",
        },
      });
    }

    if (!user) {
      throw new Error("User could not be found or created");
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

    if (isNewUser && dummyPassword) {
      emailService
        .sendWelcomeEmail({
          name,
          email: email.toLowerCase(),
          credentials: { email: email.toLowerCase(), password: dummyPassword },
        })
        .catch((err: Error) =>
          console.error("[payment] Failed to send welcome email:", err),
        );
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
    });
    if (!payment || payment.status !== "PAID")
      throw new Error("Payment not completed");

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const isNewUser = !user;
    const dummyPassword = isNewUser ? generateDummyPassword() : undefined;

    if (isNewUser) {
      const hashed = await bcrypt.hash(dummyPassword!, 12);
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashed,
          mustChangePassword: true,
          role: "STUDENT",
        },
      });
    }

    if (!user) {
      throw new Error("User could not be found or created");
    }

    const enrollment = await prisma.packageEnrollment.create({
      data: {
        userId: user.id,
        packageId: payment.packageId,
        paymentId: payment.id,
        status: "PENDING",
      },
    });

    if (isNewUser && dummyPassword) {
      emailService
        .sendWelcomeEmail({
          name,
          email: email.toLowerCase(),
          credentials: { email: email.toLowerCase(), password: dummyPassword },
        })
        .catch((err: Error) =>
          console.error("[payment] Failed to send welcome email:", err),
        );
    }

    return {
      enrollmentId: enrollment.id,
      isNewUser,
      email: email.toLowerCase(),
    };
  },

  async getAdminPayments() {
    const payments = await prisma.payment.findMany({
      where: { status: { not: "PENDING" } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return payments.map((p) => ({
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

    return { totalRevenue, totalPayments, successful, failed, refunded, monthlyRevenue };
  },
};
