import { Request, Response } from "express";
import { handleControllerError } from "../../utils/errors";
import { AuthRequest } from "../../middleware/auth.middleware";
import * as service from "./manual-orders.service";

export const manualOrdersController = {
  async getOptions(req: Request, res: Response) {
    try {
      const result = await service.getPaymentOptions(req.params.id);
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async submit(req: AuthRequest, res: Response) {
    try {
      const { plan, transactionId } = req.body;
      if (!plan || !transactionId) {
        return res
          .status(400)
          .json({ error: "plan and transactionId required" });
      }
      const order = await service.submitManualOrder(
        req.user!.userId,
        req.params.id,
        plan,
        transactionId,
      );
      return res.status(201).json({ order });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async mine(req: AuthRequest, res: Response) {
    try {
      const orders = await service.listMyOrders(req.user!.userId);
      return res.json({ items: orders });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getPackageOptions(req: Request, res: Response) {
    try {
      const result = await service.getPackagePaymentOptions(req.params.id);
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async submitPackage(req: AuthRequest, res: Response) {
    try {
      const {
        transactionId,
        batchId,
        userState,
        userAddress,
        userGstin,
        name,
        email,
        phone,
      } = req.body ?? {};
      if (!transactionId) {
        return res.status(400).json({ error: "transactionId required" });
      }
      const order = await service.submitPackageManualOrder(
        req.user?.userId ?? null,
        req.params.id,
        transactionId,
        {
          batchId,
          userState,
          userAddress,
          userGstin,
          guestName: name,
          guestEmail: email,
          guestPhone: phone,
        },
      );
      return res.status(201).json({ order });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async list(req: Request, res: Response) {
    try {
      const { status, page, limit } = req.query;
      const result = await service.listManualOrders({
        status: status as string | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async approve(req: AuthRequest, res: Response) {
    try {
      const result = await service.approveManualOrder(
        req.params.id,
        req.user!.userId,
      );
      return res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async reject(req: AuthRequest, res: Response) {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: "reason required" });
      }
      const order = await service.rejectManualOrder(
        req.params.id,
        req.user!.userId,
        reason,
      );
      return res.json({ order });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getSettings(req: Request, res: Response) {
    try {
      const settings = await service.getSettings();
      return res.json({ settings });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async updateSettings(req: AuthRequest, res: Response) {
    try {
      const { upiId, payeeName, isManualEnabled } = req.body;
      if (!upiId || !payeeName || typeof isManualEnabled !== "boolean") {
        return res
          .status(400)
          .json({ error: "upiId, payeeName, isManualEnabled required" });
      }
      const settings = await service.updateSettings(req.user!.userId, {
        upiId,
        payeeName,
        isManualEnabled,
      });
      return res.json({ settings });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
