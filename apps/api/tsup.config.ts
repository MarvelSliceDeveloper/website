import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  outDir: "dist",
  clean: true,
  sourcemap: true,
  skipNodeModulesBundle: true,
  noExternal: [
    "@lms/types",
    "@lms/config",
    "@lms/utils",
    "@lms/email-templates", // bundle workspace packages
  ],
});
