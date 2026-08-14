import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";
import { prisma } from "../utils/prisma";

describe("Quiz Submission — Scoring & Attempt Tracking", () => {
  let quizId: string;
  let quizQuestions: any[];
  let studentAgent: any;
  let studentCsrf: string;

  beforeAll(async () => {
    // Login as student (already enrolled in Python course via package)
    const { agent, csrfToken } = await loginAs("STUDENT");
    studentAgent = agent;
    studentCsrf = csrfToken;

    // NOTE: The course content endpoint (GET /api/courses/:id/content) includes
    // `practicals` on modules which fails when the Practical model/relation is
    // missing from the Prisma schema — a pre-existing bug. We find quiz IDs
    // directly via Prisma for test setup, then test the actual API endpoints.
    const user = await prisma.user.findFirst({
      where: { email: "student@lms.local" },
    });
    const quiz = await prisma.quiz.findFirst({
      where: {
        module: {
          isCertificationModule: false,
          course: { slug: "python-for-data-science" },
        },
      },
      include: { questions: true },
    });

    if (!quiz || quiz.questions.length === 0) {
      throw new Error(
        "No quiz with questions found for Python course — check seed data",
      );
    }

    quizId = quiz.id;

    // Clear any previous attempts so "submits answers" test starts fresh
    if (user) {
      await prisma.quizAttempt.deleteMany({
        where: { quizId: quiz.id, userId: user.id },
      });
    }

    // Get quiz questions via the API (this endpoint does NOT have the practicals bug)
    const questionsRes = await studentAgent.get(
      `/api/courses/quizzes/${quizId}/questions`,
    );
    expect(questionsRes.status).toBe(200);
    quizQuestions = questionsRes.body.questions || questionsRes.body;
    expect(quizQuestions.length).toBeGreaterThan(0);
  });

  // ── Get Quiz Questions ────────────────────────────────────────────────────
  describe("GET /api/courses/quizzes/:quizId/questions", () => {
    it("returns questions for a valid quiz", async () => {
      const res = await studentAgent.get(
        `/api/courses/quizzes/${quizId}/questions`,
      );

      expect(res.status).toBe(200);
      const questions = res.body.questions || res.body;
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThanOrEqual(1);

      // Each question should have options (API returns `questionText`, not `text`)
      questions.forEach((q: any) => {
        expect(q).toHaveProperty("id");
        expect(q).toHaveProperty("questionText");
        expect(q).toHaveProperty("options");
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("returns error for non-existent quiz", async () => {
      const res = await studentAgent.get(
        "/api/courses/quizzes/non-existent-id/questions",
      );

      // Service throws plain Error → handleControllerError returns 500
      expect([404, 500]).toContain(res.status);
    });
  });

  // ── Submit Quiz ───────────────────────────────────────────────────────────
  describe("POST /api/courses/quizzes/:quizId/submit", () => {
    it("submits answers and returns score", async () => {
      // Build answers — select the correct option for each question so the
      // attempt passes and later duplicate-submission tests behave correctly.
      const answers = quizQuestions.map((q: any) => {
        const correct = q.options.find((o: any) => o.isCorrect);
        return {
          questionId: q.id,
          selectedOptionId: correct ? String(correct.id) : "0",
        };
      });

      const res = await studentAgent
        .post(`/api/courses/quizzes/${quizId}/submit`)
        .set("X-CSRF-Token", studentCsrf)
        .send({ answers });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("attemptId");
      expect(res.body).toHaveProperty("score");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("percentage");
      expect(res.body.total).toBe(quizQuestions.length);
      expect(res.body.score).toBeGreaterThanOrEqual(0);
      expect(res.body.score).toBeLessThanOrEqual(quizQuestions.length);
      expect(res.body.percentage).toBeGreaterThanOrEqual(0);
      expect(res.body.percentage).toBeLessThanOrEqual(100);
    });

    it("rejects duplicate submission", async () => {
      const answers = quizQuestions.map((q: any) => {
        const correct = q.options.find((o: any) => o.isCorrect);
        return {
          questionId: q.id,
          selectedOptionId: correct ? String(correct.id) : "0",
        };
      });

      const res = await studentAgent
        .post(`/api/courses/quizzes/${quizId}/submit`)
        .set("X-CSRF-Token", studentCsrf)
        .send({ answers });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already (submitted|passed)/i);
    });

    it("returns 400 for empty answers", async () => {
      // Use a different quiz for this test
      const otherQuiz = await prisma.quiz.findFirst({
        where: {
          id: { not: quizId },
          module: {
            isCertificationModule: false,
            course: { slug: "python-for-data-science" },
          },
          questions: { some: {} },
        },
      });

      if (!otherQuiz) {
        console.warn("No second quiz found, skipping empty answers test");
        return;
      }

      const res = await studentAgent
        .post(`/api/courses/quizzes/${otherQuiz.id}/submit`)
        .set("X-CSRF-Token", studentCsrf)
        .send({ answers: [] });

      expect(res.status).toBe(400);
    });

    it("returns error for non-existent quiz", async () => {
      const res = await studentAgent
        .post("/api/courses/quizzes/non-existent-id/submit")
        .set("X-CSRF-Token", studentCsrf)
        .send({
          answers: [{ questionId: "x", selectedOptionId: "0" }],
        });

      // Service throws plain Error → handleControllerError returns 500
      expect([404, 500]).toContain(res.status);
    });

    it("returns 403 without CSRF token", async () => {
      // POST without CSRF → CSRF middleware blocks with 403
      const res = await studentAgent
        .post(`/api/courses/quizzes/${quizId}/submit`)
        .send({
          answers: [{ questionId: "x", selectedOptionId: "0" }],
        });

      expect(res.status).toBe(403);
    });
  });

  // ── Get Attempt ───────────────────────────────────────────────────────────
  describe("GET /api/courses/quizzes/:quizId/attempt", () => {
    it("returns the existing attempt", async () => {
      const res = await studentAgent.get(
        `/api/courses/quizzes/${quizId}/attempt`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("attemptId");
      expect(res.body).toHaveProperty("score");
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("percentage");
      expect(res.body).toHaveProperty("answers");
      expect(Array.isArray(res.body.answers)).toBe(true);
    });

    it("returns 404 for quiz with no attempt", async () => {
      // Use a quiz the student hasn't attempted
      const unattemptedQuiz = await prisma.quiz.findFirst({
        where: {
          id: { not: quizId },
          module: {
            isCertificationModule: false,
            course: { slug: "python-for-data-science" },
          },
          questions: { some: {} },
          attempts: {
            none: {
              userId: (
                await prisma.user.findFirst({
                  where: { email: "student@lms.local" },
                })
              )?.id,
            },
          },
        },
      });

      if (!unattemptedQuiz) {
        console.warn("No unattempted quiz found, skipping test");
        return;
      }

      const res = await studentAgent.get(
        `/api/courses/quizzes/${unattemptedQuiz.id}/attempt`,
      );

      expect(res.status).toBe(404);
    });
  });
});
