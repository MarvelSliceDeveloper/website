import { Router, type Request, type Response } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  type AuthRequest,
} from "../../middleware/auth.middleware";
import { getVersionInfo } from "./version.service";
import fs from "fs";
import path from "path";

const router = Router();

// GET /api/version — public, no auth (CSRF exempt via app.ts)
router.get("/", (_req: Request, res: Response) => {
  const info = getVersionInfo();
  return res.json({
    name: info.name,
    version: info.version,
    env: info.env,
    commit: info.commitShort,
    buildTime: info.buildTime,
  });
});

// GET /api/version/details — super admin only, includes full commit + changelog tail
router.get(
  "/details",
  requireAuth,
  requireSuperAdmin,
  async (_req: AuthRequest, res: Response) => {
    const info = getVersionInfo();
    let changelog: string | null = null;
    try {
      const changelogPath = path.resolve(
        __dirname,
        "../../../../docs/changelog.md",
      );
      // In prod dist is at apps/api/dist, so docs is 4 levels up
      const candidates = [
        path.resolve(__dirname, "../../../../docs/changelog.md"),
        path.resolve(__dirname, "../../../../../docs/changelog.md"),
        path.resolve(process.cwd(), "docs/changelog.md"),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, "utf-8");
          // First 4000 chars (~50 lines) to keep payload small
          changelog = raw.slice(0, 8000);
          break;
        }
      }
    } catch {
      // ignore
    }

    return res.json({
      ...info,
      commit: info.commit,
      changelog,
    });
  },
);

export { router as versionRouter };
