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
};
