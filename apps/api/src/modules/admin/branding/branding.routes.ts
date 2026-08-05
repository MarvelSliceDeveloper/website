import { Router, type Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../../../utils/prisma";
import { ensureUploadsDir } from "../../../utils/uploads";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|svg|ico|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = Router();

const publicRouter = Router();

const uploadsDir = ensureUploadsDir(".");

const BRAND_KEY = "branding";

interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  customCss: string;
  companyName: string;
}

function parseBranding(value: string): BrandingConfig {
  try {
    return JSON.parse(value) as BrandingConfig;
  } catch {
    return {
      primaryColor: "#2551d9",
      secondaryColor: "#1e40af",
      accentColor: "#10b981",
      logoUrl: "",
      faviconUrl: "",
      customCss: "",
      companyName: "",
    };
  }
}

// Public endpoint — no auth required
publicRouter.get("/", async (_req, res: Response) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: BRAND_KEY },
    });
    const config = setting ? parseBranding(setting.value) : parseBranding("{}");
    return res.json({ data: config });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch branding",
    });
  }
});

// ── Admin routes (require auth) ──
router.use(requireAuth);
router.use(requireSuperAdmin);

// GET / — Get current branding config
router.get("/", async (_req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: BRAND_KEY },
    });

    const config = setting ? parseBranding(setting.value) : parseBranding("{}");
    return res.json({ data: config });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch branding",
    });
  }
});

// PUT / — Update branding config
router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const config: Partial<BrandingConfig> = req.body;

    const existing = await prisma.systemSetting.findUnique({
      where: { key: BRAND_KEY },
    });

    const current = existing
      ? parseBranding(existing.value)
      : parseBranding("{}");
    const updated = { ...current, ...config };

    if (existing) {
      await prisma.systemSetting.update({
        where: { key: BRAND_KEY },
        data: { value: JSON.stringify(updated) },
      });
    } else {
      await prisma.systemSetting.create({
        data: {
          key: BRAND_KEY,
          value: JSON.stringify(updated),
          type: "json",
          description: "Platform branding configuration",
        },
      });
    }

    return res.json({ data: updated });
  } catch (error: unknown) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to update branding",
    });
  }
});

function saveUpload(
  buffer: Buffer,
  originalName: string,
  subdir: string,
): string {
  const ext = path.extname(originalName);
  const filename = `${subdir}-${Date.now()}${ext}`;
  const dest = path.join(uploadsDir, subdir, filename);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buffer);
  return `/uploads/${subdir}/${filename}`;
}

// POST /logo — Upload logo
router.post(
  "/logo",
  upload.single("logo"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Logo file is required" });
      }

      const url = saveUpload(
        req.file.buffer,
        req.file.originalname,
        "branding",
      );

      const existing = await prisma.systemSetting.findUnique({
        where: { key: BRAND_KEY },
      });
      const current = existing
        ? parseBranding(existing.value)
        : parseBranding("{}");
      current.logoUrl = url;

      if (existing) {
        await prisma.systemSetting.update({
          where: { key: BRAND_KEY },
          data: { value: JSON.stringify(current) },
        });
      } else {
        await prisma.systemSetting.create({
          data: {
            key: BRAND_KEY,
            value: JSON.stringify(current),
            type: "json",
            description: "Platform branding configuration",
          },
        });
      }

      return res.json({ data: current });
    } catch (error: unknown) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to upload logo",
      });
    }
  },
);

// POST /favicon — Upload favicon
router.post(
  "/favicon",
  upload.single("favicon"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Favicon file is required" });
      }

      const url = saveUpload(
        req.file.buffer,
        req.file.originalname,
        "branding",
      );

      const existing = await prisma.systemSetting.findUnique({
        where: { key: BRAND_KEY },
      });
      const current = existing
        ? parseBranding(existing.value)
        : parseBranding("{}");
      current.faviconUrl = url;

      if (existing) {
        await prisma.systemSetting.update({
          where: { key: BRAND_KEY },
          data: { value: JSON.stringify(current) },
        });
      } else {
        await prisma.systemSetting.create({
          data: {
            key: BRAND_KEY,
            value: JSON.stringify(current),
            type: "json",
            description: "Platform branding configuration",
          },
        });
      }

      return res.json({ data: current });
    } catch (error: unknown) {
      return res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to upload favicon",
      });
    }
  },
);

export { router as brandingRouter, publicRouter as publicBrandingRouter };
