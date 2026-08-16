import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const rawUrl = process.argv[2] ?? process.env.DAYLIGHT_PRODUCTION_URL;
const expectedSource = process.argv[3] ?? process.env.DAYLIGHT_SOURCE_COMMIT;
assert.ok(rawUrl, "Pass the exact Cloudflare Pages production URL as the first argument.");
assert.match(
  expectedSource ?? "",
  /^[0-9a-f]{40}$/,
  "Pass the exact deployed source commit as the second argument.",
);

const appUrl = new URL(rawUrl);
assert.equal(appUrl.protocol, "https:", "Production must use HTTPS.");
assert.equal(appUrl.username, "");
assert.equal(appUrl.password, "");
appUrl.search = "";
appUrl.hash = "";
if (!appUrl.pathname.endsWith("/")) appUrl.pathname += "/";
const healthUrl = new URL("health.json", appUrl);

for (const path of ["__qa/not-found", "assets/definitely-not-real.js"]) {
  const response = await fetch(new URL(path, appUrl), {
    cache: "no-store",
    redirect: "manual",
  });
  assert.equal(response.status, 404, `${path} must fail closed with HTTP 404.`);
}

const healthResponse = await fetch(healthUrl, {
  cache: "no-store",
  headers: { Accept: "application/json" },
});
assert.equal(healthResponse.status, 200);
assert.match(healthResponse.headers.get("content-type") ?? "", /^application\/json(?:;|$)/i);
assert.match(healthResponse.headers.get("cache-control") ?? "", /no-store/i);
const health = await healthResponse.json();
assert.deepEqual(health, {
  status: "ready",
  appKey: "daylight",
  version: "1.0.1",
  environment: "production",
  database: false,
  productionApproved: true,
  adsEnabled: false,
  sourceCommit: expectedSource,
});

const iconResponse = await fetch(new URL("daylight-icon.svg", appUrl), { cache: "no-store" });
assert.equal(iconResponse.status, 200);
assert.match(iconResponse.headers.get("content-type") ?? "", /^image\/svg\+xml(?:;|$)/i);
const iconBytes = Buffer.from(await iconResponse.arrayBuffer());
const sourceIcon = await readFile(new URL("../public/daylight-icon.svg", import.meta.url));
assert.equal(
  createHash("sha256").update(iconBytes).digest("hex"),
  createHash("sha256").update(sourceIcon).digest("hex"),
);

const [rootResponse, robotsResponse, sitemapResponse, privacyResponse, adsResponse, adsHeadResponse] = await Promise.all([
  fetch(appUrl, { cache: "no-store" }),
  fetch(new URL("robots.txt", appUrl), { cache: "no-store" }),
  fetch(new URL("sitemap.xml", appUrl), { cache: "no-store" }),
  fetch(new URL("datenschutz", appUrl), { cache: "no-store" }),
  fetch(new URL("ads.txt", appUrl), { cache: "no-store", credentials: "omit" }),
  fetch(new URL("ads.txt", appUrl), { cache: "no-store", credentials: "omit", method: "HEAD" }),
]);
assert.equal(rootResponse.status, 200);
assert.equal(robotsResponse.status, 200);
assert.equal(sitemapResponse.status, 200);
assert.equal(privacyResponse.status, 200);
assert.equal(adsResponse.status, 200);
assert.equal(adsHeadResponse.status, 200);
assert.match(adsResponse.headers.get("content-type") ?? "", /^text\/plain(?:;|$)/i);
assert.match(adsHeadResponse.headers.get("content-type") ?? "", /^text\/plain(?:;|$)/i);
const [rootHtml, robots, sitemap, privacy] = await Promise.all([
  rootResponse.text(),
  robotsResponse.text(),
  sitemapResponse.text(),
  privacyResponse.text(),
]);
assert.equal(
  (await adsResponse.text()).trim(),
  "google.com, pub-6713794414913834, DIRECT, f08c47fec0942fa0",
);
assert.match(rootHtml, /<link rel="canonical" href="https:\/\/sinddielampenan\.de\/"/);
assert.match(rootHtml, /Standardort Köln/);
assert.match(rootHtml, /data-ads-enabled="false"/);
assert.doesNotMatch(rootHtml, /adsbygoogle|google-adsense-account|googlesyndication/i);
assert.match(robots, /Sitemap: https:\/\/sinddielampenan\.de\/sitemap\.xml/);
assert.match(sitemap, /https:\/\/sinddielampenan\.de\/datenschutz/);
assert.match(privacy, /<link rel="canonical" href="https:\/\/sinddielampenan\.de\/datenschutz"/);
assert.match(privacy, /keine Werbung/i);

const browser = await chromium.launch();

async function verifyViewport(name, viewport, reflow = false) {
  const context = await browser.newContext({
    viewport,
    locale: "de-DE",
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  let releaseEntry = () => {};
  let navigationPromise;

  try {
    if (reflow) {
      const reflowUrl = new URL("__qa/reflow-200.css", appUrl).href;
      await page.route(reflowUrl, (route) =>
        route.fulfill({
          status: 200,
          contentType: "text/css",
          body: "html { font-size: 200% !important; }",
        }),
      );
      await page.route(appUrl.href, async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          body: (await response.text()).replace(
            "</head>",
            '<link rel="stylesheet" href="./__qa/reflow-200.css" /></head>',
          ),
        });
      });
    }

    const entryRelease = new Promise((resolve) => {
      releaseEntry = resolve;
    });
    await page.route("**/assets/index-*.js", async (route) => {
      await entryRelease;
      await route.continue();
    }, { times: 1 });
    const entryRequest = page.waitForRequest((request) =>
      /\/assets\/index-[^/]+\.js$/.test(new URL(request.url()).pathname),
    );
    navigationPromise = page.goto(appUrl.href, { waitUntil: "networkidle" });
    await entryRequest;
    const loadingIcon = page.locator("[data-milos-loading-icon]");
    await loadingIcon.waitFor({ state: "visible" });
    const loaderSize = await loadingIcon.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    assert.deepEqual(loaderSize, { width: 32, height: 32 });
    releaseEntry();

    const response = await navigationPromise;
    assert.equal(response?.status(), 200, `${name}: app must return HTTP 200.`);
    const csp = response?.headers()["content-security-policy"] ?? "";
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /connect-src 'self' https:\/\/geocoding-api\.open-meteo\.com/);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|nominatim/i);
    assert.doesNotMatch(csp, /doubleclick|googlesyndication|googleadservices|google-analytics/i);
    assert.equal(await page.locator("body").getAttribute("data-app-key"), "daylight");
    assert.equal(await page.locator("body").getAttribute("data-environment"), "production");
    assert.equal(await page.locator("body").getAttribute("data-ads-enabled"), "false");
    assert.equal(await page.getByText("DEV", { exact: true }).isVisible(), false);
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(await page.getByText(/Anmelden|Login|Konto erstellen/).count(), 0);
    assert.equal(
      await page.getByRole("link", { name: "Alle Apps" }).getAttribute("href"),
      "https://milos-apps.de/apps",
    );
    assert.equal(
      await page.locator("[data-milos-privacy-info]").getAttribute("href"),
      "https://sinddielampenan.de/datenschutz",
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      0,
      `${name}: no horizontal overflow`,
    );

    await page.getByRole("button", { name: "EN", exact: true }).click();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    assert.deepEqual(errors, [], `${name}: browser errors`);
  } finally {
    releaseEntry();
    await navigationPromise?.catch(() => {});
    await context.close();
  }
}

async function verifyProviderAndOffline() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "de-DE",
    serviceWorkers: "allow",
  });
  const page = await context.newPage();
  try {
    await page.goto(appUrl.href, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ort ändern", exact: true }).click();
    const input = page.getByRole("combobox", { name: "Ort oder Region" });
    await input.fill("Freib");
    await page.getByRole("option").first().waitFor({ timeout: 30_000 });
    assert.equal(await page.locator("[role=listbox]:visible").count(), 1);
    await page.getByRole("heading", { name: "Ort wählen" }).click();
    await page.locator("[role=listbox]:visible").waitFor({ state: "hidden" });

    await input.fill("Berlin");
    await page.getByRole("button", { name: "Suchen" }).click();
    const result = page.getByRole("option", { name: /Berlin.*Deutschland/ }).first();
    await result.waitFor({ timeout: 30_000 });
    await result.click();
    assert.equal(new URL(page.url()).search, "");
    assert.equal(new URL(page.url()).hash, "");

    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload({ waitUntil: "networkidle" });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Berlin" }).waitFor();
    const healthWasServedOffline = await page.evaluate(async () => {
      try {
        const response = await fetch("./health.json", { cache: "no-store" });
        return response.ok;
      } catch {
        return false;
      }
    });
    assert.equal(healthWasServedOffline, false, "Health must remain network-only.");
  } finally {
    await context.close();
  }
}

try {
  await verifyViewport("desktop", { width: 1440, height: 900 });
  await verifyViewport("smartphone", { width: 390, height: 844 });
  await verifyViewport("200-percent-reflow", { width: 360, height: 800 }, true);
  await verifyProviderAndOffline();
  console.log(
    JSON.stringify(
      {
        status: "passed",
        appUrl: appUrl.href,
        healthUrl: healthUrl.href,
        sourceCommit: expectedSource,
        health,
        provider: "Open-Meteo Geocoding API",
        csp: "strict same-origin with Open-Meteo connect-src",
        offline: "app shell reopens; health remains network-only",
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
