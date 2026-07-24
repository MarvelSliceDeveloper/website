import { Router, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
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

const certificateUploadsDir = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "uploads",
  "certificate-templates",
);
fs.mkdirSync(certificateUploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, certificateUploadsDir),
    filename: (_req, file, cb) =>
      cb(null, `template-${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files are allowed")),
});

// GET / — List all templates
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.certificateTemplate.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return res.json({ templates });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch templates",
    });
  }
});

// GET /:id — Single template
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: req.params.id },
    });
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

// POST / — Create template
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
      borderColor,
      accentColor,
      title,
      subtitle,
      footerText,
      logoUrl,
      isDefault,
      backgroundPattern,
      layout,
      borderWidth,
      borderRadius,
      showBorder,
      showSignatureLine,
      showVerificationUrl,
      fontFamily,
      titleFontSize,
      nameFontSize,
      pdfTemplateType,
      pdfTemplateFields,
    } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required" });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        name,
        primaryColor: primaryColor || "#3b82f6",
        secondaryColor: secondaryColor || "#93c5fd",
        backgroundColor: backgroundColor || "#f8fafc",
        textColor: textColor || "#1e293b",
        borderColor: borderColor || primaryColor || "#3b82f6",
        accentColor: accentColor || secondaryColor || "#93c5fd",
        title: title || "CERTIFICATE OF COMPLETION",
        subtitle: subtitle || "This certifies that",
        footerText: footerText || null,
        logoUrl: logoUrl || null,
        isDefault: isDefault || false,
        backgroundPattern: backgroundPattern || "none",
        layout: layout || "classic",
        borderWidth: borderWidth ?? 2,
        borderRadius: borderRadius ?? 5,
        showBorder: showBorder ?? true,
        showSignatureLine: showSignatureLine ?? true,
        showVerificationUrl: showVerificationUrl ?? true,
        fontFamily: fontFamily || "helvetica",
        titleFontSize: titleFontSize ?? 28,
        nameFontSize: nameFontSize ?? 22,
        pdfTemplateType: pdfTemplateType || "jsPdf",
        pdfTemplateFields: pdfTemplateFields || null,
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

// PUT /:id — Update template
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.certificateTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Template not found" });
    }

    const {
      name,
      primaryColor,
      secondaryColor,
      backgroundColor,
      textColor,
      borderColor,
      accentColor,
      title,
      subtitle,
      footerText,
      logoUrl,
      isDefault,
      backgroundPattern,
      layout,
      borderWidth,
      borderRadius,
      showBorder,
      showSignatureLine,
      showVerificationUrl,
      fontFamily,
      titleFontSize,
      nameFontSize,
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault && !existing.isDefault) {
      await prisma.certificateTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.certificateTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(textColor !== undefined && { textColor }),
        ...(borderColor !== undefined && { borderColor }),
        ...(accentColor !== undefined && { accentColor }),
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(footerText !== undefined && { footerText }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(isDefault !== undefined && { isDefault }),
        ...(backgroundPattern !== undefined && { backgroundPattern }),
        ...(layout !== undefined && { layout }),
        ...(borderWidth !== undefined && { borderWidth }),
        ...(borderRadius !== undefined && { borderRadius }),
        ...(showBorder !== undefined && { showBorder }),
        ...(showSignatureLine !== undefined && { showSignatureLine }),
        ...(showVerificationUrl !== undefined && { showVerificationUrl }),
        ...(fontFamily !== undefined && { fontFamily }),
        ...(titleFontSize !== undefined && { titleFontSize }),
        ...(nameFontSize !== undefined && { nameFontSize }),
      },
    });

    return res.json({ template });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to update template",
    });
  }
});

// DELETE /:id — Delete template
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.certificateTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Template not found" });
    }

    if (existing.isDefault) {
      return res
        .status(400)
        .json({ error: "Cannot delete the default template" });
    }

    await prisma.certificateTemplate.delete({ where: { id } });
    return res.json({ message: "Template deleted" });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to delete template",
    });
  }
});

// POST /:id/upload-pdf — Upload a PDF certificate template with placeholder fields
router.post(
  "/:id/upload-pdf",
  upload.single("pdf"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await prisma.certificateTemplate.findUnique({
        where: { id },
      });
      if (!existing) {
        return res.status(404).json({ error: "Template not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "PDF file is required" });
      }

      const relativePath = path.join(
        "certificate-templates",
        req.file.filename,
      );
      const pdfTemplateFields = req.body.pdfTemplateFields
        ? JSON.parse(req.body.pdfTemplateFields)
        : [
            {
              key: "studentName",
              x: 0,
              y: 130,
              fontSize: 22,
              color: "#1e293b",
              align: "center",
            },
            {
              key: "courseName",
              x: 0,
              y: 170,
              fontSize: 18,
              color: "#1e293b",
              align: "center",
            },
            {
              key: "date",
              x: 0,
              y: 200,
              fontSize: 10,
              color: "#64748b",
              align: "center",
            },
            {
              key: "certificateNumber",
              x: 120,
              y: 240,
              fontSize: 10,
              color: "#64748b",
              align: "left",
            },
          ];

      const template = await prisma.certificateTemplate.update({
        where: { id },
        data: {
          pdfTemplateType: "uploadedPdf",
          pdfTemplateUrl: relativePath,
          pdfTemplateFields,
        },
      });

      return res.json({ template });
    } catch (error: unknown) {
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload PDF template",
      });
    }
  },
);

// DELETE /:id/pdf-template — Remove the uploaded PDF template, revert to jsPDF
router.delete("/:id/pdf-template", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.certificateTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Template not found" });
    }

    const template = await prisma.certificateTemplate.update({
      where: { id },
      data: {
        pdfTemplateType: "jsPdf",
        pdfTemplateUrl: null,
        pdfTemplateFields: null,
      },
    });

    return res.json({ template });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove PDF template",
    });
  }
});

// POST /:id/set-default — Set template as default
router.post("/:id/set-default", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.certificateTemplate.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Unset all other defaults
    await prisma.certificateTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set this one as default
    const template = await prisma.certificateTemplate.update({
      where: { id },
      data: { isDefault: true },
    });

    return res.json({ template });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to set default template",
    });
  }
});

export default router;
