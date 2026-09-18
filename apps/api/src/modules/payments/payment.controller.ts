import type { Request, Response } from "express";
import { paymentService } from "./payment.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { authService } from "../auth/auth.service";
import { handleControllerError } from "../../utils/errors";
import { prisma } from "../../utils/prisma";
import { UserRole } from "@lms/types";

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const val = parseInt(match[1], 10);
  switch (match[2]) {
    case "d":
      return val * 24 * 60 * 60 * 1000;
    case "h":
      return val * 60 * 60 * 1000;
    case "m":
      return val * 60 * 1000;
    case "s":
      return val * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

const ACCESS_TOKEN_MAX_AGE = parseExpiryToMs(process.env.JWT_EXPIRY || "7d");

export const paymentController = {
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { packageId, name, email, phone, couponCode } = req.body;
      if (!packageId) {
        return res.status(400).json({ error: "packageId is required" });
      }

      let userId = req.user?.userId;

      // Check for existing enrollment before proceeding
      await paymentService.checkNotEnrolled(packageId, userId, email);

      // If not authenticated, create user account (guest checkout)
      if (!userId) {
        if (!name || !email) {
          return res
            .status(400)
            .json({ error: "name and email are required for guest checkout" });
        }
        const result = await paymentService.createGuestUser(
          name,
          email,
          typeof phone === "string" ? phone : undefined,
        );
        userId = result.user.id;

        // Set JWT cookie so subsequent calls are authenticated
        res.cookie("accessToken", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: ACCESS_TOKEN_MAX_AGE,
        });
      }

      const orderResult = await paymentService.createOrder(
        userId,
        packageId,
        couponCode,
      );
      return res.status(200).json({
        ...orderResult,
        isNewUser: !req.user?.userId,
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async verifyPayment(req: Request, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res
          .status(400)
          .json({ error: "Missing payment verification fields" });
      }
      const result = await paymentService.verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      );
      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getAvailableBatches(req: AuthRequest, res: Response) {
    try {
      const { packageId } = req.query;
      if (!packageId || typeof packageId !== "string") {
        return res
          .status(400)
          .json({ error: "packageId query param is required" });
      }
      const batches = await paymentService.getAvailableBatches(packageId);
      return res.status(200).json(batches);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async enrollInBatch(req: AuthRequest, res: Response) {
    try {
      const { paymentId, batchId, name, email, phone } = req.body;
      if (!paymentId || !batchId) {
        return res
          .status(400)
          .json({ error: "paymentId and batchId are required" });
      }
      const result = await paymentService.enrollInBatch(
        paymentId,
        batchId,
        name || "",
        email || "",
        typeof phone === "string" ? phone : undefined,
      );
      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async createConsentEnrollment(req: AuthRequest, res: Response) {
    try {
      const { paymentId, name, email, phone } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }
      const result = await paymentService.createConsentEnrollment(
        paymentId,
        name || "",
        email || "",
        typeof phone === "string" ? phone : undefined,
      );
      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getAdminPayments(req: AuthRequest, res: Response) {
    try {
      const { page, limit } = req.query;
      const result = await paymentService.getAdminPayments({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return res.status(200).json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getRevenueStats(req: AuthRequest, res: Response) {
    try {
      const stats = await paymentService.getRevenueStats();
      return res.status(200).json(stats);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  // GET /:paymentId/invoice — downloads the invoice PDF using the exact
  // same generator as the emailed invoice (invoice.service.ts).
  async downloadInvoice(req: AuthRequest, res: Response) {
    try {
      const { paymentId } = req.params;
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: { select: { name: true, email: true } },
          package: { select: { name: true } },
          course: { select: { title: true } },
        },
      });
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      const isOwner = !!req.user && payment.userId === req.user.userId;
      const isAdmin =
        !!req.user &&
        (req.user.role === UserRole.ADMIN ||
          req.user.role === UserRole.SUPER_ADMIN);
      // Guests have no session (course verify sets no cookie), so they
      // prove ownership with the Razorpay order+payment ids from their own
      // completed checkout (both are random, unguessable values).
      const { razorpayOrderId, razorpayPaymentId } = req.query as {
        razorpayOrderId?: string;
        razorpayPaymentId?: string;
      };
      const hasProof =
        !!razorpayOrderId &&
        !!razorpayPaymentId &&
        payment.razorpayOrderId === razorpayOrderId &&
        payment.razorpayPaymentId === razorpayPaymentId;
      if (!isOwner && !isAdmin && !hasProof) {
        return res.status(403).json({ error: "Not allowed" });
      }

      const { generateInvoicePdf } =
        await import("../../services/invoice.service");
      const pdf = generateInvoicePdf({
        invoiceNumber: `INV-${payment.id.slice(-8).toUpperCase()}`,
        userName: payment.user.name,
        userEmail: payment.user.email,
        packageName:
          payment.package?.name ?? payment.course?.title ?? "Course Package",
        amount: payment.amount,
        discountAmount: payment.discountAmount,
        date: payment.createdAt,
        paymentStatus:
          payment.status === "PAID" ||
          payment.status === "PENDING" ||
          payment.status === "REFUNDED"
            ? payment.status
            : undefined,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${payment.id.slice(-8)}.pdf"`,
      );
      return res.send(pdf);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
