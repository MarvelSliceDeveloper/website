import fs from "fs";
import path from "path";

/**
 * Resolves the uploads root directory to `apps/api/uploads` regardless of
 * whether the code runs from `src/` (ts-node dev) or `dist/` (compiled build).
 *
 * - Dev:  src/utils/uploads.ts  → resolve("..","..") = apps/api
 * - Prod: dist/utils/uploads.js → resolve("..","..") = apps/api
 */
export const uploadsRoot = path.resolve(__dirname, "..", "..", "uploads");

export function ensureUploadsDir(subpath: string): string {
  const dir = path.join(uploadsRoot, subpath);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
