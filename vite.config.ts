import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import path from "node:path";

const essentialsBrowserArtifacts = [
  "milos-app-essentials.css",
  "milos-app-essentials-theme.css",
  "milos-app-essentials.js",
  "bootstrap.js",
] as const;

export const productionCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "connect-src 'self' https://geocoding-api.open-meteo.com",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

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
    sourcemap: false,
  },
  preview: {
    headers: {
      "Content-Security-Policy": productionCsp,
      "Cross-Origin-Opener-Policy": "same-origin",
      "Permissions-Policy": "geolocation=(self), camera=(), microphone=()",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
