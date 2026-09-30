import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireRole,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { paginate } from "../../../utils/paginate";
import { AppError, handleControllerError } from "../../../utils/errors";
import { getRazorpayInstance } from "../../payments/payment.service";
import { normalizeUtr } from "../../manual-orders/manual-orders.validation";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

/**
 * Manual UPI payments create normal PAID Payment records whose
 * razorpayOrderId is `MANUAL_<orderId>` and whose razorpayPaymentId holds
 * the student's UTR. They appear in recent payments and reports like any
 * other payment — only the refund execution differs (no Razorpay API).
 */
function isManualPayment(payment: { razorpayOrderId: string | null }): boolean {
  return payment.razorpayOrderId?.startsWith("MANUAL_") ?? false;
}

/** Refund detail include shared by list/detail responses */
function refundInclude() {
  return {
    payment: {
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        package: { select: { id: true, name: true, price: true } },
      },
    },
    initiatedBy: { select: { id: true, name: true, email: true } },
    approvedBy: { select: { id: true, name: true, email: true } },
  };
}

/**
 * Resolves a payment by its Razorpay payment ID (preferred) or internal ID.
 * Returns the payment with the payer's details, package, and refund history.
 */
async function resolvePayment(identifier: {
  razorpayPaymentId?: string;
  paymentId?: string;
}) {
  const include = {
    user: { select: { id: true, name: true, email: true, phone: true } },
    package: { select: { id: true, name: true, price: true } },
    refunds: { select: { id: true, amount: true, status: true } },
  } as const;

  if (identifier.razorpayPaymentId) {
    return prisma.payment.findUnique({
      where: { razorpayPaymentId: identifier.razorpayPaymentId },
      include,
    });
  }
  if (identifier.paymentId) {
    return prisma.payment.findUnique({
      where: { id: identifier.paymentId },
      include,
    });
  }
  return null;
}

/** Computes refundable summary for a payment (active refunds exclude CANCELLED/REJECTED) */
function buildPaymentInfo(payment: {
  id: string;
  amount: number;
  status: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: Date;
  refunds: { amount: number; status: string }[];
}) {
  const activeRefunds = payment.refunds.filter(
    (r) => r.status !== "CANCELLED" && r.status !== "REJECTED",
  );
  const refundedTotal = activeRefunds.reduce((sum, r) => sum + r.amount, 0);
  return {
    paymentId: payment.id,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    isManual: isManualPayment(payment),
    amount: payment.amount,
    status: payment.status,
    refundedTotal,
    remaining: payment.amount - refundedTotal,
    createdAt: payment.createdAt,
  };
}

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });

    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const where = status ? { status: status as never } : {};

    const [items, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: refundInclude(),
      }),
      prisma.refund.count({ where }),
    ]);

    return res.json({ items, total, page, limit });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

/**
 * Verify a payment before issuing a refund — accepts a Razorpay payment ID
 * or, for manual UPI payments, the student's UTR. Returns the payer's
 * name, contact details, package, amount, and remaining refundable balance
 * so the admin can confirm the right person before the refund is requested.
 */
router.post("/lookup", async (req: AuthRequest, res: Response) => {
  try {
    const { razorpayPaymentId, paymentId } = req.body ?? {};
    if (!razorpayPaymentId && !paymentId) {
      throw new AppError(
        400,
        "razorpayPaymentId (or UTR for UPI payments) is required",
      );
    }

    const payment = await resolvePayment({ razorpayPaymentId, paymentId });
    if (!payment) {
      throw new AppError(404, "Payment not found");
    }

    return res.json({
      payment: buildPaymentInfo(payment),
      user: payment.user,
      package: payment.package,
    });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

/**
 * Admin submits a refund request. The refund is created with status PENDING
 * and waits for superadmin approval before the Razorpay refund is executed.
 */
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { razorpayPaymentId, paymentId, amount, reason } = req.body ?? {};

    if (!razorpayPaymentId && !paymentId) {
      throw new AppError(
        400,
        "razorpayPaymentId (or UTR for UPI payments) is required",
      );
    }
    if (typeof amount !== "number" || amount <= 0) {
      throw new AppError(400, "amount must be a positive number (in paise)");
    }

    const payment = await resolvePayment({ razorpayPaymentId, paymentId });
    if (!payment) {
      throw new AppError(404, "Payment not found");
    }

    // Verification — only verified PAID payments with a Razorpay ID are refundable
    if (payment.status !== "PAID") {
      throw new AppError(
        400,
        `Only payments marked as PAID can be refunded. This payment is ${payment.status}`,
      );
    }
    if (!payment.razorpayPaymentId) {
      throw new AppError(
        400,
        "This payment has no Razorpay payment ID linked, so it cannot be refunded via Razorpay",
      );
    }

    const activeRefunds = payment.refunds.filter(
      (r) => r.status !== "CANCELLED" && r.status !== "REJECTED",
    );
    const refundedTotal = activeRefunds.reduce((sum, r) => sum + r.amount, 0);
    const remaining = payment.amount - refundedTotal;

    if (amount > remaining) {
      throw new AppError(
        400,
        `Refund amount exceeds remaining balance. Available: ${remaining} paise`,
      );
    }

    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount,
        reason: reason || null,
        initiatedById: req.user!.userId,
        status: "PENDING",
      },
      include: refundInclude(),
    });

    return res.status(201).json(refund);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: req.params.id },
      include: refundInclude(),
    });

    if (!refund) {
      throw new AppError(404, "Refund not found");
    }

    return res.json(refund);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

/**
 * Superadmin approves a pending refund request. Razorpay payments are
 * refunded via the Razorpay API. Manual UPI payments have no gateway to
 * call — the superadmin refunds from the company UPI app first, then
 * approves here with the refund's UTR (`refundTransactionId`), which is
 * stored on the refund record.
 */
router.post(
  "/:id/approve",
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const existing = await prisma.refund.findUnique({
        where: { id: req.params.id },
        include: { payment: true },
      });

      if (!existing) {
        throw new AppError(404, "Refund not found");
      }
      if (existing.status !== "PENDING") {
        throw new AppError(400, "Only pending refunds can be approved");
      }

      const approver = {
        approvedById: req.user!.userId,
        approvedAt: new Date(),
      };

      if (isManualPayment(existing.payment)) {
        const { refundTransactionId } = req.body ?? {};
        if (!refundTransactionId || typeof refundTransactionId !== "string") {
          throw new AppError(
            400,
            "refundTransactionId is required — enter the UTR of the refund you made via UPI",
          );
        }
        const normalized = normalizeUtr(refundTransactionId);
        const processed = await prisma.refund.update({
          where: { id: existing.id },
          data: {
            ...approver,
            status: "COMPLETED",
            metadata: {
              ...((existing.metadata as Record<string, unknown>) ?? {}),
              manualRefund: true,
              refundTransactionId: normalized,
            },
          },
          include: refundInclude(),
        });
        return res.json(processed);
      }

      if (!existing.payment.razorpayPaymentId) {
        const failed = await prisma.refund.update({
          where: { id: existing.id },
          data: {
            ...approver,
            status: "FAILED",
            metadata: { error: "Payment has no Razorpay payment ID linked" },
          },
          include: refundInclude(),
        });
        return res.json(failed);
      }

      try {
        const razorpay = getRazorpayInstance();
        const rzrRefund = await razorpay.payments.refund(
          existing.payment.razorpayPaymentId,
          { amount: existing.amount },
        );

        const processed = await prisma.refund.update({
          where: { id: existing.id },
          data: {
            ...approver,
            status: "COMPLETED",
            razorpayRefundId: rzrRefund.id,
            metadata: {
              ...((existing.metadata as Record<string, unknown>) ?? {}),
              razorpayRefundStatus: rzrRefund.status,
              razorpayRefundId: rzrRefund.id,
            },
          },
          include: refundInclude(),
        });

        return res.json(processed);
      } catch (razorpayErr: unknown) {
        const failed = await prisma.refund.update({
          where: { id: existing.id },
          data: {
            ...approver,
            status: "FAILED",
            metadata: {
              error:
                razorpayErr instanceof Error
                  ? razorpayErr.message
                  : "Razorpay refund request failed",
            },
          },
          include: refundInclude(),
        });

        return res.json(failed);
      }
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
);

/**
 * Superadmin rejects a pending refund request. A rejection reason is stored
 * so the requesting admin knows why the refund was declined.
 */
router.post(
  "/:id/reject",
  requireSuperAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { reason } = req.body ?? {};

      const existing = await prisma.refund.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        throw new AppError(404, "Refund not found");
      }
      if (existing.status !== "PENDING") {
        throw new AppError(400, "Only pending refunds can be rejected");
      }

      const refund = await prisma.refund.update({
        where: { id: existing.id },
        data: {
          status: "REJECTED",
          rejectionReason: reason || null,
          approvedById: req.user!.userId,
          approvedAt: new Date(),
        },
        include: refundInclude(),
      });

      return res.json(refund);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
);

/**
 * Legacy status update — only allows an admin to cancel a pending refund
 * request. Approval/rejection flows use the dedicated endpoints above.
 */
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body ?? {};

    if (!status) {
      throw new AppError(400, "status is required");
    }

    const existing = await prisma.refund.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      throw new AppError(404, "Refund not found");
    }

    if (status !== "CANCELLED" || existing.status !== "PENDING") {
      throw new AppError(
        400,
        "Invalid status transition. Use the approve/reject endpoints to process refunds.",
      );
    }

    const refund = await prisma.refund.update({
      where: { id: req.params.id },
      data: { status },
      include: refundInclude(),
    });

    return res.json(refund);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

export const refundsRouter = router;
