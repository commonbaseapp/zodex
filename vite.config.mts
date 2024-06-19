import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ["*.js", "demo", "node_modules"]
    }
  },
});
