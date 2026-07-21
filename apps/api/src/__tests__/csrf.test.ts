import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("CSRF Token", () => {
  it("GET /api/csrf-token returns a token", async () => {
    const res = await request(app).get("/api/csrf-token");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("csrfToken");
    expect(typeof res.body.csrfToken).toBe("string");
    expect(res.body.csrfToken.length).toBeGreaterThan(0);
  });

  it("returns a unique token on each call", async () => {
    const res1 = await request(app).get("/api/csrf-token");
    const res2 = await request(app).get("/api/csrf-token");

    expect(res1.body.csrfToken).not.toBe(res2.body.csrfToken);
  });
});

describe("CSRF Protection", () => {
  it("blocks POST to protected route without CSRF token", async () => {
    const res = await request(app)
      .post("/api/notes")
      .send({ courseId: "test", title: "x", body: "y" });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("rejects POST with valid CSRF token but no auth (CSRF session mismatch)", async () => {
    const agent = request.agent(app);

    const csrfRes = await agent.get("/api/csrf-token");
    const csrfToken = csrfRes.body.csrfToken;

    const res = await agent
      .post("/api/notes")
      .set("X-CSRF-Token", csrfToken)
      .send({ courseId: "test", title: "x", body: "y" });

    // Unauthenticated requests get a random session ID per request,
    // so the CSRF token issued on GET is bound to a different session
    // than the one used on POST. This results in 403 (CSRF rejection)
    // rather than 401 (auth rejection).
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("skips CSRF for GET requests", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });
});
