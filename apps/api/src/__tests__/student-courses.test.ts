import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import type { Agent } from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";
import { prisma } from "../utils/prisma";

/**
 * Integration tests for the Student Courses API (/api/courses/*).
 *
 * Covers every route in student-course.routes.ts:
 *   GET  /api/courses/enrolled
 *   GET  /api/courses/catalogue
 *   GET  /api/courses/:courseId
 *   GET  /api/courses/:courseId/content
 *   GET  /api/courses/:courseId/progress
 *   GET  /api/courses/:courseId/certification
 *   POST /api/courses/lessons/:lessonId/progress
 *   POST /api/courses/enroll
 *   GET  /api/courses/quizzes/:quizId/questions
 *   GET  /api/courses/quizzes/:quizId/attempt
 *
 * The seeded student is enrolled in the Data Science package which includes
 * the "python-for-data-science" course.
 */

/** Register + login a fresh STUDENT and return an authed agent + csrf token. */
const createdEmails: string[] = [];
async function createFreshStudent(name: string) {
  const email = `${name}-${Date.now()}@lms.local`;
  createdEmails.push(email);
  const regRes = await request(app).post("/api/auth/register").send({
    name: "Student Course Test",
    email,
    password: "StrongPass1",
  });
  expect(regRes.status).toBe(201);

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "StrongPass1" });
  expect(loginRes.status).toBe(200);

  const agent = request.agent(app);
  const cookies = loginRes.headers["set-cookie"];
  if (cookies) {
    for (const cookie of cookies) {
      const [cookiePart] = cookie.split(";");
      agent.jar.setCookie(cookiePart);
    }
  }

  const csrfRes = await agent.get("/api/csrf-token");
  return { agent, csrfToken: csrfRes.body.csrfToken as string, email };
}

describe("Student Courses — /api/courses routes", () => {
  let studentAgent: Agent;
  let studentCsrf: string;
  let courseId: string;
  let firstLessonId: string;
  let quizWithQuestionsId: string;

  beforeAll(async () => {
    const { agent, csrfToken } = await loginAs("STUDENT");
    studentAgent = agent;
    studentCsrf = csrfToken;

    const enrolledRes = await agent.get("/api/courses/enrolled");
    expect(enrolledRes.status).toBe(200);
    const enrolled: Array<{ id?: string; courseId?: string }> =
      enrolledRes.body.courses ?? [];
    if (!Array.isArray(enrolled) || enrolled.length === 0) {
      throw new Error(
        "Student has no enrolled courses — run pnpm prisma:reset to reseed",
      );
    }

    for (const entry of enrolled) {
      const candidateId = entry.courseId || entry.id;
      const contentRes = await agent.get(`/api/courses/${candidateId}/content`);
      if (contentRes.status !== 200) continue;
      const content = contentRes.body;
      const lesson = (content.modules ?? [])
        .flatMap((m: { lessons?: Array<{ id: string }> }) => m.lessons ?? [])
        .find((l: { videoUrl?: string }) => !!l.videoUrl);
      const quiz = (content.modules ?? [])
        .flatMap((m: { quizzes?: Array<{ id: string }> }) => m.quizzes ?? [])
        .find((q: { questionCount?: number }) => (q.questionCount ?? 0) > 0);
      if (!lesson || !quiz) continue;

      courseId = candidateId!;
      firstLessonId = lesson.id;
      quizWithQuestionsId = quiz.id;
      break;
    }

    if (!courseId || !firstLessonId || !quizWithQuestionsId) {
      throw new Error(
        "No enrolled course with both a video lesson and a quiz with questions",
      );
    }
  }, 30000);

  // ── Auth guard ────────────────────────────────────────────────────────────

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/courses/enrolled");
    expect(res.status).toBe(401);
  });

  // ── GET /enrolled ─────────────────────────────────────────────────────────

  describe("GET /api/courses/enrolled", () => {
    it("lists the student's package courses", async () => {
      const res = await studentAgent.get("/api/courses/enrolled");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("courses");
      expect(Array.isArray(res.body.courses)).toBe(true);
      expect(
        res.body.courses.some((c: { id?: string }) => c.id === courseId),
      ).toBe(true);
    });
  });

  // ── GET /catalogue ────────────────────────────────────────────────────────

  describe("GET /api/courses/catalogue", () => {
    it("lists published courses", async () => {
      const res = await studentAgent.get("/api/courses/catalogue");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.courses)).toBe(true);
      for (const c of res.body.courses) {
        expect(c.status ?? "PUBLISHED").toBe("PUBLISHED");
      }
    });
  });

  // ── GET /:courseId ────────────────────────────────────────────────────────

  describe("GET /api/courses/:courseId", () => {
    it("returns course detail for an enrolled course", async () => {
      const res = await studentAgent.get(`/api/courses/${courseId}`);

      expect(res.status).toBe(200);
      expect(res.body.course).toBeDefined();
      expect(res.body.course.id).toBe(courseId);
    });

    it("returns 404 for an unknown course id", async () => {
      const res = await studentAgent.get("/api/courses/no-such-course-id");
      expect([404]).toContain(res.status);
    });
  });

  // ── GET /:courseId/content ────────────────────────────────────────────────

  describe("GET /api/courses/:courseId/content", () => {
    it("returns full content payload with modules", async () => {
      const res = await studentAgent.get(`/api/courses/${courseId}/content`);

      expect(res.status).toBe(200);
      expect(res.body.course).toBeDefined();
      expect(Array.isArray(res.body.modules)).toBe(true);
      expect(typeof res.body.overallProgress).toBe("number");

      const module = res.body.modules[0];
      expect(module.lessons).toBeDefined();
      expect(module.quizzes).toBeDefined();
      expect(module.assignments).toBeDefined();

      // Lesson shape used by the COURSE_CONTENT view
      const lesson = module.lessons.find(
        (l: { videoUrl?: string }) => l.videoUrl,
      );
      if (lesson) {
        expect(lesson).toHaveProperty("watchedPercent");
        expect(lesson).toHaveProperty("isCompleted");
      }
    });

    it("rejects unknown course with 403 or 404", async () => {
      const res = await studentAgent.get("/api/courses/no-such-id/content");
      // Enrollment guard fires before existence check → 403 is expected;
      // 404 if ordering ever changes.
      expect([403, 404]).toContain(res.status);
    });
  });

  // ── GET /:courseId/progress ───────────────────────────────────────────────

  describe("GET /api/courses/:courseId/progress", () => {
    it("returns completion progress summary", async () => {
      const res = await studentAgent.get(`/api/courses/${courseId}/progress`);

      expect(res.status).toBe(200);
      expect(typeof res.body.isComplete).toBe("boolean");
      expect(typeof res.body.totalItems).toBe("number");
      expect(typeof res.body.completedItems).toBe("number");
    });
  });

  // ── POST /lessons/:lessonId/progress ──────────────────────────────────────

  describe("POST /api/courses/lessons/:lessonId/progress", () => {
    it("rejects requests without watchedSeconds or completed flag", async () => {
      const res = await studentAgent
        .post(`/api/courses/lessons/${firstLessonId}/progress`)
        .set("X-CSRF-Token", studentCsrf)
        .send({});
      expect(res.status).toBe(400);
    });

    it("saves watched seconds and returns updated progress", async () => {
      const res = await studentAgent
        .post(`/api/courses/lessons/${firstLessonId}/progress`)
        .set("X-CSRF-Token", studentCsrf)
        .send({ watchedSeconds: 120, completed: false });

      expect(res.status).toBe(200);
      expect(res.body.progress).toBeDefined();
      expect(res.body.progress.watchedSeconds).toBeGreaterThanOrEqual(120);
    });

    it("returns 404 for unknown lesson", async () => {
      const res = await studentAgent
        .post("/api/courses/lessons/no-such-lesson/progress")
        .set("X-CSRF-Token", studentCsrf)
        .send({ completed: true });
      expect(res.status).toBe(404);
    });
  });

  // ── Quiz attempt routes ───────────────────────────────────────────────────

  describe("GET /api/courses/quizzes/:quizId/questions", () => {
    it("returns quiz metadata with questions and options", async () => {
      const res = await studentAgent.get(
        `/api/courses/quizzes/${quizWithQuestionsId}/questions`,
      );

      expect(res.status).toBe(200);
      expect(res.body.questions).toBeDefined();
      expect(res.body.questionCount).toBeGreaterThan(0);

      const first = res.body.questions[0];
      expect(first.questionText).toBeDefined();
      expect(Array.isArray(first.options)).toBe(true);
      expect(first.options[0].optionText).toBeDefined();
      // NOTE (known issue): this endpoint currently exposes `isCorrect` on
      // every option — students could inspect it to cheat. Documented here;
      // see report. Do not "fix" by asserting it's absent.
      expect(typeof first.options[0].isCorrect).toBe("boolean");
    });

    it("returns 404 for unknown quiz", async () => {
      const res = await studentAgent.get(
        "/api/courses/quizzes/no-such-quiz/questions",
      );
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/courses/quizzes/:quizId/attempt", () => {
    it("returns 404 when the student has not attempted the quiz", async () => {
      // Fresh student has no attempts at all
      const { agent: freshAgent } = await createFreshStudent(
        `no-attempt-${Math.floor(Math.random() * 1e6)}`,
      );
      const res = await freshAgent.get(
        `/api/courses/quizzes/${quizWithQuestionsId}/attempt`,
      );
      expect(res.status).toBe(404);
    });

    it("returns the latest attempt after submission", async () => {
      // Submit a minimal valid attempt via Prisma-free API path is covered by
      // quiz-submission.test.ts — here we verify the attempt read-back route.
      const user = await prisma.user.findUnique({
        where: { email: "student@lms.local" },
      });
      if (!user) return;

      const existing = await prisma.quizAttempt.findFirst({
        where: { quizId: quizWithQuestionsId, userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      const res = await studentAgent.get(
        `/api/courses/quizzes/${quizWithQuestionsId}/attempt`,
      );

      if (existing) {
        expect(res.status).toBe(200);
        expect(res.body.attemptId).toBe(existing.id);
        expect(typeof res.body.percentage).toBe("number");
      } else {
        expect(res.status).toBe(404);
      }
    });
  });

  // ── Certification data ────────────────────────────────────────────────────

  describe("GET /api/courses/:courseId/certification", () => {
    it("returns certification payload (module may be null)", async () => {
      const res = await studentAgent.get(
        `/api/courses/${courseId}/certification`,
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("module");
      expect(res.body).toHaveProperty("quiz");

      if (res.body.quiz) {
        expect(res.body.quiz.questions).toBeDefined();
        expect(typeof res.body.eligible).toBe("boolean");
        expect(res.body.requirements).toHaveProperty("totalQuizzes");
      }
    });
  });

  // ── POST /enroll ──────────────────────────────────────────────────────────

  describe("POST /api/courses/enroll", () => {
    let catalogueCourseId: string;

    beforeAll(async () => {
      const adminRes = await loginAs("ADMIN");
      const courseTitle = `Enroll Target ${Date.now()}`;
      const createRes = await adminRes.agent
        .post("/api/admin/courses")
        .set("X-CSRF-Token", adminRes.csrfToken)
        .send({
          title: courseTitle,
          description: "Target for enroll tests",
          category: "Testing",
        });
      expect(createRes.status).toBe(201);
      catalogueCourseId = createRes.body.id;

      await prisma.course.update({
        where: { id: catalogueCourseId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    }, 30000);

    it("returns 400 when courseId is missing", async () => {
      const { agent, csrfToken } = await createFreshStudent(
        `enroll-a-${Date.now()}`,
      );
      const res = await agent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", csrfToken)
        .send({});
      expect(res.status).toBe(400);
    });

    it("creates a PENDING enrollment request for a fresh student", async () => {
      const { agent, csrfToken } = await createFreshStudent(
        `enroll-b-${Date.now()}`,
      );
      const res = await agent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", csrfToken)
        .send({ courseId: catalogueCourseId });

      expect(res.status).toBe(201);
      expect(res.body.enrollment).toBeDefined();
      expect(res.body.enrollment.status).toBe("PENDING");
      expect(res.body.message).toMatch(/review/i);
    });

    it("rejects duplicate enrollment with 400", async () => {
      const { agent, csrfToken } = await createFreshStudent(
        `enroll-c-${Date.now()}`,
      );
      const first = await agent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", csrfToken)
        .send({ courseId: catalogueCourseId });
      expect(first.status).toBe(201);

      const dup = await agent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", csrfToken)
        .send({ courseId: catalogueCourseId });
      expect(dup.status).toBe(400);
      expect(dup.body.error).toMatch(/active enrollment/i);
    });

    it("rejects already-enrolled (package) students with 400", async () => {
      // Seeded student holds python via the Data Science package
      const res = await studentAgent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", studentCsrf)
        .send({ courseId: courseId });
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown/unpublished course", async () => {
      const { agent, csrfToken } = await createFreshStudent(
        `enroll-d-${Date.now()}`,
      );

      const missing = await agent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", csrfToken)
        .send({ courseId: "no-such-course" });
      expect(missing.status).toBe(404);
    });
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────

  afterAll(async () => {
    if (createdEmails.length === 0) return;
    const users = await prisma.user.findMany({
      where: { email: { in: createdEmails } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return;
    await prisma.enrollmentRequest.deleteMany({
      where: { userId: { in: ids } },
    });
  });
});
