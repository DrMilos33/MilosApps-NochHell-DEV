import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
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
  version: "0.8.0",
  environment: "dev",
  database: false,
});

const iconUrl = new URL("daylight-icon.svg", appUrl);
const iconResponse = await fetch(iconUrl, { cache: "no-store" });
assert.equal(iconResponse.status, 200, "Loader icon must return HTTP 200.");
assert.match(
  iconResponse.headers.get("content-type") ?? "",
  /^image\/svg\+xml(?:;|$)/i,
  "Loader icon must be served as image/svg+xml.",
);
const iconBytes = Buffer.from(await iconResponse.arrayBuffer());
const sourceIcon = await readFile(
  new URL("../public/daylight-icon.svg", import.meta.url),
);
assert.equal(
  createHash("sha256").update(iconBytes).digest("hex"),
  createHash("sha256").update(sourceIcon).digest("hex"),
  "Published loader icon must be byte-identical to the app source SVG.",
);

const browser = await chromium.launch();

async function verifyViewport({
  name,
  viewport,
  runNetworkBoundary = false,
  textScale = 1,
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
    if (textScale !== 1) {
      await page.addStyleTag({
        content: `html { font-size: ${textScale * 100}% !important; }`,
      });
    }
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
      await page.getByText("Standardort", { exact: true }).count(),
      1,
      `${name}: a fresh context must identify Cologne as the default place.`,
    );
    assert.equal(
      await page.getByRole("heading", { name: "Köln", exact: true }).count(),
      1,
      `${name}: a fresh context must show Cologne without waiting for place input.`,
    );
    assert.equal(
      await page.evaluate(() =>
        localStorage.getItem("milosapps.daylight.location.v1"),
      ),
      null,
      `${name}: the default place must not be persisted as a user choice.`,
    );
    assert.equal(await page.locator("[data-milos-loading-title]").evaluate((node) => node.tagName), "P");
    const loaderIcon = page.locator("[data-milos-loading-icon]");
    assert.deepEqual(
      await loaderIcon.evaluate((node) => {
        const style = getComputedStyle(node);
        return { width: Number.parseFloat(style.width), height: Number.parseFloat(style.height) };
      }),
      { width: 32, height: 32 },
      `${name}: shared loader icon must be exactly 32 by 32 CSS pixels.`,
    );
    assert.equal(await page.locator("milos-app-shell").count(), 1);
    assert.equal(
      await page.locator("[data-milos-privacy-notice]").count(),
      0,
      `${name}: necessary-only storage must not show a consent-like banner.`,
    );
    assert.equal(
      await page.locator("[data-milos-privacy-info]").getAttribute("href"),
      "https://dev.milos-apps.de/datenschutz",
      `${name}: privacy information must remain permanently reachable.`,
    );
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
    assert.equal(
      await page.getByText(/Anmelden|Login|Konto erstellen/).count(),
      0,
      `${name}: public direct access must not expose a login gate.`,
    );
    if (name === "desktop" || name === "smartphone") {
      const density = await page.evaluate(() => {
        const intro = document.querySelector(".intro")?.getBoundingClientRect();
        const answer = document.querySelector(".answer-card")?.getBoundingClientRect();
        return {
          introHeight: intro?.height ?? Number.POSITIVE_INFINITY,
          answerTop: answer?.top ?? Number.POSITIVE_INFINITY,
        };
      });
      assert.ok(
        density.introHeight <= (name === "desktop" ? 155 : 175),
        `${name}: intro must stay within the compact density budget.`,
      );
      assert.ok(
        density.answerTop <= (name === "desktop" ? 235 : 270),
        `${name}: the daylight answer for the default place must remain visible early.`,
      );
    }
    const footerGap = await page.locator("milos-app-shell").evaluate((shell) => {
      const footer = shell.shadowRoot?.querySelector("footer");
      if (!(footer instanceof HTMLElement)) return Number.POSITIVE_INFINITY;
      return Math.abs(
        document.documentElement.scrollHeight - footer.getBoundingClientRect().bottom,
      );
    });
    assert.ok(footerGap <= 1, `${name}: no empty area may remain below the footer.`);

    await page.getByRole("button", { name: "EN", exact: true }).click();
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    await page.waitForFunction(() => document.title === "Still light? – MilosApps");
    assert.equal(await page.title(), "Still light? – MilosApps");
    await page.getByRole("link", { name: "All apps" }).waitFor();
    await page.getByRole("button", { name: "Change place" }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page.locator("html").getAttribute("lang"),
      "en",
      `${name}: language choice must persist in the fresh app context.`,
    );

    if (runNetworkBoundary) {
      await page.getByRole("button", { name: "Change place" }).click();
      await page.getByRole("button", { name: "Use my location" }).waitFor();
      const placeInput = page.getByRole("combobox", { name: "Place or region" });
      await placeInput.fill("Freib");
      await page.getByRole("option").first().waitFor({ timeout: 30_000 });
      assert.equal(await page.locator("[role=listbox]:visible").count(), 1);
      assert.equal(await placeInput.getAttribute("aria-expanded"), "true");
      await page.getByRole("heading", { name: "Choose a place" }).click();
      await page.locator("[role=listbox]:visible").waitFor({ state: "hidden" });
      assert.equal(await placeInput.getAttribute("aria-expanded"), "false");

      await placeInput.fill("Berlin");
      await page.getByRole("button", { name: "Search" }).click();
      const result = page.getByRole("option", { name: "Berlin Germany" });
      await result.waitFor({ timeout: 30_000 });
      await result.click();
      await page.getByText("Sunrise", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Change place" }).click();
      await page
        .getByRole("combobox", { name: "Place or region" })
        .fill("Ber");
      await page.getByRole("option", { name: "Berlin Germany" }).first().waitFor();
      assert.equal(
        await page.locator("[role=listbox]:visible").count(),
        1,
        "Local and provider suggestions must share exactly one listbox.",
      );
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
      await page.getByRole("button", { name: "Change place" }).click();
      await page
        .getByRole("combobox", { name: "Place or region" })
        .fill("Hamburg");
      await page.getByRole("button", { name: "Search" }).click();
      const offlineAlert = page.getByRole("alert");
      await offlineAlert.waitFor();
      assert.match(
        (await offlineAlert.textContent()) ?? "",
        /(?:You are offline|A new place search needs an available network connection)\..*A saved place will continue to work\./,
      );
      await context.setOffline(false);
    }

    const appInlineTargets = await page
      .locator(".privacy-summary a, .data-attribution a")
      .evaluateAll((links) =>
        links.map((link) => {
          const rect = link.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      );
    assert.equal(
      appInlineTargets.length,
      3,
      `${name}: Privacy, OpenStreetMap and Open-Meteo/GeoNames links must be present.`,
    );
    assert.ok(
      appInlineTargets.every(
        ({ width, height }) => width >= 44 && height >= 44,
      ),
      `${name}: all app-owned inline links must keep 44px hit boxes.`,
    );

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
      textScale: `${textScale * 100}%`,
      appInlineTargets,
    };
  } finally {
    await context.close();
  }
}

async function verifyStrictCspRuntime() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "de-DE",
    colorScheme: "light",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const browserErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  try {
    await page.route(appUrl.href, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: {
          ...response.headers(),
          "content-security-policy": [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self'",
            "img-src 'self' data:",
            "connect-src 'self' https://nominatim.openstreetmap.org",
            "manifest-src 'self'",
            "worker-src 'self'",
            "base-uri 'none'",
          ].join("; "),
        },
      });
    });

    const response = await page.goto(appUrl.href, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    assert.equal(response?.status(), 200, "strict-csp: app must return HTTP 200.");
    await page.evaluate(() => customElements.whenDefined("milos-app-shell"));
    await page.getByRole("link", { name: "Alle Apps" }).waitFor();
    await page.getByRole("button", { name: "Ort ändern" }).click();
    const runtime = await page.locator("milos-app-shell").evaluate((shell) => {
      const root = shell.shadowRoot;
      const brand = root?.querySelector(".brand");
      const appIcon = root?.querySelector(".app-icon");
      const control = root?.querySelector(".control");
      const componentStyles = root?.querySelector(
        'link[data-milos-app-shell-component]',
      );
      const themeStyles = document.querySelector(
        'link[data-milos-app-shell-theme="daylight"]',
      );
      return {
        hostDisplay: getComputedStyle(shell).display,
        brandDisplay: brand ? getComputedStyle(brand).display : "missing",
        appIconColor: appIcon ? getComputedStyle(appIcon).color : "missing",
        controlHeight: control?.getBoundingClientRect().height ?? 0,
        componentStylesheet: componentStyles?.href ?? "missing",
        themeStylesheet: themeStyles?.href ?? "missing",
        essentialsStylesheets: [
          ...document.querySelectorAll(
            'link[href*="milosapps-essentials/v1"]',
          ),
        ].map((link) => link.href),
        essentialsInputHeight:
          document
            .querySelector("milos-place-search input")
            ?.getBoundingClientRect().height ?? 0,
        essentialsShareHeight:
          document
            .querySelector("milos-share-button button")
            ?.getBoundingClientRect().height ?? 0,
        essentialsInputBackground: getComputedStyle(
          document.querySelector("milos-place-search input"),
        ).backgroundColor,
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      };
    });
    assert.equal(runtime.hostDisplay, "grid");
    assert.equal(runtime.brandDisplay, "flex");
    assert.equal(runtime.appIconColor, "rgb(151, 54, 31)");
    assert.ok(runtime.controlHeight >= 44);
    assert.equal(runtime.overflow, 0);
    for (const url of [runtime.componentStylesheet, runtime.themeStylesheet]) {
      assert.ok(
        url.startsWith(`${appUrl.href}assets/`),
        "strict-csp: stylesheets must remain external same-origin assets.",
      );
    }
    assert.deepEqual(runtime.essentialsStylesheets, [
      `${appUrl.href}vendor/milosapps-essentials/v1/milos-app-essentials.css`,
      `${appUrl.href}vendor/milosapps-essentials/v1/milos-app-essentials-theme.css`,
    ]);
    assert.ok(runtime.essentialsInputHeight >= 44);
    assert.ok(runtime.essentialsShareHeight >= 44);
    assert.equal(runtime.essentialsInputBackground, "rgb(255, 250, 241)");
    assert.deepEqual(
      browserErrors,
      [],
      "strict-csp: browser console and page errors must remain empty.",
    );
    return {
      name: "strict-csp-runtime",
      viewport: { width: 390, height: 844 },
      directWithoutAuthState: true,
      policy: "default-src self; script-src self; style-src self",
      ...runtime,
      consoleErrors: browserErrors,
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
  results.push(await verifyStrictCspRuntime());
  results.push(
    await verifyViewport({
      name: "smartphone",
      viewport: { width: 390, height: 844 },
    }),
  );
  results.push(
    await verifyViewport({
      name: "200-percent-reflow",
      viewport: { width: 360, height: 800 },
      textScale: 2,
    }),
  );
  console.log(
    JSON.stringify(
      {
        status: "passed",
        appUrl: appUrl.href,
        healthUrl: healthUrl.href,
        iconUrl: iconUrl.href,
        iconContentType: iconResponse.headers.get("content-type"),
        iconSha256: createHash("sha256").update(iconBytes).digest("hex"),
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
