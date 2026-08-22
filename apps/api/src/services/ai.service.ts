/**
 * Gemini AI service — powers AI-assisted content generation for admins.
 *
 * Features:
 * - API key stored encrypted (AES-256-GCM) in SystemSetting, editable by SUPER_ADMIN
 * - Structured JSON output enforced via responseSchema, validated with Zod
 * - One automatic retry with validation feedback when output fails validation
 * - Health check endpoint support (latency + reachability)
 */
import { z } from "zod";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "../utils/prisma";
import { encryptToken, decryptToken } from "../utils/encryption";
import { AppError } from "../utils/errors";

const API_KEY_SETTING = "ai_gemini_api_key";
const MODEL_SETTING = "ai_model";

export const DEFAULT_AI_MODEL = "gemini-2.5-flash";
export const ALLOWED_AI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
] as const;

export const AI_GENERATION_TYPES = [
  "COURSE_OUTLINE",
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

export const modulesSchema = z.object({
  modules: z
    .array(
      z.object({
        title: z.string().min(3).max(120),
        description: z.string().min(20).max(500),
      }),
    )
    .min(2)
    .max(12),
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
    properties: { title: str, description: str, maxPoints: { type: Type.INTEGER } },
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
  if (ctx.courseDescription) parts.push(`Course description: ${ctx.courseDescription}`);
  if (ctx.moduleTitle) parts.push(`Module: "${ctx.moduleTitle}"`);
  if (ctx.moduleDescription) parts.push(`Module description: ${ctx.moduleDescription}`);
  if (ctx.lessonTitle) parts.push(`Lesson: "${ctx.lessonTitle}"`);
  return parts.length ? `\n\nContext:\n${parts.join("\n")}` : "";
}

function buildSystemPrompt(type: AIGenerationType, ctx: AIGenerationContext): string {
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

    case "MODULES":
      return `${BASE_PERSONA}

Propose a logical sequence of course modules for the topic given by the user.
Rules:
- Order modules from foundational to advanced.
- Each module covers one coherent theme that builds on the previous ones.
- "title": max 60 characters. "description": 1-2 sentences on what the module teaches.${contextLines(ctx)}`;

    case "QUIZ": {
      const count = Math.min(Math.max(ctx.questionCount ?? 5, 1), 30);
      return `${BASE_PERSONA}

Write a multiple-choice quiz based on the user's request. If module context is provided below, the questions MUST cover the material described there — the user's extra instructions only refine or narrow the focus.
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
- "maxPoints": suggested total score (typically 100).${difficultyLine(ctx)}${contextLines(ctx)}`;

    case "LESSON_DESCRIPTION":
      return `${BASE_PERSONA}

Write a description for the video lesson named by the user.
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

export async function saveGeminiApiKey(rawKey: string): Promise<void> {
  const key = rawKey.trim();
  if (key.length < 20) {
    throw new AppError(400, "API key looks invalid (too short)");
  }
  const encrypted = encryptToken(key);
  await prisma.systemSetting.upsert({
    where: { key: API_KEY_SETTING },
    update: { value: encrypted },
    create: {
      key: API_KEY_SETTING,
      value: encrypted,
      type: "string",
      description: "Gemini API key (encrypted) used for AI content generation",
    },
  });
}

export async function deleteGeminiApiKey(): Promise<void> {
  await prisma.systemSetting.deleteMany({ where: { key: API_KEY_SETTING } });
}

async function getGeminiApiKey(): Promise<string | null> {
  const stored = await readSetting(API_KEY_SETTING);
  if (stored) {
    try {
      return decryptToken(stored);
    } catch {
      // Stored value unreadable (e.g. TOKEN_ENCRYPTION_KEY changed) — fall through
    }
  }
  const envKey = process.env.GEMINI_API_KEY?.trim();
  return envKey || null;
}

export async function getAIModel(): Promise<string> {
  const stored = await readSetting(MODEL_SETTING);
  if (
    stored &&
    (ALLOWED_AI_MODELS as readonly string[]).includes(stored)
  ) {
    return stored;
  }
  return DEFAULT_AI_MODEL;
}

export async function saveAIModel(model: string): Promise<void> {
  if (!(ALLOWED_AI_MODELS as readonly string[]).includes(model)) {
    throw new AppError(400, `Unsupported model: ${model}`);
  }
  await prisma.systemSetting.upsert({
    where: { key: MODEL_SETTING },
    update: { value: model },
    create: {
      key: MODEL_SETTING,
      value: model,
      type: "string",
      description: "Gemini model used for AI content generation",
    },
  });
}

export async function getAIStatus(): Promise<{
  configured: boolean;
  maskedKey: string | null;
  model: string;
}> {
  const apiKey = await getGeminiApiKey();
  return {
    configured: Boolean(apiKey),
    maskedKey: apiKey ? `••••${apiKey.slice(-4)}` : null,
    model: await getAIModel(),
  };
}

export function isAIConfiguredSync(apiKey: string | null): boolean {
  return Boolean(apiKey && apiKey.length >= 20);
}

// ─── Gemini calls ────────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError(504, `${label} timed out after ${ms / 1000}s`)), ms),
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

function geminiErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

interface GeminiCallResult {
  text: string;
  model: string;
}

type GeminiContents = string | Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;

async function callGemini(opts: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  contents: GeminiContents;
  responseSchema?: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<GeminiCallResult> {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });
  const response = await withTimeout(
    ai.models.generateContent({
      model: opts.model,
      contents: opts.contents,
      config: {
        systemInstruction: opts.systemInstruction,
        temperature: 0.7,
        ...(opts.responseSchema
          ? { responseMimeType: "application/json", responseSchema: opts.responseSchema }
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

const ASSIGNMENT_PDF_SYSTEM_PROMPT = `${BASE_PERSONA}

The user has attached a question paper PDF for a course assignment. Read it carefully.
Rules:
- "title": short assignment name derived from what the paper covers (max 100 chars).
- "description": a brief describing this assignment in plain text with line breaks — Objective, Tasks (numbered), Deliverables, Grading Criteria. Summarize the actual tasks from the PDF; do NOT invent unrelated requirements. If the admin note provides context, honor it.
- "maxPoints": suggested total score (typically 100).`;

export interface AIGenerateResult {
  type: AIGenerationType;
  data: unknown;
  model: string;
}

/**
 * Generates an assignment brief (title/description/maxPoints) from an
 * uploaded question-paper PDF using Gemini document understanding.
 */
export async function generateAssignmentFromPdf(opts: {
  pdfBase64: string;
  note?: string;
  ctx?: AIGenerationContext;
}): Promise<{ type: "ASSIGNMENT"; data: unknown; model: string }> {
  const apiKey = await getGeminiApiKey();
  if (!isAIConfiguredSync(apiKey)) {
    throw new AppError(
      400,
      "AI is not configured. Ask your Super Admin to add a Gemini API key in Admin → Settings → AI Integration.",
    );
  }
  const model = await getAIModel();
  const contents: GeminiContents = [
    {
      inlineData: { mimeType: "application/pdf", data: opts.pdfBase64 },
    },
    {
      text: `Write the assignment brief for this question paper.${
        opts.note ? `\n\nAdmin note about this PDF: ${opts.note}` : ""
      }`,
    },
  ];

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const { text, model: usedModel } = await callGemini({
      apiKey: apiKey!,
      model,
      systemInstruction: ASSIGNMENT_PDF_SYSTEM_PROMPT,
      contents,
      responseSchema: RESPONSE_SCHEMAS.ASSIGNMENT,
    });
    const parsed = extractJson(text);
    const result = assignmentSchema.safeParse(parsed);
    if (result.success) {
      return { type: "ASSIGNMENT", data: result.data, model: usedModel };
    }
    lastError = new Error(
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
  }
  throw new AppError(
    502,
    `AI response failed validation twice: ${geminiErrorMessage(lastError)}`,
  );
}

export async function generate(
  type: AIGenerationType,
  prompt: string,
  ctx: AIGenerationContext = {},
): Promise<AIGenerateResult> {
  const apiKey = await getGeminiApiKey();
  if (!isAIConfiguredSync(apiKey)) {
    throw new AppError(
      400,
      "AI is not configured. Ask your Super Admin to add a Gemini API key in Admin → Settings → AI Integration.",
    );
  }
  const model = await getAIModel();
  const systemInstruction = buildSystemPrompt(type, ctx);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const attemptPrompt =
      attempt === 0
        ? prompt
        : `${prompt}\n\nIMPORTANT: Your previous response failed validation (${geminiErrorMessage(lastError)}). Follow the schema and rules exactly.`;
    const { text, model: usedModel } = await callGemini({
      apiKey: apiKey!,
      model,
      systemInstruction,
      contents: attemptPrompt,
      responseSchema: RESPONSE_SCHEMAS[type],
    });
    const parsed = extractJson(text);
    const result = OUTPUT_SCHEMAS[type].safeParse(parsed);
    if (result.success) {
      return { type, data: result.data, model: usedModel };
    }
    lastError = new Error(
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
  }
  throw new AppError(
    502,
    `AI response failed validation twice: ${geminiErrorMessage(lastError)}`,
  );
}

export interface AIHealthResult {
  ok: boolean;
  model?: string;
  latencyMs?: number;
  error?: string;
}export async function healthCheck(): Promise<AIHealthResult> {
  const apiKey = await getGeminiApiKey();
  if (!isAIConfiguredSync(apiKey)) {
    return { ok: false, error: "No Gemini API key configured" };
  }
  const model = await getAIModel();
  const startedAt = Date.now();
  try {
    await callGemini({
      apiKey: apiKey!,
      model,
      systemInstruction: "You are a health check probe.",
      contents: "Reply with exactly: OK",
      timeoutMs: 20_000,
    });
    return { ok: true, model, latencyMs: Date.now() - startedAt };
  } catch (err: unknown) {
    return { ok: false, model, latencyMs: Date.now() - startedAt, error: geminiErrorMessage(err) };
  }
}
