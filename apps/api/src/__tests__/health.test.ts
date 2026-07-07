import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("Health Check", () => {
  it("GET /health returns 200 with status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("GET /health returns a valid ISO timestamp", async () => {
    const res = await request(app).get("/health");

    expect(() => new Date(res.body.timestamp)).not.toThrow();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
