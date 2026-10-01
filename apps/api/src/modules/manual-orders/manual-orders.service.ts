import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { paginate } from "../../utils/paginate";
import { emailService } from "../../services/email.service";
import { generateInvoicePdf } from "../../services/invoice.service";
import bcrypt from "bcryptjs";
import {
  generateDummyPassword,
  normalizePhone,
} from "../payments/payment.service";
import {
  normalizeUtr,
  validateUpiId,
  buildUpiIntent,
} from "./manual-orders.validation";

export type ManualPlanInput = "MONTHLY" | "FULL";

function toPlan(input: string): "MONTHLY" | "FULL" {
  if (input === "MONTHLY" || input === "FULL") return input;
  throw new AppError(400, "Invalid plan — must be MONTHLY or FULL");
}

export async function getSettings() {
  return prisma.paymentSettings.findUnique({ where: { id: "default" } });
}

export async function updateSettings(
  updaterId: string,
  input: { upiId: string; payeeName: string; isManualEnabled: boolean },
) {
  validateUpiId(input.upiId);
  const payeeName = input.payeeName.trim();
  if (!payeeName) throw new AppError(400, "Payee name required");
  return prisma.paymentSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      upiId: input.upiId.trim(),
      payeeName,
      isManualEnabled: input.isManualEnabled,
      updatedById: updaterId,
    },
    update: {
      upiId: input.upiId.trim(),
      payeeName,
      isManualEnabled: input.isManualEnabled,
      updatedById: updaterId,
    },
  });
}

export async function getPaymentOptions(courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: "PUBLISHED", deletedAt: null },
    select: { id: true, title: true, price: true, monthlyPrice: true },
  });
  if (!course) throw new AppError(404, "Course not found");
  const settings = await getSettings();
  const upi = settings
    ? {
        upiId: settings.upiId,
        payeeName: settings.payeeName,
        isManualEnabled: settings.isManualEnabled,
      }
    : null;
  const fullPrice = course.price ?? null;
  const monthlyPrice = course.monthlyPrice ?? null;
  const options: Record<string, { amount: number; upiIntent: string | null }> =
    {};
  if (upi && fullPrice != null) {
    options.FULL = {
      amount: fullPrice,
      upiIntent: upi.isManualEnabled
        ? buildUpiIntent({
            upiId: upi.upiId,
            payeeName: upi.payeeName,
            amountPaise: fullPrice,
            note: course.title,
          })
        : null,
    };
  }
  if (upi && monthlyPrice != null) {
    options.MONTHLY = {
      amount: monthlyPrice,
      upiIntent: upi.isManualEnabled
        ? buildUpiIntent({
            upiId: upi.upiId,
            payeeName: upi.payeeName,
            amountPaise: monthlyPrice,
            note: course.title,
          })
        : null,
    };
  }
  return {
    courseId: course.id,
    courseTitle: course.title,
    fullPrice,
    monthlyPrice,
    upi,
    options,
  };
}

export async function submitManualOrder(
  userId: string,
  courseId: string,
  planInput: string,
  transactionIdRaw: string,
  couponCodeRaw?: string,
) {
  const plan = toPlan(planInput);
  const settings = await getSettings();
  if (!settings || !settings.isManualEnabled) {
    throw new AppError(400, "Manual UPI payments are currently disabled");
  }
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: "PUBLISHED", deletedAt: null },
    select: { id: true, title: true, price: true, monthlyPrice: true },
  });
  if (!course) throw new AppError(404, "Course not found");
  const baseAmount = plan === "FULL" ? course.price : course.monthlyPrice;
  if (baseAmount == null) {
    throw new AppError(400, `This plan is not available for this course`);
  }
  let amount = baseAmount;
  let couponCode: string | null = null;
  let discountAmount = 0;
  const cleanCoupon = couponCodeRaw?.trim().toUpperCase();
  if (cleanCoupon) {
    const { couponService } = await import("../coupons/coupon.service");
    const validated = await couponService.validateCoupon(
      cleanCoupon,
      baseAmount,
    );
    amount = validated.finalAmountPaise;
    couponCode = validated.code;
    discountAmount = validated.discountAmountPaise;
  }
  const transactionId = normalizeUtr(transactionIdRaw);

  const duplicate = await prisma.manualPaymentOrder.findUnique({
    where: { transactionId },
  });
  if (duplicate)
    throw new AppError(409, "This transaction ID was already submitted");

  const existingPending = await prisma.manualPaymentOrder.findFirst({
    where: { userId, courseId, status: "PENDING" },
  });
  if (existingPending) {
    throw new AppError(
      409,
      "You already have a pending payment for this course",
    );
  }

  const paidEnrollment = await prisma.courseEnrollment.findFirst({
    where: { userId, courseId, status: "APPROVED" },
  });
  if (paidEnrollment)
    throw new AppError(409, "You are already enrolled in this course");

  const order = await prisma.manualPaymentOrder.create({
    data: {
      userId,
      courseId,
      plan,
      amount,
      couponCode,
      discountAmount,
      transactionId,
      status: "PENDING",
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (user) {
    emailService
      .sendManualOrderReceived({
        name: user.name,
        email: user.email,
        courseName: course.title,
        plan,
        amount,
        transactionId,
      })
      .catch((err: Error) =>
        console.error("[manual-orders] received email failed:", err),
      );
  }

  return order;
}

export async function listMyOrders(userId: string) {
  return prisma.manualPaymentOrder.findMany({
    where: { userId },
    include: {
      course: { select: { id: true, title: true } },
      package: { select: { id: true, name: true } },
      batch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPackagePaymentOptions(packageId: string) {
  const pkg = await prisma.coursePackage.findFirst({
    where: { id: packageId, status: "ACTIVE" },
    select: { id: true, name: true, price: true },
  });
  if (!pkg) throw new AppError(404, "Package not found");
  const settings = await getSettings();
  const upi = settings
    ? {
        upiId: settings.upiId,
        payeeName: settings.payeeName,
        isManualEnabled: settings.isManualEnabled,
      }
    : null;
  const price = pkg.price ?? null;
  const upiIntent =
    upi && upi.isManualEnabled && price != null && price > 0
      ? buildUpiIntent({
          upiId: upi.upiId,
          payeeName: upi.payeeName,
          amountPaise: price,
          note: pkg.name,
        })
      : null;
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
  return {
    packageId: pkg.id,
    packageName: pkg.name,
    price,
    upi,
    upiIntent,
    batches: batches.map((b) => ({
      id: b.id,
      name: b.name,
      startDate: b.startDate,
      course: b.course,
      seatsAvailable: b.maxStudents
        ? b.maxStudents - b._count.enrollments
        : null,
    })),
  };
}

export interface PackageOrderInput {
  batchId?: string;
  userState?: string;
  userAddress?: string;
  userGstin?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  couponCode?: string;
}

function cleanOptionalText(v: unknown, max = 200): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return t.slice(0, max);
}

export async function submitPackageManualOrder(
  authedUserId: string | null,
  packageId: string,
  transactionIdRaw: string,
  input?: PackageOrderInput,
) {
  const settings = await getSettings();
  if (!settings || !settings.isManualEnabled) {
    throw new AppError(400, "Manual UPI payments are currently disabled");
  }
  const pkg = await prisma.coursePackage.findFirst({
    where: { id: packageId, status: "ACTIVE" },
    select: { id: true, name: true, price: true },
  });
  if (!pkg) throw new AppError(404, "Package not found");
  if (pkg.price == null || pkg.price <= 0) {
    throw new AppError(400, "This package is not available for UPI payment");
  }
  let amount = pkg.price;
  let couponCode: string | null = null;
  let discountAmount = 0;
  const cleanCoupon = input?.couponCode?.trim().toUpperCase();
  if (cleanCoupon) {
    const { couponService } = await import("../coupons/coupon.service");
    const validated = await couponService.validateCoupon(
      cleanCoupon,
      pkg.price,
    );
    amount = validated.finalAmountPaise;
    couponCode = validated.code;
    discountAmount = validated.discountAmountPaise;
  }
  const transactionId = normalizeUtr(transactionIdRaw);

  // Guests buy first like the Razorpay flow: resolve the buyer to a user,
  // creating an account with emailed credentials for new guests.
  let userId: string;
  if (authedUserId) {
    userId = authedUserId;
    const phone = normalizePhone(input?.guestPhone);
    if (phone) {
      await prisma.user.updateMany({
        where: { id: userId, phone: null },
        data: { phone },
      });
    }
  } else {
    const guestName = input?.guestName?.trim() ?? "";
    const guestEmail = input?.guestEmail?.trim().toLowerCase() ?? "";
    const guestPhone = normalizePhone(input?.guestPhone);
    if (guestName.length < 2) throw new AppError(400, "Enter your full name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      throw new AppError(400, "Enter a valid email");
    }
    if (!guestPhone || guestPhone.length !== 10) {
      throw new AppError(400, "Enter a 10-digit mobile number");
    }
    const existing = await prisma.user.findUnique({
      where: { email: guestEmail },
    });
    if (existing) {
      throw new AppError(
        409,
        "An account with this email already exists. Please log in to complete your purchase.",
      );
    }
    const dummyPassword = generateDummyPassword();
    const hashed = await bcrypt.hash(dummyPassword, 12);
    const created = await prisma.user.create({
      data: {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        passwordHash: hashed,
        mustChangePassword: true,
        role: "STUDENT",
      },
    });
    userId = created.id;
    emailService
      .sendWelcomeEmail({
        name: guestName,
        email: guestEmail,
        credentials: { email: guestEmail, password: dummyPassword },
      })
      .catch((err: Error) =>
        console.error("[manual-orders] guest credentials email failed:", err),
      );
  }

  const duplicate = await prisma.manualPaymentOrder.findUnique({
    where: { transactionId },
  });
  if (duplicate)
    throw new AppError(409, "This transaction ID was already submitted");

  const existingPending = await prisma.manualPaymentOrder.findFirst({
    where: { userId, packageId, status: "PENDING" },
  });
  if (existingPending) {
    throw new AppError(
      409,
      "You already have a pending payment for this package",
    );
  }

  const paidEnrollment = await prisma.packageEnrollment.findFirst({
    where: { userId, packageId, status: "APPROVED" },
  });
  if (paidEnrollment)
    throw new AppError(409, "You are already enrolled in this package");

  let batchId: string | null = null;
  if (input?.batchId) {
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId },
      select: { id: true, packageId: true, status: true, isActive: true },
    });
    if (
      !batch ||
      batch.packageId !== packageId ||
      !batch.isActive ||
      (batch.status !== "UPCOMING" && batch.status !== "ACTIVE")
    ) {
      throw new AppError(
        400,
        "Selected batch is not available for this package",
      );
    }
    batchId = batch.id;
  }

  const order = await prisma.manualPaymentOrder.create({
    data: {
      userId,
      packageId,
      plan: "FULL",
      amount,
      couponCode,
      discountAmount,
      transactionId,
      status: "PENDING",
      batchId,
      userState: cleanOptionalText(input?.userState, 100),
      userAddress: cleanOptionalText(input?.userAddress, 500),
      userGstin: cleanOptionalText(input?.userGstin, 20)?.toUpperCase(),
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (user) {
    emailService
      .sendManualOrderReceived({
        name: user.name,
        email: user.email,
        courseName: pkg.name,
        plan: "FULL",
        amount,
        transactionId,
      })
      .catch((err: Error) =>
        console.error("[manual-orders] received email failed:", err),
      );
  }

  return order;
}

export async function listManualOrders(params: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { skip, take, page, limit } = paginate({
    page: params.page,
    limit: params.limit,
  });
  const where: { status?: "PENDING" | "APPROVED" | "REJECTED" } = {};
  if (params.status) {
    if (!["PENDING", "APPROVED", "REJECTED"].includes(params.status)) {
      throw new AppError(400, "Invalid status filter");
    }
    where.status = params.status as "PENDING" | "APPROVED" | "REJECTED";
  }
  const [items, total] = await Promise.all([
    prisma.manualPaymentOrder.findMany({
      where,
      skip,
      take,
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        package: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.manualPaymentOrder.count({ where }),
  ]);
  return { items, total, page, limit };
}

export async function approveManualOrder(orderId: string, reviewerId: string) {
  const order = await prisma.manualPaymentOrder.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      course: { select: { id: true, title: true } },
      package: {
        select: {
          id: true,
          name: true,
          courses: { select: { courseId: true } },
        },
      },
      batch: { select: { id: true, name: true, courseId: true } },
    },
  });
  if (!order) throw new AppError(404, "Manual order not found");
  if (order.status !== "PENDING") {
    throw new AppError(
      400,
      `Cannot approve order with status: ${order.status}`,
    );
  }
  const isPackageOrder = order.packageId != null;
  const itemName = isPackageOrder
    ? (order.package?.name ?? "package")
    : (order.course?.title ?? "course");

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId: order.userId,
        courseId: order.courseId ?? null,
        packageId: order.packageId ?? null,
        amount: order.amount,
        currency: "INR",
        razorpayOrderId: `MANUAL_${order.id}`,
        razorpayPaymentId: order.transactionId,
        status: "PAID",
      },
    });
    const updated = await tx.manualPaymentOrder.update({
      where: { id: order.id },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        paymentId: payment.id,
      },
    });
    if (isPackageOrder) {
      const enrollment = await tx.packageEnrollment.upsert({
        where: { paymentId: payment.id },
        update: { status: "APPROVED", userId: order.userId },
        create: {
          userId: order.userId,
          packageId: order.packageId!,
          paymentId: payment.id,
          status: "APPROVED",
        },
      });
      const batchCourseId = order.batch?.courseId ?? null;
      const courseIds = batchCourseId
        ? [batchCourseId]
        : (order.package?.courses ?? []).map((pc) => pc.courseId);
      for (const courseId of courseIds) {
        await tx.packageEnrollmentCourse.create({
          data: {
            enrollmentId: enrollment.id,
            courseId,
            batchId: order.batchId ?? null,
          },
        });
      }
      return { payment, updated, enrollment };
    }
    const cid = order.courseId;
    if (!cid) {
      throw new AppError(500, "Manual order is missing its course");
    }
    const enrollment = await tx.courseEnrollment.upsert({
      where: { paymentId: payment.id },
      update: { status: "APPROVED", userId: order.userId },
      create: {
        userId: order.userId,
        courseId: cid,
        paymentId: payment.id,
        status: "APPROVED",
      },
    });
    return { payment, updated, enrollment };
  });

  // Fire-and-forget: invoice PDF + approval email (never fail approval on email)
  try {
    const invoicePdf = generateInvoicePdf({
      invoiceNumber: `INV-${result.payment.id.slice(-8).toUpperCase()}`,
      userName: order.user.name,
      userEmail: order.user.email,
      userPhone: order.user.phone ?? undefined,
      userState: order.userState ?? undefined,
      userAddress: order.userAddress ?? undefined,
      userGstin: order.userGstin ?? undefined,
      packageName: `${itemName} (${order.plan === "FULL" ? "Full fee" : "Monthly"})`,
      amount: order.amount,
      discountAmount: 0,
      taxRate: 18,
      taxInclusive: true,
      date: new Date(),
      paidOn: result.updated.reviewedAt ?? new Date(),
      orderId: result.payment.razorpayOrderId ?? undefined,
      paymentMethod: "UPI",
      transactionId: order.transactionId,
      paymentStatus: "PAID",
    });
    emailService
      .sendManualOrderApproved({
        name: order.user.name,
        email: order.user.email,
        courseName: itemName,
        plan: order.plan,
        amount: order.amount,
        paymentId: result.payment.id,
        invoicePdfBase64: invoicePdf.toString("base64"),
      })
      .catch((err: Error) =>
        console.error("[manual-orders] approval email failed:", err),
      );
  } catch (err: unknown) {
    console.error("[manual-orders] invoice generation failed:", err);
  }

  try {
    const { notificationService } =
      await import("../notifications/notification.service");
    await notificationService.create({
      userId: order.userId,
      type: "ENROLLMENT_APPROVED",
      title: "Payment approved!",
      message: `Your ${order.plan === "FULL" ? "full-fee" : "monthly"} UPI payment for "${itemName}" was approved. You now have course access.`,
      metadata: isPackageOrder
        ? {
            packageId: order.packageId ?? undefined,
            paymentId: result.payment.id,
          }
        : {
            courseId: order.courseId ?? undefined,
            paymentId: result.payment.id,
          },
    });
  } catch {
    // notifications are best-effort
  }

  return {
    order: result.updated,
    payment: result.payment,
    enrollment: result.enrollment,
  };
}

export async function rejectManualOrder(
  orderId: string,
  reviewerId: string,
  reason: string,
) {
  const order = await prisma.manualPaymentOrder.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
      package: { select: { id: true, name: true } },
    },
  });
  if (!order) throw new AppError(404, "Manual order not found");
  if (order.status !== "PENDING") {
    throw new AppError(400, `Cannot reject order with status: ${order.status}`);
  }
  if (!reason.trim()) throw new AppError(400, "Rejection reason required");
  const itemName = order.package?.name ?? order.course?.title ?? "course";

  const updated = await prisma.manualPaymentOrder.update({
    where: { id: order.id },
    data: {
      status: "REJECTED",
      rejectionReason: reason.trim(),
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });

  emailService
    .sendManualOrderRejected({
      name: order.user.name,
      email: order.user.email,
      courseName: itemName,
      reason: reason.trim(),
    })
    .catch((err: Error) =>
      console.error("[manual-orders] rejection email failed:", err),
    );

  try {
    const { notificationService } =
      await import("../notifications/notification.service");
    await notificationService.create({
      userId: order.userId,
      type: "ENROLLMENT_REJECTED",
      title: "Payment not approved",
      message: `Your UPI payment for "${itemName}" was not approved: ${reason.trim()}`,
      metadata: order.packageId
        ? { packageId: order.packageId }
        : { courseId: order.courseId },
    });
  } catch {
    // best-effort
  }

  return updated;
}
