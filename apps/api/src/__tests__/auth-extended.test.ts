import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../app";
import { loginAs } from "./helpers";

async function registerFreshStudent() {
  const email = `ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@lms.local`;
  const password = "StrongPass1";
  const regRes = await request(app)
    .post("/api/auth/register")
    .send({ name: "Ext Test Student", email, password });
  if (regRes.status !== 201)
    throw new Error(`Register failed: ${regRes.body.error}`);
  const agent = request.agent(app);
  const loginRes = await agent
    .post("/api/auth/login")
    .send({ email, password });
  if (loginRes.status !== 200)
    throw new Error(`Login failed: ${loginRes.body.error}`);
  const csrfRes = await agent.get("/api/csrf-token");
  const csrfToken = csrfRes.body.csrfToken;
  return { agent, csrfToken, email, password };
}

describe("Auth — Extended Flows", () => {
  // ── Register ──────────────────────────────────────────────────────────────
  describe("POST /api/auth/register", () => {
    it("registers a new user with valid data", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: `test-register-${Date.now()}@lms.local`,
          password: "StrongPass1",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("role");
    });

    it("returns 409 for duplicate email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Duplicate",
        email: "student@lms.local",
        password: "StrongPass1",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it("returns 400 for weak password (no uppercase)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Weak Pass",
          email: `weak-${Date.now()}@lms.local`,
          password: "nouppercase1",
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 for weak password (no digit)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "No Digit",
          email: `nodigit-${Date.now()}@lms.local`,
          password: "NoDigitHere",
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 for short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Short",
          email: `short-${Date.now()}@lms.local`,
          password: "Ab1",
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 for missing fields", async () => {
      const res = await request(app).post("/api/auth/register").send({});

      expect(res.status).toBe(400);
    });
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  describe("POST /api/auth/logout", () => {
    it("logs out successfully", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out/i);
    });
  });

  // ── Change Password ───────────────────────────────────────────────────────
  describe("PATCH /api/auth/me/password", () => {
    let studentAgent: request.Agent;
    let studentCsrf: string;

    beforeAll(async () => {
      const { agent, csrfToken } = await registerFreshStudent();
      studentAgent = agent;
      studentCsrf = csrfToken;
    });

    it("changes password with correct current password", async () => {
      const res = await studentAgent
        .patch("/api/auth/me/password")
        .set("X-CSRF-Token", studentCsrf)
        .send({
          currentPassword: "StrongPass1",
          newPassword: "NewStrongPass1",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/password changed/i);

      // Change back so other tests aren't affected
      await studentAgent
        .patch("/api/auth/me/password")
        .set("X-CSRF-Token", studentCsrf)
        .send({
          currentPassword: "NewStrongPass1",
          newPassword: "StrongPass1",
        });
    });

    it("returns 400 for wrong current password", async () => {
      const res = await studentAgent
        .patch("/api/auth/me/password")
        .set("X-CSRF-Token", studentCsrf)
        .send({
          currentPassword: "wrongpassword",
          newPassword: "NewStrongPass1",
        });

      expect(res.status).toBe(400);
    });

    it("returns 400 for short new password", async () => {
      const res = await studentAgent
        .patch("/api/auth/me/password")
        .set("X-CSRF-Token", studentCsrf)
        .send({
          currentPassword: "StrongPass1",
          newPassword: "Ab1",
        });

      expect(res.status).toBe(400);
    });

    it("returns 403 without authentication (CSRF double-submit fails without session cookie)", async () => {
      // CSRF double-submit requires a matching session cookie. Without an
      // authenticated session, the CSRF middleware blocks before auth runs.
      const agent = request.agent(app);
      const csrfRes = await agent.get("/api/csrf-token");
      const csrfToken = csrfRes.body.csrfToken;

      const res = await agent
        .patch("/api/auth/me/password")
        .set("X-CSRF-Token", csrfToken)
        .send({
          currentPassword: "student123",
          newPassword: "NewStrongPass1",
        });

      expect(res.status).toBe(403);
    });

    it("returns 403 without CSRF token (CSRF blocks first)", async () => {
      const res = await studentAgent.patch("/api/auth/me/password").send({
        currentPassword: "StrongPass1",
        newPassword: "NewStrongPass1",
      });

      expect(res.status).toBe(403);
    });
  });

  // ── Update Profile ────────────────────────────────────────────────────────
  describe("PATCH /api/auth/me/profile", () => {
    it("updates the user's name", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");
      const original = (await agent.get("/api/auth/me")).body.user.name;

      const res = await agent
        .patch("/api/auth/me/profile")
        .set("X-CSRF-Token", csrfToken)
        .send({ name: "Updated Name" });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe("Updated Name");

      // Restore original
      await agent
        .patch("/api/auth/me/profile")
        .set("X-CSRF-Token", csrfToken)
        .send({ name: original });
    });

    it("returns 400 for name too short", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");

      const res = await agent
        .patch("/api/auth/me/profile")
        .set("X-CSRF-Token", csrfToken)
        .send({ name: "A" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for missing name", async () => {
      const { agent, csrfToken } = await loginAs("STUDENT");

      const res = await agent
        .patch("/api/auth/me/profile")
        .set("X-CSRF-Token", csrfToken)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ── Forgot / Reset Password ───────────────────────────────────────────────
  describe("POST /api/auth/forgot-password", () => {
    it("always returns success (no email enumeration)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "student@lms.local" });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset link/i);
    });

    it("returns same success for non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nonexistent@nowhere.com" });

      expect(res.status).toBe(200);
    });

    it("returns 400 for missing email", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({});

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("returns 400 for invalid token", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "invalid-token", newPassword: "StrongPass1" });

      expect(res.status).toBe(400);
    });

    it("returns 400 for weak password", async () => {
      const res = await request(app)
        .post("/api/auth/reset-password")
        .send({ token: "some-token", newPassword: "weak" });

      expect(res.status).toBe(400);
    });
  });
});
