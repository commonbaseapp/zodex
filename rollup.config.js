// Build so accessible to GitHub Pages

export default [
  {
    input: "node_modules/zod/lib/index.mjs",
    output: {
      file: "demo/vendor/zod.js",
      format: "esm",
    },
  },
];
