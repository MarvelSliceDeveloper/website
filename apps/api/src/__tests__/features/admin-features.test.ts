import { describe, it, expect, vi, beforeAll } from "vitest";
import backupRouter from "../../modules/admin/backup/backup.routes";
import webhooksRouter from "../../modules/admin/webhooks/alerting-webhooks.routes";

function mockRouter(router: any) {
  const routes: { method: string; path: string }[] = [];
  if (!router.stack) return routes;
  router.stack.forEach((layer: any) => {
    if (layer.route) {
      const method = Object.keys(layer.route.methods)[0].toUpperCase();
      const path = layer.route.path;
      routes.push({ method, path });
    }
  });
  return routes;
}

describe("Admin Features: Backup, Alerting Webhooks", () => {
  describe("Backup Routes", () => {
    const routes = mockRouter(backupRouter);

    it("registers POST /", () => {
      const route = routes.find((r) => r.path === "/" && r.method === "POST");
      expect(route).toBeDefined();
    });

    it("registers GET /list", () => {
      const route = routes.find((r) => r.path === "/list" && r.method === "GET");
      expect(route).toBeDefined();
    });

    it("registers POST /restore", () => {
      const route = routes.find((r) => r.path === "/restore" && r.method === "POST");
      expect(route).toBeDefined();
    });

    it("registers DELETE /:filename", () => {
      const route = routes.find((r) => r.path === "/:filename" && r.method === "DELETE");
      expect(route).toBeDefined();
    });

    it("registers GET /download/:filename", () => {
      const route = routes.find((r) => r.path === "/download/:filename" && r.method === "GET");
      expect(route).toBeDefined();
    });
  });

  describe("Alerting Webhook Routes", () => {
    const routes = mockRouter(webhooksRouter);

    it("registers GET /", () => {
      const route = routes.find((r) => r.path === "/" && r.method === "GET");
      expect(route).toBeDefined();
    });

    it("registers POST /", () => {
      const route = routes.find((r) => r.path === "/" && r.method === "POST");
      expect(route).toBeDefined();
    });

    it("registers PUT /:id", () => {
      const route = routes.find((r) => r.path === "/:id" && r.method === "PUT");
      expect(route).toBeDefined();
    });

    it("registers DELETE /:id", () => {
      const route = routes.find((r) => r.path === "/:id" && r.method === "DELETE");
      expect(route).toBeDefined();
    });

    it("registers POST /:id/test", () => {
      const route = routes.find((r) => r.path === "/:id/test" && r.method === "POST");
      expect(route).toBeDefined();
    });
  });
});
