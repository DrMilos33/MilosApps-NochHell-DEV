import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const defaultUrl = "https://drmilos33.github.io/MilosApps-NochHell-DEV/";
const appUrl = new URL(process.argv[2] ?? defaultUrl);
const healthUrl = new URL("health.json", appUrl);

assert.equal(appUrl.protocol, "https:", "External DEV must use HTTPS.");
assert.equal(
  appUrl.origin,
  "https://drmilos33.github.io",
  "External DEV must remain on the documented app-owned GitHub Pages origin.",
);
assert.equal(
  appUrl.pathname,
  "/MilosApps-NochHell-DEV/",
  "External DEV must use the documented app route.",
);

const healthResponse = await fetch(healthUrl, {
  cache: "no-store",
  headers: { Accept: "application/json" },
});
assert.equal(healthResponse.status, 200, "Health endpoint must return HTTP 200.");
const health = await healthResponse.json();
assert.deepEqual(health, {
  status: "ready",
  appKey: "daylight",
  version: "0.2.0",
  environment: "dev",
  database: false,
});

const browser = await chromium.launch();

async function verifyViewport({
  name,
  viewport,
  runNetworkBoundary = false,
}) {
  // Every context is deliberately created without storageState or authentication.
  const context = await browser.newContext({
    viewport,
    locale: "de-DE",
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  try {
    const response = await page.goto(appUrl.href, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    assert.equal(response?.status(), 200, `${name}: app must return HTTP 200.`);
    assert.equal(page.url(), appUrl.href, `${name}: direct request must not redirect.`);
    assert.equal(
      await page.locator("body").getAttribute("data-app-key"),
      "daylight",
      `${name}: app identity must match.`,
    );
    assert.equal(
      await page.locator("body").getAttribute("data-environment"),
      "dev",
      `${name}: environment must remain DEV.`,
    );
    assert.equal(await page.locator("header").count(), 1);
    assert.equal(await page.locator("main").count(), 1);
    assert.equal(await page.locator("footer").count(), 1);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(
      await page.getByRole("link", { name: "Alle Apps" }).getAttribute("href"),
      "https://dev.milos-apps.de/apps",
    );
    assert.equal(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
      0,
      `${name}: document must not overflow horizontally.`,
    );

    await page.getByRole("button", { name: "EN", exact: true }).click();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    assert.equal(await page.title(), "Still light? – MilosApps");
    await page.getByRole("link", { name: "All apps" }).waitFor();
    await page.getByRole("button", { name: "Use location" }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.locator("html").getAttribute("lang"),
      "en",
      `${name}: language choice must persist in the fresh app context.`,
    );

    if (runNetworkBoundary) {
      await page
        .getByRole("searchbox", { name: "Place or region" })
        .fill("Berlin");
      await page.getByRole("button", { name: "Search place" }).click();
      const result = page.getByRole("button", { name: /Berlin.*city/i }).first();
      await result.waitFor({ timeout: 30_000 });
      await result.click();
      await page.getByText("Sunrise", { exact: true }).waitFor();
      assert.equal(
        await page.locator(".event-card").count(),
        4,
        "Selected place must expose all four required event cards.",
      );
      assert.equal(
        new URL(page.url()).search,
        "",
        "Coordinates and place data must not enter the app URL.",
      );

      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload({ waitUntil: "networkidle" });
      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Berlin" }).waitFor();
      await page
        .getByRole("searchbox", { name: "Place or region" })
        .fill("Hamburg");
      await page.getByRole("button", { name: "Search place" }).click();
      const offlineAlert = page.getByRole("alert");
      await offlineAlert.waitFor();
      assert.match(
        (await offlineAlert.textContent()) ?? "",
        /(?:You are offline|A new place search needs an available network connection)\..*A saved place will continue to work\./,
      );
      await context.setOffline(false);
    }

    const unexpectedBrowserErrors = browserErrors.filter(
      (message) =>
        !(
          runNetworkBoundary &&
          message.includes("net::ERR_INTERNET_DISCONNECTED")
        ),
    );
    assert.deepEqual(
      unexpectedBrowserErrors,
      [],
      `${name}: browser console and page errors must remain empty.`,
    );
    return {
      name,
      viewport,
      directWithoutAuthState: true,
      language: "de/en persisted",
      networkBoundary: runNetworkBoundary
        ? "online search and offline reopening passed"
        : "shell smoke passed",
    };
  } finally {
    await context.close();
  }
}

try {
  const results = [];
  results.push(
    await verifyViewport({
      name: "desktop",
      viewport: { width: 1440, height: 900 },
      runNetworkBoundary: true,
    }),
  );
  results.push(
    await verifyViewport({
      name: "smartphone",
      viewport: { width: 390, height: 844 },
    }),
  );
  console.log(
    JSON.stringify(
      {
        status: "passed",
        appUrl: appUrl.href,
        healthUrl: healthUrl.href,
        health,
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
