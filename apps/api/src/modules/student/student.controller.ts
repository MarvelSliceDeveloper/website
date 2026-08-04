import { Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { studentService } from "./student.service";
import { prisma } from "../../utils/prisma";
import { handleControllerError } from "../../utils/errors";

export const studentController = {
  async listOverdueAssignments(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const items = await studentService.getOverdueAssignments(req.user.userId);
      return res.status(200).json({ items });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getContinueLearning(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const items = await studentService.getContinueLearning(req.user.userId);
      return res.status(200).json({ items: items.continueLearning });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getResults(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const items = await studentService.getResults(req.user.userId);
      return res.status(200).json({ items });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getPaymentHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const payments = await prisma.payment.findMany({
        where: { userId: req.user.userId, status: { not: "PENDING" } },
        include: {
          package: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          packageName: p.package.name,
          razorpayPaymentId: p.razorpayPaymentId,
          createdAt: p.createdAt,
        })),
      });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          timezone: true,
          address: true,
          state: true,
          country: true,
          role: true,
        },
      });

      return res.json({ user });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user)
        return res.status(401).json({ error: "Authentication required" });

      const { name, phone, timezone, address, state, country } = req.body;
      const updateData: Record<string, string> = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (address !== undefined) updateData.address = address;
      if (state !== undefined) updateData.state = state;
      if (country !== undefined) updateData.country = country;

      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          timezone: true,
          address: true,
          state: true,
          country: true,
          role: true,
        },
      });

      return res.json({ user });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      return res.status(statusCode).json(body);
    }
  },
};
