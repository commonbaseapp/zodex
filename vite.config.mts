import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ["*.js", "node_modules"]
    }
  },
});
