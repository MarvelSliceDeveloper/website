import { Router, type Request, type Response } from "express";
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

router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const webhooks = await prisma.notificationWebhook.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ webhooks });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch webhooks",
    });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, url, events, active } = req.body;
    if (!name || !url || !events) {
      return res
        .status(400)
        .json({ error: "name, url, and events are required" });
    }
    if (!Array.isArray(events)) {
      return res
        .status(400)
        .json({ error: "events must be an array of strings" });
    }

    const webhook = await prisma.notificationWebhook.create({
      data: { name, url, events, active: active ?? true },
    });
    return res.status(201).json({ webhook });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to create webhook",
    });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, url, events, active } = req.body;

    const existing = await prisma.notificationWebhook.findUnique({
      where: { id },
    });
    if (!existing) return res.status(404).json({ error: "Webhook not found" });

    const webhook = await prisma.notificationWebhook.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(events !== undefined && { events }),
        ...(active !== undefined && { active }),
      },
    });
    return res.json({ webhook });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to update webhook",
    });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.notificationWebhook.findUnique({
      where: { id },
    });
    if (!existing) return res.status(404).json({ error: "Webhook not found" });

    await prisma.notificationWebhook.delete({ where: { id } });
    return res.json({ message: "Webhook deleted successfully" });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to delete webhook",
    });
  }
});

router.post("/:id/test", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const webhook = await prisma.notificationWebhook.findUnique({
      where: { id },
    });
    if (!webhook) return res.status(404).json({ error: "Webhook not found" });

    const payload = {
      event: "test",
      timestamp: new Date().toISOString(),
      message: "This is a test webhook from LMS Portal",
      source: "lms-api",
    };

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    await prisma.notificationWebhook.update({
      where: { id },
      data: { lastFiredAt: new Date() },
    });

    return res.json({
      message: "Test webhook sent",
      statusCode: response.status,
      statusText: response.statusText,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to test webhook",
    });
  }
});

export default router;
