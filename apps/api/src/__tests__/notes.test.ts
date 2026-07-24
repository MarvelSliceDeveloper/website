import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";

describe("Notes", () => {
  let courseId: string;
  let studentAgent: any;
  let studentCsrf: string;

  beforeAll(async () => {
    const { agent } = await loginAs("ADMIN");
    const coursesRes = await agent.get("/api/admin/courses");

    const course = coursesRes.body.courses?.find(
      (c: any) => c.slug === "python-for-data-science",
    );
    if (!course) {
      throw new Error(
        "python-for-data-science course not found. Run prisma:seed first.",
      );
    }
    courseId = course.id;

    // Register a fresh student to avoid loginAs race with auth-extended test
    const uniqueEmail = `notes-test-${Date.now()}@lms.local`;
    const regRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Notes Test Student",
        email: uniqueEmail,
        password: "StrongPass1",
      });
    expect(regRes.status).toBe(201);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail, password: "StrongPass1" });
    expect(loginRes.status).toBe(200);

    studentAgent = request.agent(app);
    const cookies = loginRes.headers["set-cookie"];
    if (cookies) {
      for (const cookie of cookies) {
        const [cookiePart] = cookie.split(";");
        studentAgent.jar.setCookie(cookiePart);
      }
    }

    const csrfRes = await studentAgent.get("/api/csrf-token");
    studentCsrf = csrfRes.body.csrfToken;
  });

  describe("POST /api/notes", () => {
    it("creates a note when authenticated", async () => {
      const res = await studentAgent
        .post("/api/notes")
        .set("X-CSRF-Token", studentCsrf)
        .send({ courseId, title: "Test note", body: "Test body content" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("note");
      expect(res.body.note.title).toBe("Test note");
      expect(res.body.note.body).toBe("Test body content");
      expect(res.body.note.courseId).toBe(courseId);
    });

    it("creates a sticky note", async () => {
      const res = await studentAgent
        .post("/api/notes")
        .set("X-CSRF-Token", studentCsrf)
        .send({
          courseId,
          title: "Sticky",
          body: "Pinned note",
          isSticky: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.note.isSticky).toBe(true);
    });

    it("returns 403 without CSRF token", async () => {
      const res = await request(app)
        .post("/api/notes")
        .send({ courseId, title: "No CSRF", body: "test" });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 400 without courseId", async () => {
      const res = await studentAgent
        .post("/api/notes")
        .set("X-CSRF-Token", studentCsrf)
        .send({ title: "Missing courseId", body: "test" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/notes", () => {
    it("lists notes for the authenticated user", async () => {
      const res = await studentAgent.get("/api/notes");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("items");
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it("filters notes by courseId", async () => {
      await studentAgent
        .post("/api/notes")
        .set("X-CSRF-Token", studentCsrf)
        .send({ courseId, title: "Filter test", body: "test" });

      const res = await studentAgent.get(`/api/notes?courseId=${courseId}`);

      expect(res.status).toBe(200);
      const notes = res.body.items as any[];
      expect(notes.length).toBeGreaterThanOrEqual(1);
      notes.forEach((n: any) => expect(n.courseId).toBe(courseId));
    });
  });

  describe("PATCH /api/notes/:id", () => {
    it("updates a note", async () => {
      const createRes = await studentAgent
        .post("/api/notes")
        .set("X-CSRF-Token", studentCsrf)
        .send({ courseId, title: "Before", body: "original" });

      const noteId = createRes.body.note.id;

      const updateRes = await studentAgent
        .patch(`/api/notes/${noteId}`)
        .set("X-CSRF-Token", studentCsrf)
        .send({ title: "After", body: "updated" });

      expect(updateRes.status).toBe(200);
    });

    it("returns 404 for non-existent note", async () => {
      const res = await studentAgent
        .patch("/api/notes/non-existent-id")
        .set("X-CSRF-Token", studentCsrf)
        .send({ title: "Ghost" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("deletes a note", async () => {
      const createRes = await studentAgent
        .post("/api/notes")
        .set("X-CSRF-Token", studentCsrf)
        .send({ courseId, title: "To delete", body: "bye" });

      const noteId = createRes.body.note.id;

      const deleteRes = await studentAgent
        .delete(`/api/notes/${noteId}`)
        .set("X-CSRF-Token", studentCsrf);

      expect(deleteRes.status).toBe(200);

      const getRes = await studentAgent.get(`/api/notes/${noteId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
