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

const sampleData: Record<string, string> = {
  userName: "John Doe",
  userEmail: "john@example.com",
  courseTitle: "Introduction to Web Development",
  batchName: "Web Dev Batch Jan 2026",
  sessionTitle: "Live Q&A Session",
  sessionDate: "January 20, 2026 at 6:00 PM",
  joinUrl: "https://teams.microsoft.com/l/meetup-join/example",
  resetLink: "https://lms.example.com/reset-password?token=sample-token",
  certificateNumber: "CERT-2026-00001",
  certificateUrl: "https://lms.example.com/certificates/sample",
  supportTicketId: "TKT-001",
  ticketSubject: "Course Access Issue",
  adminName: "Admin User",
  platformName: "MarvelSlice LMS",
};

// GET / — List all email templates
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        subject: true,
        body: true,
        variables: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ templates });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch templates",
    });
  }
});

// POST / — Create new email template
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, subject, body, variables, isActive } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Template name is required" });
    }
    if (!subject || typeof subject !== "string") {
      return res.status(400).json({ error: "Subject is required" });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        body: body || "",
        variables: variables || [],
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return res.status(201).json({ template });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to create template",
    });
  }
});

// GET /:id — Get template detail
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    return res.json({ template });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch template",
    });
  }
});

// PUT /:id — Update template
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { subject, body, variables, isActive } = req.body;

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Template not found" });
    }

    const updateData: Record<string, unknown> = {};
    if (subject !== undefined) updateData.subject = subject;
    if (body !== undefined) updateData.body = body;
    if (variables !== undefined) updateData.variables = variables;
    if (isActive !== undefined) updateData.isActive = isActive;

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return res.json({ template });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to update template",
    });
  }
});

// POST /:id/preview — Return rendered HTML with sample data
router.post("/:id/preview", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const vars = (template.variables as string[]) || [];
    let renderedSubject = template.subject;
    let renderedBody = template.body;

    for (const variable of vars) {
      const placeholder = `{{${variable}}}`;
      const value = sampleData[variable] || `[Sample ${variable}]`;
      renderedSubject = renderedSubject.replaceAll(placeholder, value);
      renderedBody = renderedBody.replaceAll(placeholder, value);
    }

    return res.json({
      html: renderedBody,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to preview template",
    });
  }
});

export default router;
