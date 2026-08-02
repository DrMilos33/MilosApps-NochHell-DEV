import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import path from "node:path";

const essentialsBrowserArtifacts = [
  "milos-app-essentials.css",
  "milos-app-essentials-theme.css",
  "milos-app-essentials.js",
  "bootstrap.js",
] as const;

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "copy-locked-essentials-runtime",
      generateBundle() {
        for (const artifact of essentialsBrowserArtifacts) {
          this.emitFile({
            type: "asset",
            fileName: `vendor/milosapps-essentials/v1/${artifact}`,
            source: readFileSync(
              path.resolve("vendor/milosapps-essentials/v1", artifact),
            ),
          });
        }
      },
    },
  ],
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
