import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const baseUrl = "http://127.0.0.1:4319";
const screenshotPath = fileURLToPath(
  new URL("../public/portal-preview.png", import.meta.url),
);

const server = await preview({
  preview: {
    host: "127.0.0.1",
    port: 4319,
    strictPort: true,
  },
});

let browser;

try {
  const response = await fetch(`${baseUrl}/health.json`, {
    headers: { Accept: "application/json" },
  });
  const body = response.ok ? await response.json() : null;
  if (body?.status !== "ready" || body?.appKey !== "daylight") {
    throw new Error("Vorschaubild-Quelle gehört nicht zu App-Key daylight.");
  }

  browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: "light",
    locale: "de-DE",
    viewport: { width: 1200, height: 630 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem(
      "daylight.location.v1",
      JSON.stringify({
        id: "relation-62422",
        name: "Berlin",
        context: "Deutschland",
        latitude: 52.5173885,
        longitude: 13.3951309,
        timeZone: "Europe/Berlin",
        source: "manual",
      }),
    );
  });
  await page.clock.install({ time: new Date("2026-07-30T16:00:00Z") });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("#answer-card").screenshot({ path: screenshotPath });
  await context.close();
  console.log(`Portal-Vorschaubild erstellt: ${screenshotPath}`);
} finally {
  await browser?.close();
  await server.close();
}
