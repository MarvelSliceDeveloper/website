import { Router, type Response } from "express";
import fs from "fs";
import path from "path";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

const messagesDir = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "web",
  "messages",
);

function getLocaleFiles(): string[] {
  try {
    if (!fs.existsSync(messagesDir)) return [];
    return fs
      .readdirSync(messagesDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

function countKeys(obj: Record<string, unknown>, prefix = ""): number {
  let count = 0;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      count += countKeys(val as Record<string, unknown>, `${prefix}${key}.`);
    } else {
      count++;
    }
  }
  return count;
}

// GET /locales — List available locales with key counts
router.get("/locales", async (_req: AuthRequest, res: Response) => {
  try {
    const locales = getLocaleFiles();
    const enPath = path.join(messagesDir, "en.json");
    let enKeys = 0;

    if (fs.existsSync(enPath)) {
      const enData = JSON.parse(fs.readFileSync(enPath, "utf-8")) as Record<
        string,
        unknown
      >;
      enKeys = countKeys(enData);
    }

    const result = locales.map((locale) => {
      const filePath = path.join(messagesDir, `${locale}.json`);
      let keyCount = 0;
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<
          string,
          unknown
        >;
        keyCount = countKeys(data);
      } catch {
        keyCount = 0;
      }
      const completion = enKeys > 0 ? Math.round((keyCount / enKeys) * 100) : 0;
      return { locale, keyCount, completion };
    });

    return res.json({ data: result, enKeys });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to list locales",
    });
  }
});

// GET /:locale — Get translation file content
router.get("/:locale", async (req: AuthRequest, res: Response) => {
  try {
    const { locale } = req.params;
    const filePath = path.join(messagesDir, `${locale}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: `Locale "${locale}" not found` });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return res.json({ data });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to read locale",
    });
  }
});

// PUT /:locale — Update translation file
router.put("/:locale", async (req: AuthRequest, res: Response) => {
  try {
    const { locale } = req.params;
    const data = req.body;

    if (!data || typeof data !== "object") {
      return res
        .status(400)
        .json({ error: "Translation data must be a JSON object" });
    }

    const filePath = path.join(messagesDir, `${locale}.json`);
    fs.mkdirSync(messagesDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    return res.json({ message: `Locale "${locale}" updated` });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update locale",
    });
  }
});

// POST /create — Create new locale (copy from en.json)
router.post("/create", async (req: AuthRequest, res: Response) => {
  try {
    const { locale } = req.body as { locale?: string };

    if (!locale || typeof locale !== "string") {
      return res.status(400).json({ error: "locale code is required" });
    }

    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
      return res
        .status(400)
        .json({ error: "Invalid locale format (e.g. 'en', 'hi', 'fr-FR')" });
    }

    const targetPath = path.join(messagesDir, `${locale}.json`);
    if (fs.existsSync(targetPath)) {
      return res
        .status(409)
        .json({ error: `Locale "${locale}" already exists` });
    }

    const enPath = path.join(messagesDir, "en.json");
    if (!fs.existsSync(enPath)) {
      return res.status(404).json({ error: "Base locale (en.json) not found" });
    }

    const template = fs.readFileSync(enPath, "utf-8");
    fs.mkdirSync(messagesDir, { recursive: true });
    fs.writeFileSync(targetPath, template, "utf-8");

    return res
      .status(201)
      .json({ message: `Locale "${locale}" created from en.json` });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create locale",
    });
  }
});

export { router as i18nRouter };
