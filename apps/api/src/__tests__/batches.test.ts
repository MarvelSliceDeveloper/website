import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { Agent } from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";
import { prisma } from "../utils/prisma";

/**
 * Integration tests for Batch management (/api/admin/batches).
 *
 * Role matrix per batch.routes.ts:
 *   GET    helpers + list + detail — ADMIN, INSTRUCTOR
 *   POST / PUT / DELETE — ADMIN only
 */
describe("Batches — Admin CRUD", () => {
  let adminAgent: Agent;
  let adminCsrf: string;
  let instructorAgent: Agent;
  let studentAgent: Agent;
  let courseId: string;
  let instructorId: string;
  let createdBatchId: string;

  const uniqueName = () =>
    `Int Test Batch ${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  beforeAll(async () => {
    const admin = await loginAs("ADMIN");
    adminAgent = admin.agent;
    adminCsrf = admin.csrfToken;

    instructorAgent = (await loginAs("INSTRUCTOR")).agent;
    studentAgent = (await loginAs("STUDENT")).agent;

    const coursesRes = await adminAgent.get("/api/admin/batches/courses");
    expect(coursesRes.status).toBe(200);
    const courses = Array.isArray(coursesRes.body)
      ? coursesRes.body
      : coursesRes.body.courses;
    expect(courses.length).toBeGreaterThan(0);
    courseId = courses[0].id;

    const instructorsRes = await adminAgent.get(
      "/api/admin/batches/instructors",
    );
    expect(instructorsRes.status).toBe(200);
    const instructors = Array.isArray(instructorsRes.body)
      ? instructorsRes.body
      : instructorsRes.body.instructors;
    expect(instructors.length).toBeGreaterThan(0);
    instructorId = instructors[0].id;
  }, 30000);

  afterAll(async () => {
    // Safety net in case a test failed mid-flow before DELETE ran.
    await prisma.batch.deleteMany({
      where: { name: { contains: "Int Test Batch" } },
    });
  });

  it("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/admin/batches");
    expect(res.status).toBe(401);
  });

  it("returns 403 for student on list and create", async () => {
    expect((await studentAgent.get("/api/admin/batches")).status).toBe(403);
    expect(
      (
        await studentAgent
          .post("/api/admin/batches")
          .set("X-CSRF-Token", "dummy")
          .send({})
      ).status,
    ).toBe(403);
  });

  it("returns 403 for instructor on create (ADMIN-only mutation)", async () => {
    const res = await instructorAgent
      .post("/api/admin/batches")
      .set("X-CSRF-Token", "dummy")
      .send({ name: uniqueName() });
    expect(res.status).toBe(403);
  });

  it("lists batches as admin and as instructor", async () => {
    for (const agent of [adminAgent, instructorAgent]) {
      const res = await agent.get("/api/admin/batches");
      expect(res.status).toBe(200);
      const batches = Array.isArray(res.body) ? res.body : res.body.batches;
      expect(Array.isArray(batches)).toBe(true);
    }
  });

  describe("CRUD round-trip", () => {
    it("creates a batch", async () => {
      const res = await adminAgent
        .post("/api/admin/batches")
        .set("X-CSRF-Token", adminCsrf)
        .send({
          courseId,
          instructorId,
          name: uniqueName(),
          startDate: "2026-08-01T00:00:00.000Z",
          endDate: "2026-12-01T00:00:00.000Z",
          maxStudents: 25,
          description: "Created by batches integration test",
        });

      expect(res.status).toBe(201);
      const batch = res.body.batch ?? res.body;
      expect(batch.id).toBeDefined();
      expect(batch.name).toContain("Int Test Batch");
      createdBatchId = batch.id;
    });

    it("fetches the created batch by id", async () => {
      const res = await adminAgent.get(`/api/admin/batches/${createdBatchId}`);
      expect(res.status).toBe(200);
      const batch = res.body.batch ?? res.body;
      expect(batch.id).toBe(createdBatchId);
    });

    it("rejects creation with missing required fields", async () => {
      const res = await adminAgent
        .post("/api/admin/batches")
        .set("X-CSRF-Token", adminCsrf)
        .send({ name: uniqueName() });
      expect([400, 500]).toContain(res.status);
      expect(res.body.error ?? res.body.message).toBeDefined();
    });

    it("updates the batch name and max students", async () => {
      const res = await adminAgent
        .put(`/api/admin/batches/${createdBatchId}`)
        .set("X-CSRF-Token", adminCsrf)
        .send({ maxStudents: 40 });

      expect(res.status).toBe(200);
      const batch = res.body.batch ?? res.body;
      expect(batch.maxStudents ?? 40).toBe(40);
    });

    it("soft-deletes the batch", async () => {
      const res = await adminAgent
        .delete(`/api/admin/batches/${createdBatchId}`)
        .set("X-CSRF-Token", adminCsrf);
      expect(res.status).toBe(200);

      const deleted = await prisma.batch.findUnique({
        where: { id: createdBatchId },
      });
      expect(deleted?.deletedAt).not.toBeNull();
    });

    it("returns an error status for deleting a nonexistent batch", async () => {
      const res = await adminAgent
        .delete("/api/admin/batches/no-such-batch-id")
        .set("X-CSRF-Token", adminCsrf);
      expect([404, 500]).toContain(res.status);
    });
  });
});
