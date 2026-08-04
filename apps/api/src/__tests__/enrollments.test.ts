import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";
import { prisma } from "../utils/prisma";

describe("Enrollments — Approve/Reject Workflow", () => {
  let enrollmentId: string;
  let testCourseId: string;
  let testBatchId: string;
  let studentAgent: any;
  let studentCsrf: string;

  beforeAll(async () => {
    // Create a test course for enrollment testing
    const { agent: adminAgent, csrfToken: adminCsrf } = await loginAs("ADMIN");
    const courseRes = await adminAgent
      .post("/api/admin/courses")
      .set("X-CSRF-Token", adminCsrf)
      .send({
        title: `Enrollment Test Course ${Date.now()}`,
        description: "Course created for enrollment test",
      });
    expect(courseRes.status).toBe(201);
    testCourseId = courseRes.body.id;

    // Publish the course so it's enrollable
    await prisma.course.update({
      where: { id: testCourseId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    // Get the batch
    const batchRes = await adminAgent.get(
      "/api/payments/batches?packageId=pkg-datascience",
    );
    const batches = batchRes.body.items ?? batchRes.body;
    if (Array.isArray(batches) && batches.length > 0) {
      testBatchId = batches[0].id;
    }

    // Create a fresh student for enrollment testing
    const uniqueEmail = `enroll-test-${Date.now()}@lms.local`;
    const regRes = await request(app).post("/api/auth/register").send({
      name: "Enrollment Test Student",
      email: uniqueEmail,
      password: "StrongPass1",
    });
    expect(regRes.status).toBe(201);

    // Login as this student
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail, password: "StrongPass1" });
    expect(loginRes.status).toBe(200);

    studentAgent = request.agent(app);
    // Set the auth cookie
    const cookies = loginRes.headers["set-cookie"];
    if (cookies) {
      for (const cookie of cookies) {
        const [cookiePart] = cookie.split(";");
        studentAgent.jar.setCookie(cookiePart);
      }
    }

    const csrfRes = await studentAgent.get("/api/csrf-token");
    studentCsrf = csrfRes.body.csrfToken;
  }, 30000);

  // ── Student Enrolls in Course ─────────────────────────────────────────────
  describe("POST /api/courses/enroll", () => {
    it("student submits enrollment request", async () => {
      const res = await studentAgent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", studentCsrf)
        .send({ courseId: testCourseId });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("enrollment");
      expect(res.body.enrollment.status).toBe("PENDING");
      enrollmentId = res.body.enrollment.id;
    });

    it("rejects duplicate enrollment", async () => {
      const res = await studentAgent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", studentCsrf)
        .send({ courseId: testCourseId });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already/i);
    });

    it("returns 400 for missing courseId", async () => {
      const res = await studentAgent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", studentCsrf)
        .send({});

      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent course", async () => {
      const res = await studentAgent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", studentCsrf)
        .send({ courseId: "non-existent-course-id" });

      expect(res.status).toBe(404);
    });
  });

  // ── Admin Lists Enrollment Requests ───────────────────────────────────────
  describe("GET /api/admin/enrollments", () => {
    it("lists all enrollment requests", async () => {
      const { agent } = await loginAs("ADMIN");
      const res = await agent.get("/api/admin/enrollments");

      expect(res.status).toBe(200);
      // API returns { items, total, page, limit } via paginate()
      expect(res.body).toHaveProperty("items");
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it("filters by status", async () => {
      const { agent } = await loginAs("ADMIN");
      const res = await agent.get("/api/admin/enrollments?status=PENDING");

      expect(res.status).toBe(200);
      const items = res.body.items as any[];
      items.forEach((e: any) => expect(e.status).toBe("PENDING"));
    });

    it("returns 403 for non-admin", async () => {
      const res = await studentAgent.get("/api/admin/enrollments");

      expect(res.status).toBe(403);
    });
  });

  // ── Admin Approves Enrollment ─────────────────────────────────────────────
  describe("PATCH /api/admin/enrollments/:id/approve", () => {
    it("approves enrollment and assigns to batch", async () => {
      if (!testBatchId) {
        console.warn("No batch found, skipping approve test");
        return;
      }

      const { agent, csrfToken } = await loginAs("ADMIN");
      const res = await agent
        .patch(`/api/admin/enrollments/${enrollmentId}/approve`)
        .set("X-CSRF-Token", csrfToken)
        .send({ batchId: testBatchId });

      expect(res.status).toBe(200);
      expect(res.body.enrollment.status).toBe("APPROVED");
    });

    it("returns 400 for already-approved enrollment", async () => {
      const { agent, csrfToken } = await loginAs("ADMIN");
      const res = await agent
        .patch(`/api/admin/enrollments/${enrollmentId}/approve`)
        .set("X-CSRF-Token", csrfToken)
        .send({ batchId: testBatchId });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot approve/i);
    });

    it("returns 400 for missing batchId", async () => {
      // Create a new enrollment to test this
      const uniqueEmail = `approve-test-${Date.now()}@lms.local`;
      await request(app).post("/api/auth/register").send({
        name: "Approve Test",
        email: uniqueEmail,
        password: "StrongPass1",
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: uniqueEmail, password: "StrongPass1" });

      const freshAgent = request.agent(app);
      const cookies = loginRes.headers["set-cookie"];
      if (cookies) {
        for (const cookie of cookies) {
          const [cookiePart] = cookie.split(";");
          freshAgent.jar.setCookie(cookiePart);
        }
      }

      const csrfRes = await freshAgent.get("/api/csrf-token");
      const enrollRes = await freshAgent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", csrfRes.body.csrfToken)
        .send({ courseId: testCourseId });

      const { agent, csrfToken } = await loginAs("ADMIN");
      const res = await agent
        .patch(`/api/admin/enrollments/${enrollRes.body.enrollment.id}/approve`)
        .set("X-CSRF-Token", csrfToken)
        .send({}); // No batchId

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/batchId/i);
    });

    it("returns 404 for non-existent enrollment", async () => {
      const { agent, csrfToken } = await loginAs("ADMIN");
      const res = await agent
        .patch("/api/admin/enrollments/non-existent-id/approve")
        .set("X-CSRF-Token", csrfToken)
        .send({ batchId: testBatchId });

      expect(res.status).toBe(404);
    });
  });

  // ── Admin Rejects Enrollment ──────────────────────────────────────────────
  describe("PATCH /api/admin/enrollments/:id/reject", () => {
    let rejectEnrollmentId: string;

    beforeAll(async () => {
      // Create a fresh enrollment to reject
      const uniqueEmail = `reject-test-${Date.now()}@lms.local`;
      await request(app).post("/api/auth/register").send({
        name: "Reject Test",
        email: uniqueEmail,
        password: "StrongPass1",
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: uniqueEmail, password: "StrongPass1" });

      const freshAgent = request.agent(app);
      const cookies = loginRes.headers["set-cookie"];
      if (cookies) {
        for (const cookie of cookies) {
          const [cookiePart] = cookie.split(";");
          freshAgent.jar.setCookie(cookiePart);
        }
      }

      const csrfRes = await freshAgent.get("/api/csrf-token");
      const enrollRes = await freshAgent
        .post("/api/courses/enroll")
        .set("X-CSRF-Token", csrfRes.body.csrfToken)
        .send({ courseId: testCourseId });

      rejectEnrollmentId = enrollRes.body.enrollment.id;
    });

    it("rejects an enrollment request", async () => {
      const { agent, csrfToken } = await loginAs("ADMIN");
      const res = await agent
        .patch(`/api/admin/enrollments/${rejectEnrollmentId}/reject`)
        .set("X-CSRF-Token", csrfToken);

      expect(res.status).toBe(200);
      expect(res.body.enrollment.status).toBe("REJECTED");
    });

    it("returns 400 for already-rejected enrollment", async () => {
      const { agent, csrfToken } = await loginAs("ADMIN");
      const res = await agent
        .patch(`/api/admin/enrollments/${rejectEnrollmentId}/reject`)
        .set("X-CSRF-Token", csrfToken);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot reject/i);
    });

    it("returns 404 for non-existent enrollment", async () => {
      const { agent, csrfToken } = await loginAs("ADMIN");
      const res = await agent
        .patch("/api/admin/enrollments/non-existent-id/reject")
        .set("X-CSRF-Token", csrfToken);

      expect(res.status).toBe(404);
    });
  });
});
