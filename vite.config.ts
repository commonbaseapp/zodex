import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "demo",
        ".idea",
        "dist",
        "*.config.js",
        "*.config.ts",
        "node_modules",
        "src/zod-types.ts",
      ],
    },
  },
});
