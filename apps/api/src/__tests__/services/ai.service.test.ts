import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generate,
  generateAssignmentFromPdf,
  healthCheck,
  saveGeminiApiKey,
  saveAIModel,
  getAIStatus,
  DEFAULT_AI_MODEL,
} from "../../services/ai.service";
import { AppError } from "../../utils/errors";

process.env.TOKEN_ENCRYPTION_KEY = "test-encryption-key-32-chars-long!!";

// Mock Prisma
const mockPrisma = vi.hoisted(() => ({
  systemSetting: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
}));
vi.mock("../../utils/prisma", () => ({ prisma: mockPrisma }));

// Mock Gemini SDK
const mockGenerateContent = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  Type: {
    STRING: "STRING",
    OBJECT: "OBJECT",
    ARRAY: "ARRAY",
    BOOLEAN: "BOOLEAN",
    INTEGER: "INTEGER",
  },
}));

function geminiJsonResponse(payload: unknown) {
  return { text: JSON.stringify(payload) };
}

describe("ai.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.systemSetting.findUnique.mockReset();
    mockGenerateContent.mockReset();
  });

  describe("settings", () => {
    it("rejects short API keys", async () => {
      await expect(saveGeminiApiKey("short-key")).rejects.toThrow(AppError);
      expect(mockPrisma.systemSetting.upsert).not.toHaveBeenCalled();
    });

    it("stores API key encrypted (not plaintext)", async () => {
      mockPrisma.systemSetting.upsert.mockResolvedValue({});
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      const call = mockPrisma.systemSetting.upsert.mock.calls[0][0];
      expect(call.where).toEqual({ key: "ai_gemini_api_key" });
      expect(call.update.value).not.toContain("AIzaSY");
    });

    it("getAIStatus masks the stored key", async () => {
      mockPrisma.systemSetting.upsert.mockResolvedValue({});
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");

      const encrypted = mockPrisma.systemSetting.upsert.mock.calls[0][0].update.value;
      mockPrisma.systemSetting.findUnique.mockResolvedValue({ value: encrypted });

      const status = await getAIStatus();
      expect(status.configured).toBe(true);
      expect(status.maskedKey).toBe("••••7890");
      expect(status.maskedKey).not.toContain("AIzaSY");
      expect(status.model).toBe(DEFAULT_AI_MODEL);
    });

    it("getAIStatus reports unconfigured when no key exists", async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue(null);
      delete process.env.GEMINI_API_KEY;
      const status = await getAIStatus();
      expect(status.configured).toBe(false);
      expect(status.maskedKey).toBeNull();
    });

    it("falls back to env var when DB has no key", async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue(null);
      process.env.GEMINI_API_KEY = "AIzaSY-env-fallback-key-12345678";
      const status = await getAIStatus();
      expect(status.configured).toBe(true);
      delete process.env.GEMINI_API_KEY;
    });

    it("saveAIModel rejects unsupported models", async () => {
      await expect(saveAIModel("gpt-4o")).rejects.toThrow(AppError);
      expect(mockPrisma.systemSetting.upsert).not.toHaveBeenCalled();
    });

    it("saveAIModel persists an allowed model", async () => {
      mockPrisma.systemSetting.upsert.mockResolvedValue({});
      await saveAIModel("gemini-2.5-flash-lite");
      expect(mockPrisma.systemSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: "ai_model" },
          update: { value: "gemini-2.5-flash-lite" },
        }),
      );
    });
  });

  describe("generate", () => {
    it("throws AppError when AI is not configured", async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue(null);
      delete process.env.GEMINI_API_KEY;
      await expect(generate("QUIZ", "python basics")).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("returns validated quiz data on success", async () => {
      // First lookup: api key setting; second: model setting
      let savedEncrypted: string | null = null;
      mockPrisma.systemSetting.upsert.mockImplementation(async ({ update }) => {
        if (!savedEncrypted) savedEncrypted = update.value;
        return {};
      });
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      mockPrisma.systemSetting.findUnique.mockImplementation(async ({ where }) => {
        if (where.key === "ai_gemini_api_key") return { value: savedEncrypted };
        return null; // no model override → default
      });

      mockGenerateContent.mockResolvedValue(
        geminiJsonResponse({
          title: "Python Basics Quiz",
          questions: [
            {
              text: "Which is a mutable type?",
              options: [
                { label: "list", isCorrect: true },
                { label: "tuple", isCorrect: false },
                { label: "str", isCorrect: false },
                { label: "int", isCorrect: false },
              ],
            },
          ],
        }),
      );

      const result = await generate("QUIZ", "python basics", { questionCount: 1 });
      expect(result.type).toBe("QUIZ");
      expect(result.model).toBe(DEFAULT_AI_MODEL);
      const data = result.data as { title: string; questions: unknown[] };
      expect(data.title).toBe("Python Basics Quiz");
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      const config = mockGenerateContent.mock.calls[0][0].config;
      expect(config.responseMimeType).toBe("application/json");
      expect(config.responseSchema).toBeDefined();
      expect(config.systemInstruction).toContain("EXACTLY ONE correct answer");
    });

    it("passes course modules and moduleDescription into the system prompt", async () => {
      let savedEncrypted: string | null = null;
      mockPrisma.systemSetting.upsert.mockImplementation(async ({ update }) => {
        if (!savedEncrypted) savedEncrypted = update.value;
        return {};
      });
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      mockPrisma.systemSetting.findUnique.mockImplementation(async ({ where }) => {
        if (where.key === "ai_gemini_api_key") return { value: savedEncrypted };
        return null;
      });

      mockGenerateContent.mockResolvedValue(
        geminiJsonResponse({
          description: "A lesson covering loop fundamentals including for, while, and comprehension syntax.",
        }),
      );

      await generate("LESSON_DESCRIPTION", "loop fundamentals", {
        courseTitle: "Python for Data Analysis",
        moduleTitle: "Control Flow",
        moduleDescription: "If/else, loops, and comprehensions",
        modules: [
          { title: "Python Basics", description: "Variables and types" },
          { title: "Data Structures" },
        ],
      });

      const config = mockGenerateContent.mock.calls[0][0].config;
      expect(config.systemInstruction).toContain("Python for Data Analysis");
      expect(config.systemInstruction).toContain('Module: "Control Flow"');
      expect(config.systemInstruction).toContain("Module description: If/else, loops, and comprehensions");
      expect(config.systemInstruction).toContain("1. Python Basics — Variables and types");
      expect(config.systemInstruction).toContain("2. Data Structures");
    });

    it("retries once when the first response has zero correct answers, then succeeds", async () => {
      let savedEncrypted: string | null = null;
      mockPrisma.systemSetting.upsert.mockImplementation(async ({ update }) => {
        savedEncrypted ??= update.value;
        return {};
      });
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        value: savedEncrypted,
      });

      const invalid = geminiJsonResponse({
        title: "Bad Quiz",
        questions: [
          {
            text: "Pick the wrong answer somehow",
            options: [
              { label: "a", isCorrect: false },
              { label: "b", isCorrect: false },
              { label: "c", isCorrect: false },
            ],
          },
        ],
      });
      const valid = geminiJsonResponse({
        title: "Good Quiz",
        questions: [
          {
            text: "Which option is correct?",
            options: [
              { label: "a", isCorrect: false },
              { label: "b", isCorrect: true },
              { label: "c", isCorrect: false },
            ],
          },
        ],
      });
      mockGenerateContent
        .mockResolvedValueOnce(invalid)
        .mockResolvedValueOnce(valid);

      const result = await generate("QUIZ", "topic x", { questionCount: 1 });
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      const retryPrompt = mockGenerateContent.mock.calls[1][0].contents;
      expect(retryPrompt).toContain("failed validation");
      expect((result.data as { title: string }).title).toBe("Good Quiz");
    });

    it("throws 502 after two invalid responses", async () => {
      let savedEncrypted: string | null = null;
      mockPrisma.systemSetting.upsert.mockImplementation(async ({ update }) => {
        savedEncrypted ??= update.value;
        return {};
      });
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        value: savedEncrypted,
      });

      const bad = geminiJsonResponse({ unexpected: "shape" });
      mockGenerateContent.mockResolvedValue(bad);

      await expect(generate("QUIZ", "topic y")).rejects.toMatchObject({
        statusCode: 502,
      });
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it("strips markdown fences around JSON", async () => {
      let savedEncrypted: string | null = null;
      mockPrisma.systemSetting.upsert.mockImplementation(async ({ update }) => {
        savedEncrypted ??= update.value;
        return {};
      });
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        value: savedEncrypted,
      });

      mockGenerateContent.mockResolvedValue({
        text: '```json\n{"description":"A perfectly adequate lesson description."}\n```',
      });

      const result = await generate("LESSON_DESCRIPTION", "loops in python");
      expect((result.data as { description: string }).description).toContain(
        "perfectly adequate",
      );
    });
  });

  describe("generateAssignmentFromPdf", () => {
    it("sends the PDF as inline data and returns the assignment brief", async () => {
      let savedEncrypted: string | null = null;
      mockPrisma.systemSetting.upsert.mockImplementation(async ({ update }) => {
        savedEncrypted ??= update.value;
        return {};
      });
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        value: savedEncrypted,
      });

      mockGenerateContent.mockResolvedValue(
        geminiJsonResponse({
          title: "Pandas Data Cleaning Assignment",
          description:
            "Clean the provided messy dataset and produce a summary report of every transformation applied.",
          maxPoints: 100,
        }),
      );

      const result = await generateAssignmentFromPdf({
        pdfBase64: "JVBERi0xLjQ=",
        note: "It is a Pandas practice paper",
      });

      expect(result.type).toBe("ASSIGNMENT");
      expect((result.data as { title: string }).title).toContain("Pandas");

      const call = mockGenerateContent.mock.calls[0][0];
      const parts = Array.isArray(call.contents) ? call.contents : [];
      expect(parts[0].inlineData).toEqual({
        mimeType: "application/pdf",
        data: "JVBERi0xLjQ=",
      });
      expect(parts[1].text).toContain("Pandas practice paper");
    });

    it("throws when AI is not configured", async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue(null);
      delete process.env.GEMINI_API_KEY;
      await expect(
        generateAssignmentFromPdf({ pdfBase64: "abc" }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("healthCheck", () => {
    it("returns ok:false when not configured", async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue(null);
      delete process.env.GEMINI_API_KEY;
      const result = await healthCheck();
      expect(result.ok).toBe(false);
      expect(result.error).toContain("No Gemini API key");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("returns ok:true with latency when reachable", async () => {
      let savedEncrypted: string | null = null;
      mockPrisma.systemSetting.upsert.mockImplementation(async ({ update }) => {
        savedEncrypted ??= update.value;
        return {};
      });
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        value: savedEncrypted,
      });

      mockGenerateContent.mockResolvedValue({ text: "OK" });
      const result = await healthCheck();
      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
    });

    it("returns ok:false with error message when the API fails", async () => {
      let savedEncrypted: string | null = null;
      mockPrisma.systemSetting.upsert.mockImplementation(async ({ update }) => {
        savedEncrypted ??= update.value;
        return {};
      });
      await saveGeminiApiKey("AIzaSY-test-api-key-1234567890");
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        value: savedEncrypted,
      });

      mockGenerateContent.mockRejectedValue(new Error("API key not valid"));
      const result = await healthCheck();
      expect(result.ok).toBe(false);
      expect(result.error).toContain("API key not valid");
    });
  });
});
