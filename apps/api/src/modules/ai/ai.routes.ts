import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { UserRole } from "@lms/types";
import {
  requireAuth,
  requireRole,
  requireSuperAdmin,
} from "../../middleware/auth.middleware";
import {
  AI_GENERATION_TYPES,
  ALLOWED_AI_MODELS,
  AIGenerationContext,
  AIGenerationType,
  deleteGeminiApiKey,
  generate,
  getAIStatus,
  healthCheck,
  saveAIModel,
  saveGeminiApiKey,
} from "../../services/ai.service";
import { AppError, handleControllerError } from "../../utils/errors";

const router = Router();

// Generation costs tokens — cap per user per minute
const generateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests. Please wait a moment and try again." },
});

router.use(requireAuth);

// ─── SUPER_ADMIN: configuration management ───────────────────────────────────

router.get("/status", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    res.json(await getAIStatus());
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    res.status(statusCode).json(body);
  }
});

const apiKeyBodySchema = z.object({
  apiKey: z.string().min(20).max(200),
});
const modelBodySchema = z.object({
  model: z.enum(ALLOWED_AI_MODELS),
});

router.post("/api-key", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const parsed = apiKeyBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "apiKey is required");
    }
    await saveGeminiApiKey(parsed.data.apiKey);
    res.json({ message: "API key saved" });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    res.status(statusCode).json(body);
  }
});

router.delete("/api-key", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await deleteGeminiApiKey();
    res.json({ message: "API key removed" });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    res.status(statusCode).json(body);
  }
});

router.post("/model", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const parsed = modelBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, `model must be one of: ${ALLOWED_AI_MODELS.join(", ")}`);
    }
    await saveAIModel(parsed.data.model);
    res.json({ message: `Model set to ${parsed.data.model}` });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    res.status(statusCode).json(body);
  }
});

router.post("/health-check", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    res.json(await healthCheck());
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    res.status(statusCode).json(body);
  }
});

// ─── ADMIN / INSTRUCTOR: content generation ──────────────────────────────────

const generateBodySchema = z.object({
  type: z.enum(AI_GENERATION_TYPES),
  prompt: z.string().min(3).max(4000),
  context: z
    .object({
      courseTitle: z.string().max(200).optional(),
      courseDescription: z.string().max(2000).optional(),
      moduleTitle: z.string().max(200).optional(),
      lessonTitle: z.string().max(200).optional(),
      difficulty: z.string().max(30).optional(),
      questionCount: z.number().int().min(1).max(30).optional(),
    })
    .optional(),
});

router.post(
  "/generate",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR]),
  generateLimiter,
  async (req: Request, res: Response) => {
    try {
      const parsed = generateBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, "Invalid request: type and prompt are required");
      }
      const result = await generate(
        parsed.data.type as AIGenerationType,
        parsed.data.prompt,
        (parsed.data.context ?? {}) as AIGenerationContext,
      );
      res.json(result);
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
);

export { router as aiRouter };
