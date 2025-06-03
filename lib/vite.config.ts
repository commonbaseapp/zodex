import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        ".idea",
        "dist",
        "*.config.js",
        "*.config.ts",
        "*.js",
        "node_modules",
        "infer.ts",
        "zod-types.ts",
      ],
    },
    reporters: [
      [
        "default",
        {
          summary: false
        }
      ]
    ],
  },
});
