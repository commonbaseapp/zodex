// Build so accessible to GitHub Pages

export default [
  {
    input: "node_modules/zod/lib/index.mjs",
    output: {
      file: "demo/vendor/zod.js",
      format: "esm",
    },
  },
  {
    input: "node_modules/@brettz9/jsonref/dist/pointer.js",
    output: {
      file: "demo/vendor/pointer.js",
      format: "esm",
    },
  },
];
