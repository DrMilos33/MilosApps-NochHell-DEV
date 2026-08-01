import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    assetsInlineLimit: 0,
    target: "es2022",
    sourcemap: true,
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
