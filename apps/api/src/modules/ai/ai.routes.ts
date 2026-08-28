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
  AIProvider,
  AIGenerationContext,
  AIGenerationType,
  deleteProviderApiKey,
  generate,
  getActiveProvider,
  getAIStatus,
  healthCheck,
  listOpenRouterModels,
  saveActiveProvider,
  saveProviderApiKey,
  saveProviderModel,
} from "../../services/ai.service";
import { AppError, handleControllerError } from "../../utils/errors";

const router = Router();

// Generation costs tokens — cap per user per minute
const generateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many AI requests. Please wait a moment and try again.",
  },
});

router.use(requireAuth);

// ─── SUPER_ADMIN: configuration management ───────────────────────────────────

router.get(
  "/status",
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      res.json(await getAIStatus());
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
);

const providerSchema = z.enum(["gemini", "openrouter"]);
const apiKeyBodySchema = z.object({
  provider: providerSchema.optional(),
  apiKey: z.string().min(20).max(200),
});
const modelBodySchema = z.object({
  provider: providerSchema.optional(),
  model: z.string().min(1).max(200),
});

async function resolveProvider(provider?: string): Promise<AIProvider> {
  if (provider) {
    const parsed = providerSchema.safeParse(provider);
    if (!parsed.success) {
      throw new AppError(400, "provider must be one of: gemini, openrouter");
    }
    return parsed.data;
  }
  return getActiveProvider();
}

router.post(
  "/provider",
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const parsed = providerSchema.safeParse(req.body?.provider);
      if (!parsed.success) {
        throw new AppError(400, "provider must be one of: gemini, openrouter");
      }
      await saveActiveProvider(parsed.data);
      res.json({ message: `Provider set to ${parsed.data}` });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
);

router.post(
  "/api-key",
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const parsed = apiKeyBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, "apiKey is required");
      }
      const provider = await resolveProvider(parsed.data.provider);
      await saveProviderApiKey(provider, parsed.data.apiKey);
      res.json({ message: "API key saved" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
);

router.delete(
  "/api-key",
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const provider = await resolveProvider(
        (req.query.provider as string) || undefined,
      );
      await deleteProviderApiKey(provider);
      res.json({ message: "API key removed" });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
);

router.post(
  "/model",
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const parsed = modelBodySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, "model is required");
      }
      const provider = await resolveProvider(parsed.data.provider);
      await saveProviderModel(provider, parsed.data.model);
      res.json({ message: `Model set to ${parsed.data.model}` });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
);

router.get(
  "/openrouter/models",
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      const items = await listOpenRouterModels();
      res.json({ provider: "openrouter", items });
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
);

router.post(
  "/health-check",
  requireSuperAdmin,
  async (req: Request, res: Response) => {
    try {
      res.json(await healthCheck());
    } catch (err: unknown) {
      const { statusCode, body } = handleControllerError(err, (req as any).log);
      res.status(statusCode).json(body);
    }
  },
);

// ─── ADMIN / INSTRUCTOR: content generation ──────────────────────────────────

const generateBodySchema = z.object({
  type: z.enum(AI_GENERATION_TYPES),
  prompt: z.string().min(3).max(4000),
  context: z
    .object({
      courseTitle: z.string().max(200).optional(),
      courseDescription: z.string().max(2000).optional(),
      moduleTitle: z.string().max(200).optional(),
      moduleDescription: z.string().max(1000).optional(),
      lessonTitle: z.string().max(200).optional(),
      modules: z
        .array(
          z.object({
            title: z.string().max(120),
            description: z.string().max(500).optional(),
          }),
        )
        .optional(),
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
        throw new AppError(
          400,
          "Invalid request: type and prompt are required",
        );
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

