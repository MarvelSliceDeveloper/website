import { describe, it, expect, beforeAll, vi } from "vitest";
import jwt from "jsonwebtoken";
import { authService } from "../../modules/auth/auth.service";
import { UserRole } from "@lms/types";
import { prisma } from "../../utils/prisma";

const JWT_SECRET = "test-secret-key-for-unit-tests-32chars!!";

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.JWT_EXPIRY = "1h";
});

vi.mock("../../utils/prisma", () => ({
  prisma: {
    adminSession: {
      create: vi.fn().mockResolvedValue({ id: "session-1" }),
      findUnique: vi.fn().mockResolvedValue({ active: true }),
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("Session Security", () => {
  describe("generateTokens creates AdminSession for admin roles", () => {
    it("creates AdminSession for SUPER_ADMIN", async () => {
      const result = await authService.generateTokens({
        id: "u1",
        role: UserRole.SUPER_ADMIN,
        email: "admin@test.com",
        name: "Admin",
      });

      expect(prisma.adminSession.create).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();

      const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
      expect(decoded.sessionId).toBe("session-1");
    });

    it("creates AdminSession for ADMIN", async () => {
      const result = await authService.generateTokens({
        id: "u2",
        role: UserRole.ADMIN,
        email: "admin2@test.com",
        name: "Admin2",
      });

      expect(prisma.adminSession.create).toHaveBeenCalled();
      const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
      expect(decoded.sessionId).toBe("session-1");
    });

    it("does NOT create AdminSession for STUDENT", async () => {
      const result = await authService.generateTokens({
        id: "u3",
        role: UserRole.STUDENT,
        email: "student@test.com",
        name: "Student",
      });

      const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
      expect(decoded.sessionId).toBeUndefined();
    });

    it("includes sessionTimeoutMin in JWT payload", async () => {
      const result = await authService.generateTokens({
        id: "u1",
        role: UserRole.ADMIN,
        email: "admin@test.com",
        name: "Admin",
        sessionTimeoutMin: 120,
      });

      const decoded = jwt.decode(result.accessToken) as Record<string, unknown>;
      expect(decoded.sessionTimeoutMin).toBe(120);
    });
  });
});
