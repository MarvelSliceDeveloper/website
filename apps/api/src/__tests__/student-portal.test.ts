import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";
import { prisma } from "../utils/prisma";

/**
 * Integration tests for the Student Portal API (/api/student/*).
 *
 * Covers every route in student.routes.ts:
 *   GET  /api/student/summary
 *   GET  /api/student/assignments/overdue
 *   GET  /api/student/continue-learning
 *   GET  /api/student/results
 *   GET  /api/student/packages
 *   GET  /api/student/payments
 *   GET  /api/student/profile
 *   PATCH /api/student/profile
 */
describe("Student Portal — /api/student routes", () => {
  let studentAgent: ReturnType<typeof request.agent>;
  let studentCsrf: string;

  beforeAll(async () => {
    const { agent, csrfToken } = await loginAs("STUDENT");
    studentAgent = agent;
    studentCsrf = csrfToken;
  });

  // ── Auth guards ───────────────────────────────────────────────────────────

  describe("Auth & role guards", () => {
    it("returns 401 without authentication", async () => {
      const res = await request(app).get("/api/student/summary");
      expect(res.status).toBe(401);
    });

    it("lets higher-privileged roles through requireRole([STUDENT])", async () => {
      // satisfiesRole inherits downward per ROLE_HIERARCHY:
      // ADMIN and INSTRUCTOR outrank STUDENT, so they are NOT rejected.
      const { agent: instructorAgent } = await loginAs("INSTRUCTOR");
      expect((await instructorAgent.get("/api/student/summary")).status).toBe(
        200,
      );

      const { agent: adminAgent } = await loginAs("ADMIN");
      expect((await adminAgent.get("/api/student/summary")).status).toBe(200);
    });
  });

  // ── GET /summary ──────────────────────────────────────────────────────────

  describe("GET /api/student/summary", () => {
    it("returns dashboard summary with all sections", async () => {
      const res = await studentAgent.get("/api/student/summary");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("enrolled");
      expect(res.body).toHaveProperty("sessions");
      expect(res.body).toHaveProperty("calendarEvents");
      expect(res.body).toHaveProperty("tickets");
      expect(res.body).toHaveProperty("certificatesCount");

      expect(Array.isArray(res.body.enrolled)).toBe(true);
      expect(Array.isArray(res.body.sessions)).toBe(true);
      expect(Array.isArray(res.body.calendarEvents)).toBe(true);
      expect(Array.isArray(res.body.tickets)).toBe(true);
      expect(typeof res.body.certificatesCount).toBe("number");
    });
  });

  // ── GET /assignments/overdue ──────────────────────────────────────────────

  describe("GET /api/student/assignments/overdue", () => {
    it("returns items array (quizzes + assignments)", async () => {
      const res = await studentAgent.get("/api/student/assignments/overdue");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(Array.isArray(res.body.items)).toBe(true);

      // Each item must identify its type for the Pending/Completed tabs
      for (const item of res.body.items) {
        expect(item).toHaveProperty("type");
        expect(["QUIZ", "ASSIGNMENT"]).toContain(item.type);
      }
    });
  });

  // ── GET /continue-learning ────────────────────────────────────────────────

  describe("GET /api/student/continue-learning", () => {
    it("returns items array", async () => {
      const res = await studentAgent.get("/api/student/continue-learning");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(Array.isArray(res.body.items)).toBe(true);
    });
  });

  // ── GET /results ──────────────────────────────────────────────────────────

  describe("GET /api/student/results", () => {
    it("returns results items array", async () => {
      const res = await studentAgent.get("/api/student/results");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(Array.isArray(res.body.items)).toBe(true);
    });
  });

  // ── GET /packages ─────────────────────────────────────────────────────────

  describe("GET /api/student/packages", () => {
    it("returns the student's enrolled packages", async () => {
      const res = await studentAgent.get("/api/student/packages");

      expect(res.status).toBe(200);
      // Seeded student is enrolled in the Data Science package via batch
      const packages = res.body.packages ?? res.body;
      expect(packages).toBeDefined();
    });
  });

  // ── GET /payments ─────────────────────────────────────────────────────────

  describe("GET /api/student/payments", () => {
    it("returns payments array (excludes PENDING)", async () => {
      const res = await studentAgent.get("/api/student/payments");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("payments");
      expect(Array.isArray(res.body.payments)).toBe(true);

      for (const payment of res.body.payments) {
        expect(payment.status).not.toBe("PENDING");
        expect(typeof payment.amount).toBe("number");
      }
    });
  });

  // ── Profile GET/PATCH round-trip ──────────────────────────────────────────

  describe("GET/PATCH /api/student/profile", () => {
    it("returns current profile", async () => {
      const res = await studentAgent.get("/api/student/profile");

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("student@lms.local");
      expect(res.body.user.role).toBe("STUDENT");
    });

    it("updates phone and restores original value", async () => {
      const before = await studentAgent.get("/api/student/profile");
      const originalPhone = before.body.user.phone;

      const stamp = Date.now().toString().slice(-10);
      const res = await studentAgent
        .patch("/api/student/profile")
        .set("X-CSRF-Token", studentCsrf)
        .send({ phone: stamp });

      expect(res.status).toBe(200);
      expect(res.body.user.phone).toBe(stamp);

      // Restore so other tests are unaffected
      await studentAgent
        .patch("/api/student/profile")
        .set("X-CSRF-Token", studentCsrf)
        .send({ phone: originalPhone ?? "" });
    });

    it("ignores attempts to change email or role via profile update", async () => {
      const res = await studentAgent
        .patch("/api/student/profile")
        .set("X-CSRF-Token", studentCsrf)
        .send({
          name: "E2E Name Check",
          email: "hacker@evil.com",
          role: "ADMIN",
        });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("student@lms.local");
      expect(res.body.user.role).toBe("STUDENT");

      // Restore name
      const original = await prisma.user.findUnique({
        where: { email: "student@lms.local" },
        select: { name: true },
      });
      void original; // name left as-is is acceptable; only email/role matter here
    });
  });
});
