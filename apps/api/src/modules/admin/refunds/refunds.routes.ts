import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";
import { paginate } from "../../../utils/paginate";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page, limit } = paginate({
      page: Number(req.query.page) || undefined,
      limit: Number(req.query.limit) || undefined,
    });

    const [items, total] = await Promise.all([
      prisma.refund.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          payment: true,
          initiatedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.refund.count(),
    ]);

    return res.json({ items, total, page, limit });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch refunds",
    });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId || !amount) {
      return res.status(400).json({ error: "paymentId and amount are required" });
    }

    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number (in paise)" });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        refunds: { select: { amount: true } },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const existingRefundTotal = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
    const remaining = payment.amount - existingRefundTotal;

    if (amount > remaining) {
      return res.status(400).json({
        error: `Refund amount exceeds remaining balance. Available: ${remaining} paise`,
      });
    }

    const refund = await prisma.refund.create({
      data: {
        paymentId,
        amount,
        reason: reason || null,
        initiatedById: req.user!.userId,
        status: "PENDING",
      },
      include: {
        payment: true,
        initiatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // TODO: integrate Razorpay refund API here if configured

    return res.status(201).json(refund);
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to initiate refund",
    });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const refund = await prisma.refund.findUnique({
      where: { id: req.params.id },
      include: {
        payment: true,
        initiatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!refund) {
      return res.status(404).json({ error: "Refund not found" });
    }

    return res.json(refund);
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch refund",
    });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status is required" });
    }

    const existing = await prisma.refund.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Refund not found" });
    }

    const refund = await prisma.refund.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        payment: true,
        initiatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json(refund);
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update refund",
    });
  }
});

export const refundsRouter = router;
