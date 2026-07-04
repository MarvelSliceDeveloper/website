import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";

describe("Auth", () => {
  describe("POST /api/auth/login", () => {
    it("logs in with valid student credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "student@lms.local", password: "student123" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toMatchObject({
        role: "STUDENT",
        email: "student@lms.local",
      });
    });

    it("logs in with valid instructor credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "instructor@lms.local", password: "instructor123" });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("INSTRUCTOR");
    });

    it("logs in with valid admin credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@lms.local", password: "admin123" });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("ADMIN");
    });

    it("returns 401 for invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "student@lms.local", password: "wrong" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("returns 400 for missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "student@lms.local" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns the authenticated user with valid token", async () => {
      const { agent } = await loginAs("STUDENT");

      const res = await agent.get("/api/auth/me");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toMatchObject({
        email: "student@lms.local",
        role: "STUDENT",
      });
    });

    it("returns 401 without authentication", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("returns user with correct role for each role type", async () => {
      const roles = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
      for (const role of roles) {
        const { agent } = await loginAs(role);
        const res = await agent.get("/api/auth/me");
        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe(role);
      }
    });
  });
});
