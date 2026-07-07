import request from "supertest";
import { app } from "../app";

const CREDENTIALS = {
  STUDENT: { email: "student@lms.local", password: "student123" },
  INSTRUCTOR: { email: "instructor@lms.local", password: "instructor123" },
  ADMIN: { email: "admin@lms.local", password: "admin123" },
} as const;

export async function loginAs(role: keyof typeof CREDENTIALS) {
  const agent = request.agent(app);
  const { email, password } = CREDENTIALS[role];

  const loginRes = await agent
    .post("/api/auth/login")
    .send({ email, password });

  if (loginRes.status !== 200) {
    throw new Error(
      `loginAs(${role}) failed: ${loginRes.status} ${JSON.stringify(loginRes.body)}`,
    );
  }

  const csrfRes = await agent.get("/api/csrf-token");
  const csrfToken = csrfRes.body.csrfToken;

  return { agent, csrfToken };
}
