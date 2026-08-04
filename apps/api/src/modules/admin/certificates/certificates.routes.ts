import { Router, type Response } from "express";
import { prisma } from "../../../utils/prisma";
import {
  requireAuth,
  requireRole,
  type AuthRequest,
} from "../../../middleware/auth.middleware";
import { UserRole } from "@lms/types";

const router = Router();

router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

// GET /stats — Certificate statistics (must be before /:id)
router.get("/stats", async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, issuedThisMonth, revoked] = await Promise.all([
      prisma.certificate.count(),
      prisma.certificate.count({
        where: { issuedAt: { gte: startOfMonth } },
      }),
      prisma.certificate.count({
        where: { status: "REVOKED" },
      }),
    ]);

    return res.json({
      total,
      issuedThisMonth,
      revoked,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch certificate stats",
    });
  }
});

// GET / — List all certificates with user name, course title, pagination
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit as string) || 20),
    );
    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        skip,
        take: limit,
        orderBy: { issuedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { id: true, title: true } },
        },
      }),
      prisma.certificate.count(),
    ]);

    return res.json({
      certificates: certificates.map((c) => ({
        id: c.id,
        studentName: c.user.name,
        courseName: c.course?.title ?? "N/A",
        certificateNumber: c.certificateNumber,
        issuedAt: c.issuedAt,
        status: c.status,
      })),
      total,
      page,
      limit,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch certificates",
    });
  }
});

// GET /:id — Certificate detail
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    return res.json({ data: certificate });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch certificate",
    });
  }
});

// PUT /:id/revoke — Revoke certificate
router.put("/:id/revoke", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const certificate = await prisma.certificate.findUnique({ where: { id } });
    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    if (certificate.status === "REVOKED") {
      return res.status(400).json({ error: "Certificate is already revoked" });
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    return res.json({ data: updated, message: "Certificate revoked" });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to revoke certificate",
    });
  }
});

export default router;
