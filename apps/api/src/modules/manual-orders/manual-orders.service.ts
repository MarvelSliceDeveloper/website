import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { paginate } from "../../utils/paginate";
import { emailService } from "../../services/email.service";
import { generateInvoicePdf } from "../../services/invoice.service";
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
  const amount = plan === "FULL" ? course.price : course.monthlyPrice;
  if (amount == null) {
    throw new AppError(400, `This plan is not available for this course`);
  }
  const transactionId = normalizeUtr(transactionIdRaw);

  const duplicate = await prisma.manualPaymentOrder.findUnique({
    where: { transactionId },
  });
  if (duplicate) throw new AppError(409, "This transaction ID was already submitted");

  const existingPending = await prisma.manualPaymentOrder.findFirst({
    where: { userId, courseId, status: "PENDING" },
  });
  if (existingPending) {
    throw new AppError(409, "You already have a pending payment for this course");
  }

  const paidEnrollment = await prisma.courseEnrollment.findFirst({
    where: { userId, courseId, status: "APPROVED" },
  });
  if (paidEnrollment) throw new AppError(409, "You are already enrolled in this course");

  const order = await prisma.manualPaymentOrder.create({
    data: { userId, courseId, plan, amount, transactionId, status: "PENDING" },
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
    include: { course: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
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
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });
  if (!order) throw new AppError(404, "Manual order not found");
  if (order.status !== "PENDING") {
    throw new AppError(400, `Cannot approve order with status: ${order.status}`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        userId: order.userId,
        courseId: order.courseId,
        packageId: null,
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
    const enrollment = await tx.courseEnrollment.upsert({
      where: { paymentId: payment.id },
      update: { status: "APPROVED", userId: order.userId },
      create: {
        userId: order.userId,
        courseId: order.courseId,
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
      packageName: `${order.course.title} (${order.plan === "FULL" ? "Full fee" : "Monthly"})`,
      amount: order.amount,
      discountAmount: 0,
      date: new Date(),
      paymentMethod: "UPI Manual",
      paymentStatus: "PAID",
    });
    emailService
      .sendManualOrderApproved({
        name: order.user.name,
        email: order.user.email,
        courseName: order.course.title,
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
    const { notificationService } = await import(
      "../notifications/notification.service"
    );
    await notificationService.create({
      userId: order.userId,
      type: "ENROLLMENT_APPROVED",
      title: "Payment approved!",
      message: `Your ${order.plan === "FULL" ? "full-fee" : "monthly"} UPI payment for "${order.course.title}" was approved. You now have course access.`,
      metadata: { courseId: order.courseId, paymentId: result.payment.id },
    });
  } catch {
    // notifications are best-effort
  }

  return { order: result.updated, payment: result.payment, enrollment: result.enrollment };
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
    },
  });
  if (!order) throw new AppError(404, "Manual order not found");
  if (order.status !== "PENDING") {
    throw new AppError(400, `Cannot reject order with status: ${order.status}`);
  }
  if (!reason.trim()) throw new AppError(400, "Rejection reason required");

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
      courseName: order.course.title,
      reason: reason.trim(),
    })
    .catch((err: Error) =>
      console.error("[manual-orders] rejection email failed:", err),
    );

  try {
    const { notificationService } = await import(
      "../notifications/notification.service"
    );
    await notificationService.create({
      userId: order.userId,
      type: "ENROLLMENT_REJECTED",
      title: "Payment not approved",
      message: `Your UPI payment for "${order.course.title}" was not approved: ${reason.trim()}`,
      metadata: { courseId: order.courseId },
    });
  } catch {
    // best-effort
  }

  return updated;
}
