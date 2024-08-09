import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        ".idea", "dist", "*.config.mjs", "*.config.mts",
        "*.js", "node_modules"
      ]
    }
  },
});
