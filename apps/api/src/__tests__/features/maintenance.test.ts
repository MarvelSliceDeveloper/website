import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

vi.mock("../../utils/prisma", () => ({
  prisma: {
    systemSetting: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "../../utils/prisma";
import {
  maintenanceMiddleware,
  resetMaintenanceCache,
} from "../../middleware/maintenance.middleware";

function mockReq(path: string) {
  return { path, method: "GET", log: { error: vi.fn() } } as any;
}

function mockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

function mockNext() {
  return vi.fn();
}

describe("Maintenance Middleware", () => {
  beforeAll(() => {
    process.env.NODE_ENV = "test";
  });

  beforeEach(() => {
    vi.clearAllMocks();
    resetMaintenanceCache();
  });

  it("blocks non-admin routes during maintenance", async () => {
    (prisma.systemSetting.findUnique as any).mockResolvedValue({
      key: "maintenance_mode",
      value: JSON.stringify({ enabled: true, message: "Down" }),
    });
    const req = mockReq("/api/courses");
    const res = mockRes();
    const next = mockNext();

    await maintenanceMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("allows requests through when maintenance mode is off", async () => {
    (prisma.systemSetting.findUnique as any).mockResolvedValue(null);
    const req = mockReq("/api/courses");
    const res = mockRes();
    const next = mockNext();

    await maintenanceMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows admin routes through during maintenance", async () => {
    (prisma.systemSetting.findUnique as any).mockResolvedValue({
      key: "maintenance_mode",
      value: JSON.stringify({ enabled: true, message: "" }),
    });
    const req = mockReq("/api/admin/settings");
    const res = mockRes();
    const next = mockNext();

    await maintenanceMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("blocks health endpoint during maintenance", async () => {
    (prisma.systemSetting.findUnique as any).mockResolvedValue({
      key: "maintenance_mode",
      value: JSON.stringify({ enabled: true, message: "" }),
    });
    const req = mockReq("/health");
    const res = mockRes();
    const next = mockNext();

    await maintenanceMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("allows CSRF token endpoint during maintenance", async () => {
    (prisma.systemSetting.findUnique as any).mockResolvedValue({
      key: "maintenance_mode",
      value: JSON.stringify({ enabled: true, message: "" }),
    });
    const req = mockReq("/api/csrf-token");
    const res = mockRes();
    const next = mockNext();

    await maintenanceMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows login endpoint during maintenance", async () => {
    (prisma.systemSetting.findUnique as any).mockResolvedValue({
      key: "maintenance_mode",
      value: JSON.stringify({ enabled: true, message: "" }),
    });
    const req = mockReq("/api/auth/login");
    const res = mockRes();
    const next = mockNext();

    await maintenanceMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows maintenance-status endpoint during maintenance", async () => {
    (prisma.systemSetting.findUnique as any).mockResolvedValue({
      key: "maintenance_mode",
      value: JSON.stringify({ enabled: true, message: "" }),
    });
    const req = mockReq("/api/maintenance-status");
    const res = mockRes();
    const next = mockNext();

    await maintenanceMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("allows super-admin routes during maintenance", async () => {
    (prisma.systemSetting.findUnique as any).mockResolvedValue({
      key: "maintenance_mode",
      value: JSON.stringify({ enabled: true, message: "" }),
    });
    const req = mockReq("/api/admin/users/pending");
    const res = mockRes();
    const next = mockNext();

    await maintenanceMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
