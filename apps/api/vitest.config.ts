import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@lms/types": path.resolve(__dirname, "../../packages/types/src"),
      "@lms/config": path.resolve(__dirname, "../../packages/config/src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
