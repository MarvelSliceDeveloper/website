import type { Request, Response } from "express";
import { paymentService } from "./payment.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { authService } from "../auth/auth.service";

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.error === "object" && err.error !== null) {
      const inner = err.error as Record<string, unknown>;
      if (typeof inner.description === "string") return inner.description;
      if (typeof inner.code === "string") return inner.code;
    }
    return JSON.stringify(error);
  }
  return String(error);
}

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const val = parseInt(match[1], 10);
  switch (match[2]) {
    case "d": return val * 24 * 60 * 60 * 1000;
    case "h": return val * 60 * 60 * 1000;
    case "m": return val * 60 * 1000;
    case "s": return val * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

const ACCESS_TOKEN_MAX_AGE = parseExpiryToMs(process.env.JWT_EXPIRY || "7d");

export const paymentController = {
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { packageId, name, email } = req.body;
      if (!packageId) {
        return res.status(400).json({ error: "packageId is required" });
      }

      let userId = req.user?.userId;

      // If not authenticated, create user account (guest checkout)
      if (!userId) {
        if (!name || !email) {
          return res.status(400).json({ error: "name and email are required for guest checkout" });
        }
        const result = await paymentService.createGuestUser(name, email);
        userId = result.user.id;

        // Set JWT cookie so subsequent calls are authenticated
        res.cookie("accessToken", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: ACCESS_TOKEN_MAX_AGE,
        });
      }

      const orderResult = await paymentService.createOrder(userId, packageId);
      return res.status(200).json({
        ...orderResult,
        isNewUser: !req.user?.userId,
      });
    } catch (error: unknown) {
      return res.status(400).json({ error: extractErrorMessage(error) });
    }
  },

  async verifyPayment(req: Request, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment verification fields" });
      }
      const result = await paymentService.verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      );
      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({ error: extractErrorMessage(error) });
    }
  },

  async getAvailableBatches(req: AuthRequest, res: Response) {
    try {
      const { packageId } = req.query;
      if (!packageId || typeof packageId !== "string") {
        return res.status(400).json({ error: "packageId query param is required" });
      }
      const batches = await paymentService.getAvailableBatches(packageId);
      return res.status(200).json(batches);
    } catch (error: unknown) {
      return res.status(400).json({ error: extractErrorMessage(error) });
    }
  },

  async enrollInBatch(req: AuthRequest, res: Response) {
    try {
      const { paymentId, batchId, name, email } = req.body;
      if (!paymentId || !batchId) {
        return res.status(400).json({ error: "paymentId and batchId are required" });
      }
      const result = await paymentService.enrollInBatch(paymentId, batchId, name || "", email || "");
      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({ error: extractErrorMessage(error) });
    }
  },

  async createConsentEnrollment(req: AuthRequest, res: Response) {
    try {
      const { paymentId, name, email } = req.body;
      if (!paymentId) {
        return res.status(400).json({ error: "paymentId is required" });
      }
      const result = await paymentService.createConsentEnrollment(paymentId, name || "", email || "");
      return res.status(200).json(result);
    } catch (error: unknown) {
      return res.status(400).json({ error: extractErrorMessage(error) });
    }
  },

  async getAdminPayments(req: AuthRequest, res: Response) {
    try {
      const payments = await paymentService.getAdminPayments();
      return res.status(200).json(payments);
    } catch (error: unknown) {
      return res.status(500).json({ error: "Failed to fetch payments" });
    }
  },

  async getRevenueStats(req: AuthRequest, res: Response) {
    try {
      const stats = await paymentService.getRevenueStats();
      return res.status(200).json(stats);
    } catch (error: unknown) {
      return res.status(500).json({ error: "Failed to fetch revenue stats" });
    }
  },
};
