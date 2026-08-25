import fs from "fs";
import path from "path";

// Resolve version from root package.json (monorepo root = 3 levels up from dist)
function readPackageVersion(): string {
  try {
    // dist/modules/version -> apps/api -> repo root
    const pkgPath = path.resolve(__dirname, "../../../../package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
        version?: string;
      };
      if (pkg.version) return pkg.version;
    }
    // Fallback: apps/api/package.json
    const apiPkgPath = path.resolve(__dirname, "../../../package.json");
    if (fs.existsSync(apiPkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(apiPkgPath, "utf-8")) as {
        version?: string;
      };
      if (pkg.version) return pkg.version;
    }
  } catch {
    // ignore
  }
  return "0.0.0";
}

const VERSION = readPackageVersion();
const BUILD_TIME = process.env.BUILD_TIME || new Date().toISOString();
const GIT_COMMIT =
  process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
const NODE_ENV = process.env.NODE_ENV || "development";
const APP_NAME = "LMS Portal";

export interface VersionInfo {
  name: string;
  version: string;
  env: string;
  buildTime: string;
  commit: string;
  commitShort: string;
}

export function getVersionInfo(): VersionInfo {
  return {
    name: APP_NAME,
    version: VERSION,
    env: NODE_ENV,
    buildTime: BUILD_TIME,
    commit: GIT_COMMIT,
    commitShort: GIT_COMMIT === "unknown" ? "unknown" : GIT_COMMIT.slice(0, 7),
  };
}
