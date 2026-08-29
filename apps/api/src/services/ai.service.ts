/**
 * AI service — powers AI-assisted content generation for admins, with pluggable
 * providers (currently Google Gemini and OpenRouter).
 *
 * Features:
 * - Each provider's API key stored encrypted (AES-256-GCM) in SystemSetting,
 *   editable by SUPER_ADMIN
 * - An active-provider switch persisted in SystemSetting (default "gemini")
 * - Structured JSON output forced via provider-native schema config (Gemini) or
 *   response_format json_object (OpenRouter), validated with Zod
 * - One automatic retry with validation feedback when output fails validation
 * - Health check endpoint support (latency + reachability)
 */
import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "../utils/prisma";
import { encryptToken, decryptToken } from "../utils/encryption";
import { AppError } from "../utils/errors";

const GEMINI_KEY_SETTING = "ai_gemini_api_key";
const MODEL_SETTING = "ai_model";
const OPENROUTER_KEY_SETTING = "ai_openrouter_api_key";
const OPENROUTER_MODEL_SETTING = "ai_openrouter_model";
const PROVIDER_SETTING = "ai_provider";

export const DEFAULT_AI_MODEL = "gemini-2.5-flash";
export const ALLOWED_AI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
] as const;

/** AI providers supported by the platform. */
export type AIProvider = "gemini" | "openrouter";
export const AI_PROVIDERS: readonly AIProvider[] = ["gemini", "openrouter"];

export const AI_GENERATION_TYPES = [
  "COURSE_OUTLINE",
  "COURSE_TITLE",
  "MODULES",
  "QUIZ",
  "ASSIGNMENT",
  "LESSON_DESCRIPTION",
  "NOTIFICATION",
] as const;

export type AIGenerationType = (typeof AI_GENERATION_TYPES)[number];

export interface AIGenerationContext {
  courseTitle?: string;
  courseDescription?: string;
  moduleTitle?: string;
  moduleDescription?: string;
  lessonTitle?: string;
  modules?: Array<{ title: string; description?: string }>;
  difficulty?: string;
  questionCount?: number;
}

// ─── Output schemas (Zod — source of truth for validation) ───────────────────

export const courseOutlineSchema = z.object({
  title: z.string().min(4).max(120),
  description: z.string().min(40).max(1000),
  category: z.string().min(2).max(60),
  tags: z.array(z.string().min(1).max(40)).min(3).max(10),
  objectives: z.array(z.string().min(8).max(200)).min(3).max(8),
});

export const courseTitleSchema = z.object({
  title: z.string().min(4).max(120),
});

export const modulesSchema = z.object({
  modules: z
    .array(
      z.object({
        title: z.string().min(3).max(120),
        description: z.string().min(20).max(500),
      }),
    )
    .min(2)
    .max(20),
});

export const assignmentSchema = z.object({
  title: z.string().min(4).max(150),
  description: z.string().min(50).max(3000),
  maxPoints: z.number().int().min(10).max(1000),
});

export const lessonDescriptionSchema = z.object({
  description: z.string().min(40).max(1000),
});

export const notificationSchema = z.object({
  title: z.string().min(4).max(120),
  message: z.string().min(30).max(1800),
});

const quizQuestionSchema = z.object({
  text: z.string().min(8).max(400),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        isCorrect: z.boolean(),
      }),
    )
    .min(3)
    .max(5),
});

export const quizSchema = z
  .object({
    title: z.string().min(3).max(150),
    questions: z.array(quizQuestionSchema).min(1).max(30),
  })
  .superRefine((val, ctx) => {
    val.questions.forEach((q, idx) => {
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["questions", idx],
          message: `must have exactly one correct option (got ${correctCount})`,
        });
      }
    });
  });

const OUTPUT_SCHEMAS: Record<AIGenerationType, z.ZodTypeAny> = {
  COURSE_OUTLINE: courseOutlineSchema,
  COURSE_TITLE: courseTitleSchema,
  MODULES: modulesSchema,
  QUIZ: quizSchema,
  ASSIGNMENT: assignmentSchema,
  LESSON_DESCRIPTION: lessonDescriptionSchema,
  NOTIFICATION: notificationSchema,
};

// ─── Gemini responseSchema equivalents (OpenAPI subset) ──────────────────────

const str = { type: Type.STRING };
const strArray = { type: Type.ARRAY, items: { type: Type.STRING } };

const RESPONSE_SCHEMAS: Record<AIGenerationType, Record<string, unknown>> = {
  COURSE_OUTLINE: {
    type: Type.OBJECT,
    properties: {
      title: str,
      description: str,
      category: str,
      tags: strArray,
      objectives: strArray,
    },
    required: ["title", "description", "category", "tags", "objectives"],
  },
  COURSE_TITLE: {
    type: Type.OBJECT,
    properties: { title: str },
    required: ["title"],
  },
  MODULES: {
    type: Type.OBJECT,
    properties: {
      modules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: { title: str, description: str },
          required: ["title", "description"],
        },
      },
    },
    required: ["modules"],
  },
  QUIZ: {
    type: Type.OBJECT,
    properties: {
      title: str,
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: str,
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { label: str, isCorrect: { type: Type.BOOLEAN } },
                required: ["label", "isCorrect"],
              },
            },
          },
          required: ["text", "options"],
        },
      },
    },
    required: ["title", "questions"],
  },
  ASSIGNMENT: {
    type: Type.OBJECT,
    properties: {
      title: str,
      description: str,
      maxPoints: { type: Type.INTEGER },
    },
    required: ["title", "description", "maxPoints"],
  },
  LESSON_DESCRIPTION: {
    type: Type.OBJECT,
    properties: { description: str },
    required: ["description"],
  },
  NOTIFICATION: {
    type: Type.OBJECT,
    properties: { title: str, message: str },
    required: ["title", "message"],
  },
};

// ─── System prompts ──────────────────────────────────────────────────────────

const BASE_PERSONA =
  "You are an expert instructional designer and senior educator creating content for Marvel Slice, an online learning platform for technology courses. Your content is factually accurate, clearly written, appropriately challenging, and free of filler. Always respond with valid JSON matching the requested schema.";

function difficultyLine(ctx: AIGenerationContext): string {
  const level = ctx.difficulty || "intermediate";
  return `Target difficulty level: ${level}.`;
}

function contextLines(ctx: AIGenerationContext): string {
  const parts: string[] = [];
  if (ctx.courseTitle) parts.push(`Course: "${ctx.courseTitle}"`);
  if (ctx.courseDescription)
    parts.push(`Course description: ${ctx.courseDescription}`);
  if (ctx.modules && ctx.modules.length > 0) {
    parts.push(
      `Course modules:\n${ctx.modules
        .map(
          (m, i) =>
            `  ${i + 1}. ${m.title}${m.description ? ` — ${m.description}` : ""}`,
        )
        .join("\n")}`,
    );
  }
  if (ctx.moduleTitle) parts.push(`Module: "${ctx.moduleTitle}"`);
  if (ctx.moduleDescription)
    parts.push(`Module description: ${ctx.moduleDescription}`);
  if (ctx.lessonTitle) parts.push(`Lesson: "${ctx.lessonTitle}"`);
  return parts.length ? `\n\nContext:\n${parts.join("\n")}` : "";
}

function buildSystemPrompt(
  type: AIGenerationType,
  ctx: AIGenerationContext,
): string {
  switch (type) {
    case "COURSE_OUTLINE":
      return `${BASE_PERSONA}

Design a complete course outline based on the topic given by the user.
Rules:
- "title": concise, compelling, max 60 characters, no trailing punctuation.
- "description": 2-4 sentences explaining what the learner will master and who it is for.
- "category": the single best-fitting broad category (e.g. "Data Science", "Web Development").
- "tags": 5-8 short topic tags, lowercase kebab-case (e.g. "python", "machine-learning").
- "objectives": 4-6 learning outcomes starting with an action verb ("Write...", "Build...", "Analyze...").${difficultyLine(ctx)}${contextLines(ctx)}`;

    case "COURSE_TITLE":
      return `${BASE_PERSONA}

Generate a concise, compelling course title based on the user's brief.
Rules:
- "title": max 60 characters, title case, no trailing punctuation, no quotes.
- Must clearly reflect the topic, level, and audience from the user's prompt and any context provided.
- Avoid generic filler like "Course" repetition — be specific (e.g. "Python for Data Analysis Beginners").${contextLines(ctx)}`;

    case "MODULES": {
      const moduleCount = Math.min(Math.max(ctx.questionCount ?? 5, 2), 20);
      return `${BASE_PERSONA}

Propose a logical sequence of course modules for the topic given by the user.
Rules:
- Propose exactly ${moduleCount} module(s) — no more, no fewer.
- Order modules from foundational to advanced.
- Each module covers one coherent theme that builds on the previous ones.
- If existing modules are provided in the context above, do not duplicate them — only propose new modules that come after them.
- "title": max 60 characters. "description": 1-2 sentences on what the module teaches.${contextLines(ctx)}`;
    }

    case "QUIZ": {
      const count = Math.min(Math.max(ctx.questionCount ?? 5, 1), 30);
      return `${BASE_PERSONA}

Write a multiple-choice quiz based on the user's request. If module context is provided below, the questions MUST cover the material described there — the user's extra instructions only refine or narrow the focus. Use the course modules list to place this quiz at the right point in the curriculum and avoid content already covered in previous modules.
Rules:
- Exactly ${count} question(s).
- Each question has EXACTLY 4 options and EXACTLY ONE correct answer (isCorrect: true).
- Distractors must be plausible and reflect common misconceptions — never joke answers.
- Vary which position holds the correct answer across questions.
- Never use options like "All of the above", "None of the above", or "Both A and B".
- Questions must be self-contained, unambiguous, and have only one defensible correct answer.
- "title": short quiz name derived from the module topic, e.g. "Python Functions Quiz".${difficultyLine(ctx)}${contextLines(ctx)}`;
    }

    case "ASSIGNMENT":
      return `${BASE_PERSONA}

Create a practical hands-on assignment brief based on the topic given by the user.
Rules:
- "description": structured brief with sections — Objective, Tasks (numbered), Deliverables, and Grading Criteria. Plain text with line breaks, no markdown headers.
- Tasks must be doable individually and verifiable.
- Align the assignment with the module context above when provided.
- "maxPoints": suggested total score (typically 100).${difficultyLine(ctx)}${contextLines(ctx)}`;

    case "LESSON_DESCRIPTION":
      return `${BASE_PERSONA}

Write a description for the video lesson named by the user. Use the module and course context above to tailor the description to what this lesson teaches within the broader curriculum.
Rules:
- 2-4 sentences describing what the lesson covers and what the learner will be able to do afterwards.
- No clickbait, no emoji, no bullet lists.${difficultyLine(ctx)}${contextLines(ctx)}`;

    case "NOTIFICATION":
      return `You are the communications assistant for Marvel Slice, an online learning platform. You draft platform notifications that are professional, warm, and concise.${contextLines(ctx)}

Rules:
- "title": max 70 characters, clear and specific.
- "message": 1-3 short paragraphs, plain text (no markdown, no HTML). Include the essential facts from the user's brief. Ready to send as-is — never leave placeholders like [date].
- Match tone to purpose: announcements are friendly, maintenance/security notices are factual and calm.`;
  }
}

// ─── Settings helpers ────────────────────────────────────────────────────────

async function readSetting(key: string): Promise<string | null> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

async function writeSetting(
  key: string,
  value: string,
  description: string,
): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, type: "string", description },
  });
}

const PROVIDER_KEY_SETTING: Record<AIProvider, string> = {
  gemini: GEMINI_KEY_SETTING,
  openrouter: OPENROUTER_KEY_SETTING,
};

const PROVIDER_MODEL_SETTING: Record<AIProvider, string> = {
  gemini: MODEL_SETTING,
  openrouter: OPENROUTER_MODEL_SETTING,
};

const PROVIDER_KEY_ENV: Record<AIProvider, string> = {
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

const PROVIDER_LABEL: Record<AIProvider, string> = {
  gemini: "Gemini",
  openrouter: "OpenRouter",
};

export async function getActiveProvider(): Promise<AIProvider> {
  const stored = await readSetting(PROVIDER_SETTING);
  return stored === "openrouter" ? "openrouter" : "gemini";
}

export async function saveActiveProvider(provider: AIProvider): Promise<void> {
  if (!(AI_PROVIDERS as readonly string[]).includes(provider)) {
    throw new AppError(400, `Unsupported provider: ${provider}`);
  }
  await writeSetting(
    PROVIDER_SETTING,
    provider,
    "Active AI provider (gemini | openrouter)",
  );
}

/** Reads the (decrypted) API key for a provider, falling back to its env var. */
async function getProviderApiKey(provider: AIProvider): Promise<string | null> {
  const setting = PROVIDER_KEY_SETTING[provider];
  const stored = await readSetting(setting);
  if (stored) {
    try {
      return decryptToken(stored);
    } catch {
      // Stored value unreadable (e.g. TOKEN_ENCRYPTION_KEY changed) — fall through
    }
  }
  const envKey = process.env[PROVIDER_KEY_ENV[provider]]?.trim();
  return envKey || null;
}

async function getProviderModel(provider: AIProvider): Promise<string> {
  if (provider === "openrouter") {
    const stored = await readSetting(OPENROUTER_MODEL_SETTING);
    return stored?.trim() || "";
  }
  const stored = await readSetting(MODEL_SETTING);
  if (stored && (ALLOWED_AI_MODELS as readonly string[]).includes(stored)) {
    return stored;
  }
  return DEFAULT_AI_MODEL;
}

/** Min length guard — both Gemini and OpenRouter keys are comfortably > 20 chars. */
export async function saveProviderApiKey(
  provider: AIProvider,
  rawKey: string,
): Promise<void> {
  const key = rawKey.trim();
  if (key.length < 20) {
    throw new AppError(400, "API key looks invalid (too short)");
  }
  const encrypted = encryptToken(key);
  await writeSetting(
    PROVIDER_KEY_SETTING[provider],
    encrypted,
    `${PROVIDER_LABEL[provider]} API key (encrypted) used for AI content generation`,
  );
}

export async function deleteProviderApiKey(provider: AIProvider): Promise<void> {
  await prisma.systemSetting.deleteMany({
    where: { key: PROVIDER_KEY_SETTING[provider] },
  });
}

export async function saveProviderModel(
  provider: AIProvider,
  model: string,
): Promise<void> {
  const trimmed = model.trim();
  if (provider === "gemini") {
    if (!(ALLOWED_AI_MODELS as readonly string[]).includes(trimmed)) {
      throw new AppError(400, `Unsupported model: ${model}`);
    }
  } else if (!trimmed) {
    throw new AppError(400, "Model is required");
  }
  await writeSetting(
    PROVIDER_MODEL_SETTING[provider],
    trimmed,
    `${PROVIDER_LABEL[provider]} model used for AI content generation`,
  );
}

// Backward-compatible wrappers ------------------------------------------------

/** @deprecated use provider-aware helpers */
export async function saveGeminiApiKey(rawKey: string): Promise<void> {
  await saveProviderApiKey("gemini", rawKey);
}

/** @deprecated use provider-aware helpers */
export async function deleteGeminiApiKey(): Promise<void> {
  await deleteProviderApiKey("gemini");
}

/** @deprecated use provider-aware helpers */
export async function saveAIModel(model: string): Promise<void> {
  await saveProviderModel("gemini", model);
}

export async function getAIStatus(): Promise<{
  provider: AIProvider;
  configured: boolean;
  maskedKey: string | null;
  model: string;
  providers: Record<
    AIProvider,
    { configured: boolean; maskedKey: string | null; model: string }
  >;
}> {
  const active = await getActiveProvider();
  const providers = {} as Record<
    AIProvider,
    { configured: boolean; maskedKey: string | null; model: string }
  >;
  for (const p of AI_PROVIDERS) {
    const apiKey = await getProviderApiKey(p);
    providers[p] = {
      configured: Boolean(apiKey),
      maskedKey: apiKey ? `••••${apiKey.slice(-4)}` : null,
      model: await getProviderModel(p),
    };
  }
  return { ...providers[active], provider: active, providers };
}

export function isAIConfiguredSync(apiKey: string | null): boolean {
  return Boolean(apiKey && apiKey.length >= 20);
}

// ─── Shared generation plumbing ─────────────────────────────────────────────

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(new AppError(504, `${label} timed out after ${ms / 1000}s`)),
        ms,
      ),
    ),
  ]);
}

function extractJson(raw: string): unknown {
  let text = raw.trim();
  // Strip accidental markdown fences
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) text = fenced[1].trim();
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(502, "AI returned malformed JSON");
  }
}

function aiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function requireConfigured(apiKey: string | null, provider: AIProvider): void {
  if (!isAIConfiguredSync(apiKey)) {
    throw new AppError(
      400,
      `AI is not configured. Ask your Super Admin to add a ${PROVIDER_LABEL[provider]} API key in Admin → Settings → AI Integration.`,
    );
  }
}

// ─── Gemini provider ─────────────────────────────────────────────────────────

type GeminiContents =
  | string
  | Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;

interface ProviderCallResult {
  text: string;
  model: string;
}

async function callGemini(opts: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: GeminiContents;
  responseSchema?: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<ProviderCallResult> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const response = await withTimeout(
    ai.models.generateContent({
      model: opts.model,
      contents: opts.contents,
      config: {
        systemInstruction: opts.systemInstruction,
        temperature: 0.7,
        ...(opts.responseSchema
          ? {
              responseMimeType: "application/json",
              responseSchema: opts.responseSchema,
            }
          : {}),
      },
    }),
    opts.timeoutMs ?? 90_000,
    "AI generation",
  );
  const text = response.text ?? "";
  if (!text.trim()) {
    throw new AppError(502, "AI returned an empty response");
  }
  return { text, model: opts.model };
}

// ─── OpenRouter provider (OpenAI-compatible chat completions) ────────────────

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";

async function callOpenRouter(opts: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  userContent: string;
  timeoutMs?: number;
}): Promise<ProviderCallResult> {
  const res = await withTimeout(
    fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: opts.model,
        messages: [
          { role: "system", content: opts.systemInstruction },
          { role: "user", content: opts.userContent },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    }),
    opts.timeoutMs ?? 90_000,
    "AI generation",
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AppError(
      502,
      `OpenRouter request failed (${res.status}): ${detail.slice(0, 300)}`,
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) {
    throw new AppError(502, "AI returned an empty response");
  }
  return { text, model: opts.model };
}

/**
 * Lists the models an OpenRouter key can access. Requires a stored OpenRouter
 * key (or the OPENROUTER_API_KEY env var).
 */
export async function listOpenRouterModels(): Promise<
  Array<{ id: string; name: string }>
> {
  const apiKey = await getProviderApiKey("openrouter");
  if (!isAIConfiguredSync(apiKey)) {
    throw new AppError(400, "OpenRouter API key not configured");
  }
  const res = await fetch(`${OPENROUTER_API_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AppError(
      502,
      `OpenRouter models request failed (${res.status}): ${detail.slice(0, 300)}`,
    );
  }
  const json = (await res.json()) as {
    data?: Array<{ id?: string; name?: string }>;
  };
  return (json.data ?? [])
    .filter((m) => typeof m.id === "string" && m.id)
    .map((m) => ({ id: m.id!, name: m.name || m.id! }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Generation orchestrator ─────────────────────────────────────────────────

export interface AIGenerateResult {
  type: AIGenerationType;
  data: unknown;
  model: string;
  provider: AIProvider;
}

async function validateWithRetry(
  type: AIGenerationType,
  prompt: string,
  provider: AIProvider,
  call: (effectivePrompt: string) => Promise<ProviderCallResult>,
): Promise<AIGenerateResult> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const effectivePrompt =
      attempt === 0
        ? prompt
        : `${prompt}\n\nIMPORTANT: Your previous response failed validation (${aiErrorMessage(lastError)}). Follow the schema and rules exactly.`;
    const { text, model } = await call(effectivePrompt);
    const parsed = extractJson(text);
    const result = OUTPUT_SCHEMAS[type].safeParse(parsed);
    if (result.success) {
      return { type, data: result.data, model, provider };
    }
    lastError = new Error(
      result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  }
  throw new AppError(
    502,
    `AI response failed validation twice: ${aiErrorMessage(lastError)}`,
  );
}

export async function generate(
  type: AIGenerationType,
  prompt: string,
  ctx: AIGenerationContext = {},
): Promise<AIGenerateResult> {
  const provider = await getActiveProvider();
  const apiKey = await getProviderApiKey(provider);
  requireConfigured(apiKey, provider);
  const model = await getProviderModel(provider);
  const systemInstruction = buildSystemPrompt(type, ctx);

  if (provider === "openrouter") {
    if (!model) {
      throw new AppError(400, "No OpenRouter model selected");
    }
    return validateWithRetry(type, prompt, provider, (effectivePrompt) =>
      callOpenRouter({
        apiKey: apiKey!,
        model,
        systemInstruction,
        userContent: effectivePrompt,
      }),
    );
  }

  return validateWithRetry(type, prompt, provider, (effectivePrompt) =>
    callGemini({
      apiKey: apiKey!,
      model,
      systemInstruction,
      contents: effectivePrompt,
      responseSchema: RESPONSE_SCHEMAS[type],
    }),
  );
}

export interface AIHealthResult {
  ok: boolean;
  provider?: AIProvider;
  model?: string;
  latencyMs?: number;
  error?: string;
}

export async function healthCheck(): Promise<AIHealthResult> {
  const provider = await getActiveProvider();
  const apiKey = await getProviderApiKey(provider);
  if (!isAIConfiguredSync(apiKey)) {
    return { ok: false, error: `No ${PROVIDER_LABEL[provider]} API key configured` };
  }
  const model = await getProviderModel(provider);
  const startedAt = Date.now();
  try {
    if (provider === "openrouter") {
      await callOpenRouter({
        apiKey: apiKey!,
        model,
        systemInstruction: "You are a health check probe.",
        userContent: "Reply with exactly: OK",
        timeoutMs: 20_000,
      });
    } else {
      await callGemini({
        apiKey: apiKey!,
        model,
        systemInstruction: "You are a health check probe.",
        contents: "Reply with exactly: OK",
        timeoutMs: 20_000,
      });
    }
    return {
      ok: true,
      provider,
      model,
      latencyMs: Date.now() - startedAt,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      provider,
      model,
      latencyMs: Date.now() - startedAt,
      error: aiErrorMessage(err),
    };
  }
}
