import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";

describe("Notes", () => {
  let courseId: string;

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
  });

  describe("POST /api/notes", () => {
    it("creates a note when authenticated", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");

      const res = await agent
        .post("/api/notes")
        .set("X-CSRF-Token", csrfToken)
        .send({ courseId, title: "Test note", body: "Test body content" });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("note");
      expect(res.body.note.title).toBe("Test note");
      expect(res.body.note.body).toBe("Test body content");
      expect(res.body.note.courseId).toBe(courseId);
    });

    it("creates a sticky note", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");

      const res = await agent
        .post("/api/notes")
        .set("X-CSRF-Token", csrfToken)
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
      const { agent, csrfToken } = await loginAs("STUDENT");

      const res = await agent
        .post("/api/notes")
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "Missing courseId", body: "test" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/notes", () => {
    it("lists notes for the authenticated user", async () => {
      const { agent } = await loginAs("STUDENT");

      const res = await agent.get("/api/notes");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notes");
      expect(Array.isArray(res.body.notes)).toBe(true);
    });

    it("filters notes by courseId", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");

      await agent
        .post("/api/notes")
        .set("X-CSRF-Token", csrfToken)
        .send({ courseId, title: "Filter test", body: "test" });

      const res = await agent.get(`/api/notes?courseId=${courseId}`);

      expect(res.status).toBe(200);
      const notes = res.body.notes as any[];
      expect(notes.length).toBeGreaterThanOrEqual(1);
      notes.forEach((n: any) => expect(n.courseId).toBe(courseId));
    });
  });

  describe("PATCH /api/notes/:id", () => {
    it("updates a note", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");

      const createRes = await agent
        .post("/api/notes")
        .set("X-CSRF-Token", csrfToken)
        .send({ courseId, title: "Before", body: "original" });

      const noteId = createRes.body.note.id;

      const updateRes = await agent
        .patch(`/api/notes/${noteId}`)
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "After", body: "updated" });

      expect(updateRes.status).toBe(200);
    });

    it("returns 404 for non-existent note", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");

      const res = await agent
        .patch("/api/notes/non-existent-id")
        .set("X-CSRF-Token", csrfToken)
        .send({ title: "Ghost" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/notes/:id", () => {
    it("deletes a note", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");

      const createRes = await agent
        .post("/api/notes")
        .set("X-CSRF-Token", csrfToken)
        .send({ courseId, title: "To delete", body: "bye" });

      const noteId = createRes.body.note.id;

      const deleteRes = await agent
        .delete(`/api/notes/${noteId}`)
        .set("X-CSRF-Token", csrfToken);

      expect(deleteRes.status).toBe(200);

      const getRes = await agent.get(`/api/notes/${noteId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
