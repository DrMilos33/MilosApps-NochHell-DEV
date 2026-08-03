import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const berlinResult = {
  osm_id: 62422,
  osm_type: "relation",
  lat: "52.5173885",
  lon: "13.3951309",
  display_name: "Berlin, Deutschland",
  name: "Berlin",
  type: "city",
  addresstype: "city",
  address: {
    city: "Berlin",
    country: "Deutschland",
    country_code: "de",
  },
};

const berlinLocation = {
  id: "relation-62422",
  name: "Berlin",
  context: "Deutschland",
  latitude: 52.5173885,
  longitude: 13.3951309,
  timeZone: "Europe/Berlin",
  source: "manual",
};

async function mockGeocoder(
  page: Page,
  results: unknown[] = [berlinResult],
  delayMilliseconds = 0,
): Promise<void> {
  await page.route("https://nominatim.openstreetmap.org/search**", async (route) => {
    if (delayMilliseconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMilliseconds));
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(results),
    });
  });
}

async function selectBerlin(page: Page): Promise<void> {
  await page.getByRole("combobox", { name: "Ort oder Region" }).fill("Berlin");
  await page.getByRole("button", { name: "Suchen" }).click();
  await page
    .getByRole("option", { name: "Berlin Deutschland" })
    .click();
}

async function openStoredLocationAt(
  page: Page,
  location: typeof berlinLocation,
  instant: string,
): Promise<void> {
  await page.addInitScript((storedLocation) => {
    localStorage.setItem("milosapps.daylight.location.v1", JSON.stringify(storedLocation));
  }, location);
  await page.clock.install({ time: new Date(instant) });
  await page.goto("/");
}

test.describe("öffentlicher Kernfluss", () => {
  test.beforeEach(async ({ page }) => {
    await mockGeocoder(page);
  });

  test("erkennt den eigenen DEV-Dienst am App-Key statt nur an HTTP 200", async ({
    request,
  }) => {
    const response = await request.get("/health.json");
    expect(response.ok()).toBe(true);
    expect(await response.json()).toMatchObject({
      status: "ready",
      appKey: "daylight",
      version: "0.5.1",
      environment: "dev",
    });
  });

  test("bietet manuelle Suche und Geräteortung gleichwertig ohne Login an", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Noch hell für einen Spaziergang?" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Ort oder Region" })).toHaveAttribute(
      "placeholder",
      "z. B. Freiburg",
    );
    await expect(page.getByRole("button", { name: "Meinen Ort verwenden" })).toBeVisible();
    await expect(page.getByText(/Anmelden|Login|Konto erstellen/)).toHaveCount(0);
  });

  test("fragt den Gerätestandort nie automatisch an", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Permission-Aufrufe werden einmal in Chromium geprüft.");
    await page.addInitScript(() => {
      const state = window as Window & { __GEO_REQUESTS__?: number };
      state.__GEO_REQUESTS__ = 0;
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: () => {
            state.__GEO_REQUESTS__ = (state.__GEO_REQUESTS__ ?? 0) + 1;
          },
        },
      });
    });
    await page.goto("/");
    await page.waitForTimeout(250);
    expect(
      await page.evaluate(
        () => (window as Window & { __GEO_REQUESTS__?: number }).__GEO_REQUESTS__,
      ),
    ).toBe(0);
    await page.getByRole("button", { name: "Meinen Ort verwenden" }).click();
    expect(
      await page.evaluate(
        () => (window as Window & { __GEO_REQUESTS__?: number }).__GEO_REQUESTS__,
      ),
    ).toBe(1);
  });

  test("zeigt alle geforderten Sonnenzeiten und hält Koordinaten aus der App-URL", async ({
    page,
  }) => {
    await page.goto("/");
    await selectBerlin(page);

    await expect(page.getByRole("heading", { name: "Berlin" })).toBeVisible();
    await expect(page.getByText("Sonnenaufgang", { exact: true })).toBeVisible();
    await expect(page.getByText("Sonnenuntergang", { exact: true })).toBeVisible();
    await expect(page.getByText("Ende bürgerliche Dämmerung", { exact: true })).toBeVisible();
    await expect(page.getByText("Morgen: Sonnenaufgang", { exact: true })).toBeVisible();
    expect(new URL(page.url()).search).toBe("");
    expect(page.url()).not.toContain("52.5173885");
    expect(page.url()).not.toContain("13.3951309");
  });

  test("unterscheidet gleichnamige Orte durch ihren Kontext", async ({ page }) => {
    await page.unroute("https://nominatim.openstreetmap.org/search**");
    await mockGeocoder(page, [
      {
        ...berlinResult,
        osm_id: 1,
        lat: "49.3501",
        lon: "8.1382",
        name: "Neustadt",
        display_name: "Neustadt, Rheinland-Pfalz, Deutschland",
        address: {
          city: "Neustadt",
          state: "Rheinland-Pfalz",
          country: "Deutschland",
        },
      },
      {
        ...berlinResult,
        osm_id: 2,
        lat: "53.5511",
        lon: "9.9937",
        name: "Neustadt",
        display_name: "Neustadt, Hamburg, Deutschland",
        address: {
          city: "Neustadt",
          state: "Hamburg",
          country: "Deutschland",
        },
      },
    ]);
    await page.goto("/");
    await page.getByRole("combobox", { name: "Ort oder Region" }).fill("Neustadt");
    await page.getByRole("button", { name: "Suchen" }).click();

    await expect(
      page.getByRole("option", { name: "Neustadt Rheinland-Pfalz · Deutschland" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Neustadt Hamburg · Deutschland" }),
    ).toBeVisible();
  });

  test("erklärt unbekannte Orte und erlaubt einen neuen Versuch", async ({ page }) => {
    await page.unroute("https://nominatim.openstreetmap.org/search**");
    await mockGeocoder(page, []);
    await page.goto("/");
    await page.getByRole("combobox", { name: "Ort oder Region" }).fill("Unbekanntshausen");
    await page.getByRole("button", { name: "Suchen" }).click();
    await expect(page.locator("[data-milos-place-status]")).toContainText(
      "Kein passender Ort gefunden",
    );
    await expect(page.getByRole("combobox", { name: "Ort oder Region" })).toBeEnabled();
  });

  test("ist vollständig mit Tastatur bedienbar", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("combobox", { name: "Ort oder Region" });
    await search.focus();
    await search.fill("Berlin");
    await search.press("Enter");
    await expect(page.getByRole("option", { name: "Berlin Deutschland" })).toBeVisible();
    await search.press("ArrowDown");
    await search.press("Enter");
    await expect(page.getByRole("heading", { name: "Berlin" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ort ändern" })).toBeVisible();
  });

  test("hat im Hauptfluss keine automatisiert erkennbaren WCAG-Verstöße", async ({ page }) => {
    await page.goto("/");
    await selectBerlin(page);
    const results = await new AxeBuilder({ page })
      .exclude(".answer-sun")
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("verursacht im normalen Hauptfluss keine Konsolenfehler", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await selectBerlin(page);
    expect(errors).toEqual([]);
  });

  test("bleibt in hellem und dunklem Systemmodus lesbar", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const lightColor = await page.evaluate(() => getComputedStyle(document.body).color);
    await expect(page.getByRole("heading", { name: "Noch hell für einen Spaziergang?" })).toBeVisible();

    await page.emulateMedia({ colorScheme: "dark" });
    const darkColor = await page.evaluate(() => getComputedStyle(document.body).color);
    expect(lightColor).not.toBe(darkColor);
    await expect(page.getByRole("button", { name: "Suchen" })).toBeVisible();
  });

  test("hält DOM und Startressourcen bewusst klein", async ({ page }) => {
    await page.goto("/");
    const metrics = await page.evaluate(() => ({
      domElements: document.querySelectorAll("*").length,
      transferredBytes: performance
        .getEntriesByType("resource")
        .reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).transferSize, 0),
    }));
    expect(metrics.domElements).toBeLessThan(230);
    expect(metrics.transferredBytes).toBeLessThan(300_000);
  });

  test("hält Einstieg, Ortswahl und Tageslichtantwort bewusst kompakt", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Layout-Geometrie wird einmal geprüft.");

    for (const viewport of [
      { width: 1440, height: 900, introMax: 155, locationTopMax: 225 },
      { width: 390, height: 844, introMax: 175, locationTopMax: 290 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const metrics = await page.evaluate(() => {
        const intro = document.querySelector<HTMLElement>(".intro");
        const heading = document.querySelector<HTMLElement>(".intro h1");
        const location = document.querySelector<HTMLElement>(".location-card");
        if (!intro || !heading || !location) throw new Error("Layout-Grundelement fehlt");
        return {
          introHeight: intro.getBoundingClientRect().height,
          headingSize: Number.parseFloat(getComputedStyle(heading).fontSize),
          locationTop: location.getBoundingClientRect().top,
        };
      });
      expect(metrics.introHeight).toBeLessThanOrEqual(viewport.introMax);
      expect(metrics.headingSize).toBeLessThanOrEqual(viewport.width > 500 ? 34 : 30);
      expect(metrics.locationTop).toBeLessThanOrEqual(viewport.locationTopMax);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await selectBerlin(page);
    const resultMetrics = await page.evaluate(() => {
      const answer = document.querySelector<HTMLElement>(".answer-card");
      const eventCards = [...document.querySelectorAll<HTMLElement>(".event-card")];
      if (!answer || eventCards.length !== 4) throw new Error("Ergebnislayout fehlt");
      return {
        answerHeight: answer.getBoundingClientRect().height,
        eventHeight: Math.max(...eventCards.map((card) => card.getBoundingClientRect().height)),
      };
    });
    expect(resultMetrics.answerHeight).toBeLessThanOrEqual(300);
    expect(resultMetrics.eventHeight).toBeLessThanOrEqual(135);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const mobileResultMetrics = await page.evaluate(() => {
      const answer = document.querySelector<HTMLElement>(".answer-card");
      const eventCards = [...document.querySelectorAll<HTMLElement>(".event-card")];
      if (!answer || eventCards.length !== 4) throw new Error("Mobiles Ergebnislayout fehlt");
      return {
        answerHeight: answer.getBoundingClientRect().height,
        eventHeight: Math.max(...eventCards.map((card) => card.getBoundingClientRect().height)),
        answerTop: answer.getBoundingClientRect().top,
      };
    });
    expect(mobileResultMetrics.answerHeight).toBeLessThanOrEqual(310);
    expect(mobileResultMetrics.eventHeight).toBeLessThanOrEqual(135);
    expect(mobileResultMetrics.answerTop).toBeLessThanOrEqual(290);
  });

  test("fließt bei einer 200-Prozent-äquivalenten Breite ohne horizontales Scrollen um", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 720 });
    await page.goto("/");
    await selectBerlin(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Ort ändern" })).toBeVisible();
    await expect(page.getByText("Ende bürgerliche Dämmerung", { exact: true })).toBeVisible();
  });
});

test.describe("public-app-essentials/v1", () => {
  test("zeigt bei langsamem Start nur einen kleinen CSS-first Loader und genau eine Dokumentüberschrift", async ({
    page,
  }) => {
    let releaseRuntime!: () => void;
    const runtimeGate = new Promise<void>((resolve) => {
      releaseRuntime = resolve;
    });
    await page.route("**/runtime-config.json", async (route) => {
      await runtimeGate;
      await route.continue();
    });

    const navigation = page.goto("/", { waitUntil: "load" });
    const loader = page.locator("[data-milos-app-loading]");
    await expect(loader).toBeVisible();
    const loaderMetrics = await loader.evaluate((target) => {
      const title = target.querySelector("[data-milos-loading-title]");
      const icon = target.querySelector("[data-milos-loading-icon]");
      return {
        titleTag: title?.tagName,
        iconWidth: icon?.getBoundingClientRect().width ?? 0,
      };
    });
    releaseRuntime();
    await navigation;
    expect(loaderMetrics.titleTag).toBe("P");
    expect(loaderMetrics.iconWidth).toBeLessThanOrEqual(56);
    await expect(loader).toBeHidden();
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("zeigt bei ausschließlich notwendiger Speicherung eine dauerhafte Information ohne Schein-Einwilligung", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("milosapps.daylight.privacyNotice.v1", "dismissed");
    });
    await page.goto("/");
    await expect(page.locator("[data-milos-privacy-notice]")).toHaveCount(0);
    const privacy = page.locator(".privacy-section");
    await expect(privacy).toContainText("Ort, Sprache und ein kleiner Suchcache bleiben lokal");
    await expect(privacy.getByRole("link", { name: "Datenschutz" })).toHaveAttribute(
      "href",
      "https://dev.milos-apps.de/datenschutz",
    );
    expect(
      await page.evaluate(() => localStorage.getItem("milosapps.daylight.privacyNotice.v1")),
    ).toBeNull();
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(privacy).toContainText("Place, language and a small search cache stay local");
    await expect(privacy.getByRole("link", { name: "Privacy" })).toBeVisible();
    await page.reload();
    await expect(page.locator("[data-milos-privacy-notice]")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("hält Privacy und OpenStreetMap auch mobil als 44-Pixel-Ziele", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Die mobile Zielgeometrie wird einmal deterministisch in Chromium geprüft.",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "EN", exact: true }).click();

    const targets = page.locator(".privacy-summary a, .data-attribution a");
    await expect(targets).toHaveCount(2);
    const sizes = await targets.evaluateAll((links) =>
      links.map((link) => {
        const rect = link.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    );
    expect(sizes.every(({ width, height }) => width >= 44 && height >= 44)).toBe(
      true,
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    ).toBe(0);
  });

  test("teilt nur eine ortsneutrale kanonische App-URL und behandelt Abbruch still", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (payload: ShareData) => {
          (window as Window & { __SHARED__?: ShareData }).__SHARED__ = payload;
        },
      });
    });
    await page.goto("/?latitude=52.5#private-location");
    const share = page.getByRole("button", { name: "Teilen" });
    const before = await share.boundingBox();
    await share.click();
    const payload = await page.evaluate(
      () => (window as Window & { __SHARED__?: ShareData }).__SHARED__,
    );
    expect(payload?.url).toBe("http://127.0.0.1:4319/");
    expect(JSON.stringify(payload)).not.toMatch(/52\.5|Berlin|latitude/);
    await expect(page.locator("[data-milos-share-status]")).toHaveText("");
    expect(await share.boundingBox()).toEqual(before);

    await page.evaluate(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          throw new DOMException("cancelled", "AbortError");
        },
      });
    });
    await share.click();
    await expect(page.locator("[data-milos-share-status]")).toHaveText("");
  });

  test("kopiert beim Share-Fallback Text und kanonische URL", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as Window & { __COPIED__?: string }).__COPIED__ = value;
          },
        },
      });
    });
    await page.goto("/");
    const beforeHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.getByRole("button", { name: "Teilen" }).click();
    const copied = await page.evaluate(
      () => (window as Window & { __COPIED__?: string }).__COPIED__,
    );
    expect(copied).toContain("http://127.0.0.1:4319/");
    expect(copied).not.toMatch(/Koordinat|latitude|longitude/);
    await expect(page.locator("[data-milos-share-status]")).toHaveText("Link kopiert");
    await expect(page.locator("[data-milos-share-status]")).toHaveCSS("position", "fixed");
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(beforeHeight);
  });

  test("startet die providerneutrale Ortssuche nur mit Enter oder Suchen", async ({
    page,
  }) => {
    let requests = 0;
    await page.route("https://nominatim.openstreetmap.org/search**", async (route) => {
      requests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([berlinResult]),
      });
    });
    await page.goto("/");
    const searchbox = page.getByRole("combobox", { name: "Ort oder Region" });
    await searchbox.fill("Berlin");
    expect(requests).toBe(0);
    await searchbox.press("Enter");
    await expect(page.getByRole("option", { name: "Berlin Deutschland" })).toBeVisible();
    expect(requests).toBe(1);
    await expect(page.locator("milos-date-picker")).toHaveCount(0);
  });

  test("liefert gesperrte Browserartefakte mit passenden MIME-Typen aus", async ({
    request,
  }) => {
    for (const file of [
      "milos-app-essentials.css",
      "milos-app-essentials-theme.css",
    ]) {
      const response = await request.get(`/vendor/milosapps-essentials/v1/${file}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/css");
    }
    for (const file of ["bootstrap.js", "milos-app-essentials.js"]) {
      const response = await request.get(`/vendor/milosapps-essentials/v1/${file}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/javascript");
    }
    const iconResponse = await request.get("/daylight-icon.svg");
    expect(iconResponse.status()).toBe(200);
    expect(iconResponse.headers()["content-type"]).toContain("image/svg+xml");
    const sourceIcon = await readFile("public/daylight-icon.svg");
    expect(
      createHash("sha256").update(await iconResponse.body()).digest("hex"),
    ).toBe(createHash("sha256").update(sourceIcon).digest("hex"));
  });
});

test.describe("public-app-shell/v2", () => {
  test("setzt semantische Shell, DEV-Identität und absolute DEV-Links", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("body")).toHaveAttribute("data-app-key", "daylight");
    await expect(page.locator("body")).toHaveAttribute("data-environment", "dev");
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByText("DEV", { exact: true })).toBeVisible();
    await expect(page.locator("milos-app-shell")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "MilosApps DEV", exact: true })).toHaveAttribute(
      "href",
      "https://dev.milos-apps.de/",
    );
    await expect(page.getByRole("link", { name: "Alle Apps" })).toHaveAttribute(
      "href",
      "https://dev.milos-apps.de/apps",
    );
    await expect(page.getByRole("link", { name: "Impressum" })).toHaveAttribute(
      "href",
      "https://dev.milos-apps.de/impressum",
    );
    await expect(
      page.getByLabel("Rechtliches").getByRole("link", { name: "Datenschutz" }),
    ).toHaveAttribute("href", "https://dev.milos-apps.de/datenschutz");
    await expect(page.getByText("Tageslichtzeiten für deinen Ort – lokal berechnet, ohne Konto.")).toBeVisible();
  });

  test("schaltet die vollständige sichtbare UI auf EN und behält die Wahl nach Reload", async ({
    page,
  }) => {
    await mockGeocoder(page);
    await page.clock.install({ time: new Date("2026-05-01T12:00:00Z") });
    await page.goto("/");
    await page.getByRole("button", { name: "EN", exact: true }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("Still light? – MilosApps");
    await expect(
      page.getByRole("heading", { name: "Still light for a walk?" }),
    ).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Place or region" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Use my location" })).toBeVisible();
    await expect(page.getByRole("link", { name: "All apps" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Legal notice" })).toBeVisible();
    await expect(
      page.getByLabel("Legal").getByRole("link", { name: "Privacy" }),
    ).toBeVisible();

    await page.getByRole("combobox", { name: "Place or region" }).fill("Berlin");
    await page.getByRole("button", { name: "Search" }).click();
    await page
      .getByRole("option", { name: "Berlin Deutschland" })
      .click();

    await expect(page.getByText("Sunrise", { exact: true })).toBeVisible();
    await expect(page.getByText("Sunset", { exact: true })).toBeVisible();
    await expect(page.getByText("End of civil twilight", { exact: true })).toBeVisible();
    await expect(page.getByText("Tomorrow: sunrise", { exact: true })).toBeVisible();
    await expect(page.getByText("Local time", { exact: true }).first()).toBeVisible();
    await expect(page.locator("#answer-title")).toContainText(/daylight left|still light/i);
    await expect(page.getByText(/Until the end of civil twilight|above the horizon/)).toBeVisible();
    await expect(page.getByText("Private:", { exact: true })).toBeVisible();
    await expect(page.getByText("Manage local data", { exact: true })).toBeVisible();
    await expect(page.getByText("Place data ©", { exact: true })).toBeVisible();
    await expect(page.getByText(/NOAA\/Meeus approximation/)).toBeVisible();

    expect(
      await page.evaluate(() =>
        localStorage.getItem("milosapps.daylight.language"),
      ),
    ).toBe("en");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("link", { name: "All apps" })).toBeVisible();
    await expect(page.getByText("Sunrise", { exact: true })).toBeVisible();
  });

  test("übersetzt Such-, Standort- und Offlinefehler vollständig", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Fehlerzustände werden einmal in Chromium geprüft.");
    await mockGeocoder(page, []);
    await page.addInitScript(() => {
      const geolocation = {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) => {
          error({
            code: 1,
            message: "simulated",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError);
        },
      };
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: geolocation,
      });
    });
    await page.goto("/");
    await page.getByRole("button", { name: "EN", exact: true }).click();

    await page.getByRole("combobox", { name: "Place or region" }).fill("Unknownville");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.locator("[data-milos-place-status]")).toContainText(
      "No matching place found",
    );

    await page.getByRole("button", { name: "Use my location" }).click();
    await expect(page.getByRole("alert")).toContainText("Location was not allowed");
    await expect(page.getByRole("combobox", { name: "Place or region" })).toBeFocused();

    await page.unroute("https://nominatim.openstreetmap.org/search**");
    await page.route("https://nominatim.openstreetmap.org/search**", async (route) => {
      await route.abort("internetdisconnected");
    });
    await page.getByRole("combobox", { name: "Place or region" }).fill("Hamburg");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "A new place search needs an available network connection.",
    );

    await page.unroute("https://nominatim.openstreetmap.org/search**");
    await context.setOffline(true);
    await page.getByRole("combobox", { name: "Place or region" }).fill("Bremen");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "You are offline. A saved place will continue to work.",
    );
    await context.setOffline(false);
  });

  test("hat logische Tastaturreihenfolge, sichtbaren Fokus und 44-Pixel-Ziele", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Geometrie und Fokus werden im Desktop-Chromium geprüft.");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Zum Inhalt" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "MilosApps DEV", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "DE", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "EN", exact: true })).toBeFocused();
    const outline = await page
      .getByRole("button", { name: "EN", exact: true })
      .evaluate((target) => getComputedStyle(target).outlineStyle);
    expect(outline).not.toBe("none");

    const sizes = await page
      .locator(".brand, .control, .footer-nav a")
      .evaluateAll((targets) =>
        targets.map((target) => {
          const rect = target.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      );
    expect(sizes.every(({ width, height }) => width >= 44 && height >= 44)).toBe(true);
  });

  test("bleibt bei 1440 sowie 390 × 844 einschließlich Shell überlauffrei und ohne Footer-Leerraum", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Explizite Viewports werden einmal geprüft.");
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
      { width: 640, height: 720 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page.getByRole("link", { name: "Alle Apps" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Impressum" })).toBeVisible();
      const footerGap = await page.locator("milos-app-shell").evaluate((shell) => {
        const footer = shell.shadowRoot?.querySelector("footer");
        if (!(footer instanceof HTMLElement)) return Number.POSITIVE_INFINITY;
        return Math.abs(document.documentElement.scrollHeight - footer.getBoundingClientRect().bottom);
      });
      expect(footerGap).toBeLessThanOrEqual(1);
    }
  });

  test("fließt bei 360 × 800 und 200 Prozent Textzoom ohne Shell-Überlauf um", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Reflow-Geometrie wird einmal geprüft.");
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    const metrics = await page.evaluate(() => ({
      overflow:
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.viewport).toBe(360);
    await expect(page.getByRole("button", { name: "EN", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Alle Apps" })).toBeVisible();
  });

  test("respektiert reduzierte Bewegung auch in den Shell-Steuerelementen", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Reduced Motion wird einmal geprüft.");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page
      .getByRole("button", { name: "EN", exact: true })
      .evaluate((target) => getComputedStyle(target).transitionDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.00001);
  });

  test("bleibt unter der Portal-CSP style-src self vollständig gestaltet", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Die CSP-Integration wird einmal geprüft.");
    const cspErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /content security policy|style-src/i.test(message.text())) {
        cspErrors.push(message.text());
      }
    });
    await page.route("http://127.0.0.1:4319/", async (route) => {
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

    await page.goto("/");
    await page.evaluate(() => customElements.whenDefined("milos-app-shell"));
    await expect(page.getByRole("link", { name: "Alle Apps" })).toBeVisible();
    const shellMetrics = await page.locator("milos-app-shell").evaluate((shell) => {
      const root = shell.shadowRoot;
      const brand = root?.querySelector<HTMLElement>(".brand");
      const appIcon = root?.querySelector<HTMLElement>(".app-icon");
      const control = root?.querySelector<HTMLElement>(".control");
      const componentStyles = root?.querySelector<HTMLLinkElement>(
        'link[data-milos-app-shell-component]',
      );
      const themeStyles = document.querySelector<HTMLLinkElement>(
        'link[data-milos-app-shell-theme="daylight"]',
      );
      return {
        hostDisplay: getComputedStyle(shell).display,
        brandDisplay: brand ? getComputedStyle(brand).display : "missing",
        appIconColor: appIcon ? getComputedStyle(appIcon).color : "missing",
        controlHeight: control?.getBoundingClientRect().height ?? 0,
        stylesheetUrls: [componentStyles?.href ?? "missing", themeStyles?.href ?? "missing"],
      };
    });
    expect(shellMetrics).toMatchObject({
      hostDisplay: "grid",
      brandDisplay: "flex",
      appIconColor: "rgb(151, 54, 31)",
      controlHeight: 44,
    });
    expect(
      shellMetrics.stylesheetUrls.every((url) =>
        url.startsWith("http://127.0.0.1:4319/assets/"),
      ),
    ).toBe(true);
    const essentialsMetrics = await page.evaluate(() => {
      const placeInput = document.querySelector<HTMLElement>(
        "milos-place-search input",
      );
      const share = document.querySelector<HTMLElement>(
        "milos-share-button button",
      );
      return {
        stylesheets: [...document.querySelectorAll<HTMLLinkElement>(
          'link[href*="milosapps-essentials/v1"]',
        )].map((link) => link.href),
        inputHeight: placeInput?.getBoundingClientRect().height ?? 0,
        inputBackground: placeInput
          ? getComputedStyle(placeInput).backgroundColor
          : "missing",
        shareHeight: share?.getBoundingClientRect().height ?? 0,
      };
    });
    expect(essentialsMetrics.stylesheets).toEqual([
      "http://127.0.0.1:4319/vendor/milosapps-essentials/v1/milos-app-essentials.css",
      "http://127.0.0.1:4319/vendor/milosapps-essentials/v1/milos-app-essentials-theme.css",
    ]);
    expect(essentialsMetrics.inputHeight).toBeGreaterThanOrEqual(44);
    expect(essentialsMetrics.shareHeight).toBeGreaterThanOrEqual(44);
    expect(essentialsMetrics.inputBackground).toBe("rgb(255, 250, 241)");
    expect(cspErrors).toEqual([]);
  });

  test("hat auch in EN keine automatisiert erkennbaren WCAG-Verstöße", async ({
    page,
  }) => {
    await mockGeocoder(page);
    await page.goto("/");
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.getByRole("combobox", { name: "Place or region" }).fill("Berlin");
    await page.getByRole("button", { name: "Search" }).click();
    await page
      .getByRole("option", { name: "Berlin Deutschland" })
      .click();
    const results = await new AxeBuilder({ page })
      .exclude(".answer-sun")
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("astronomische Grenzfälle in der Oberfläche", () => {
  test("zeigt Polartag ohne erfundene Ereigniszeiten", async ({ page }) => {
    await openStoredLocationAt(
      page,
      {
        ...berlinLocation,
        id: "tromsoe",
        name: "Tromsø",
        context: "Troms, Norge",
        latitude: 69.6492,
        longitude: 18.9553,
        timeZone: "Europe/Oslo",
      },
      "2026-06-21T12:00:00Z",
    );
    await expect(page.getByRole("heading", { name: "Ja – durchgehend" })).toBeVisible();
    await expect(page.getByText("Polartag: Die Sonne bleibt über dem Horizont.")).toHaveCount(3);
    await expect(page.getByText("Endet nicht", { exact: true })).toBeVisible();
  });

  test("zeigt tiefe Polarnacht ohne bürgerliche Dämmerung ehrlich", async ({ page }) => {
    await openStoredLocationAt(
      page,
      {
        ...berlinLocation,
        id: "longyearbyen",
        name: "Longyearbyen",
        context: "Svalbard, Norge",
        latitude: 78.2232,
        longitude: 15.6469,
        timeZone: "Arctic/Longyearbyen",
      },
      "2026-12-21T12:00:00Z",
    );
    await expect(page.getByRole("heading", { name: "Nein – Polarnacht" })).toBeVisible();
    await expect(page.getByText("Keine Dämmerung", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Die Sonne erreicht die bürgerliche Dämmerungsgrenze nicht."),
    ).toBeVisible();
  });

  test("zeigt am Äquator die USNO-nahen Referenzzeiten", async ({ page }) => {
    await openStoredLocationAt(
      page,
      {
        ...berlinLocation,
        id: "equator",
        name: "Nullmeridian am Äquator",
        context: "Referenzpunkt",
        latitude: 0,
        longitude: 0,
        timeZone: "UTC",
      },
      "2026-05-01T12:00:00Z",
    );
    await expect(page.locator("#sunrise-time")).toHaveText("05:53");
    await expect(page.locator("#sunset-time")).toHaveText("18:00");
    await expect(page.locator("#civil-dusk-time")).toHaveText("18:21");
  });

  test("kennzeichnet beide Berliner Sommerzeittage mit 23 und 25 Stunden", async ({ page }) => {
    await openStoredLocationAt(page, berlinLocation, "2026-03-29T10:00:00Z");
    await expect(page.getByText(/Zeitumstellung \(23 Std\.\)/)).toBeVisible();

    await page.clock.setFixedTime(new Date("2026-10-25T10:00:00Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByText(/Zeitumstellung \(25 Std\.\)/)).toBeVisible();
  });

  test("verwendet am internationalen Datumssprung das Ortsdatum", async ({ page }) => {
    await openStoredLocationAt(
      page,
      {
        ...berlinLocation,
        id: "kiritimati",
        name: "Kiritimati",
        context: "Kiribati",
        latitude: 1.8721,
        longitude: -157.4278,
        timeZone: "Pacific/Kiritimati",
      },
      "2025-12-31T11:00:00Z",
    );
    await expect(page.getByText("Donnerstag, 01. Januar 2026")).toBeVisible();
  });
});

test.describe("Standortzustände und Datenschutz", () => {
  test("speichert einen erlaubten Gerätestandort nur gerundet", async ({ browser, browserName }) => {
    test.skip(browserName !== "chromium", "Berechtigungssteuerung wird einmal in Chromium geprüft.");
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:4319",
      geolocation: { latitude: 52.520008, longitude: 13.404954 },
      permissions: ["geolocation"],
    });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Meinen Ort verwenden" }).click();
    await expect(page.getByRole("heading", { name: "In deiner Nähe" })).toBeVisible();
    const storedDevice = await page.evaluate(() =>
      localStorage.getItem("milosapps.daylight.device-suggestion.v1"),
    );
    expect(storedDevice).toContain('"latitude":52.52');
    expect(storedDevice).toContain('"longitude":13.4');
    expect(storedDevice).not.toContain("52.520008");
    await page.getByRole("button", { name: "Ort ändern" }).click();
    await expect(
      page.locator("#local-suggestion-list").getByRole("button", {
        name: "In deiner Nähe Auf etwa 1 km gerundet",
      }),
    ).toBeVisible();
    await page.evaluate((manualLocation) => {
      localStorage.setItem(
        "milosapps.daylight.location.v1",
        JSON.stringify(manualLocation),
      );
    }, berlinLocation);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Berlin" })).toBeVisible();
    await page.getByRole("button", { name: "Ort ändern" }).click();
    await expect(
      page.locator("#local-suggestion-list").getByRole("button", {
        name: "In deiner Nähe Auf etwa 1 km gerundet",
      }),
    ).toBeVisible();
    expect(new URL(page.url()).search).toBe("");
    await context.close();
  });

  for (const state of [
    {
      title: "verweigert oder abgebrochen",
      code: 1,
      expected: "nicht freigegeben oder Abfrage abgebrochen",
    },
    {
      title: "technisch nicht verfügbar",
      code: 2,
      expected: "keinen Standort bestimmen",
    },
    {
      title: "Zeitüberschreitung",
      code: 3,
      expected: "zu lange gedauert",
    },
  ]) {
    test(`fängt Standort ${state.title} verständlich ab`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Simulierte Geolocation-Zustände werden einmal geprüft.");
      await page.addInitScript((code) => {
        const geolocation = {
          getCurrentPosition: (
            _success: PositionCallback,
            error: PositionErrorCallback,
          ) => {
            error({
              code,
              message: "simuliert",
              PERMISSION_DENIED: 1,
              POSITION_UNAVAILABLE: 2,
              TIMEOUT: 3,
            } as GeolocationPositionError);
          },
        };
        Object.defineProperty(navigator, "geolocation", {
          configurable: true,
          value: geolocation,
        });
      }, state.code);
      await page.goto("/");
      await page.getByRole("button", { name: "Meinen Ort verwenden" }).click();
      await expect(page.getByRole("alert")).toContainText(state.expected);
      await expect(page.getByRole("combobox", { name: "Ort oder Region" })).toBeFocused();
    });
  }

  test("löscht gespeicherten Ort und Suchcache vollständig", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Storage-Entfernung wird einmal browserseitig geprüft.");
    await mockGeocoder(page);
    await page.goto("/");
    await selectBerlin(page);
    await page.getByText("Lokale Daten verwalten", { exact: true }).click();
    await page.getByRole("button", { name: "Lokale Ortsdaten löschen" }).click();
    await expect(page.getByText("vollständig gelöscht")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Ort oder Region" })).toBeVisible();
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).not.toContain("daylight.location.v1");
    expect(keys).not.toContain("daylight.geocoding-cache.v1");
    expect(keys).not.toContain("milosapps.daylight.location.v1");
    expect(keys).not.toContain("milosapps.daylight.geocoding-cache.v1");
    expect(keys).not.toContain("milosapps.daylight.device-suggestion.v1");
  });

  test("bietet abgesendete Ergebnisse lokal erneut an und nutzt für die Auswahl kein Netz", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Request-Cache wird einmal browserseitig geprüft.");
    let requests = 0;
    await page.route("https://nominatim.openstreetmap.org/search**", async (route) => {
      requests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([berlinResult]),
      });
    });
    await page.goto("/");
    const searchbox = page.getByRole("combobox", { name: "Ort oder Region" });
    await searchbox.fill("Berlin");
    await page.getByRole("button", { name: "Suchen" }).click();
    await expect(page.getByRole("option", { name: "Berlin Deutschland" })).toBeVisible();
    await page.getByRole("option", { name: "Berlin Deutschland" }).click();
    await page.getByRole("button", { name: "Ort ändern" }).click();
    await expect(
      page.locator("#local-suggestion-list").getByRole("button", {
        name: "Berlin Deutschland",
      }),
    ).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Ort ändern" }).click();
    const localResult = page.locator("#local-suggestion-list").getByRole("button", {
      name: "Berlin Deutschland",
    });
    await expect(localResult).toBeVisible();
    await localResult.click();
    await expect(page.getByRole("heading", { name: "Berlin" })).toBeVisible();
    await page.getByRole("button", { name: "Ort ändern" }).click();
    await searchbox.fill("  Berlin  ");
    await page.getByRole("button", { name: "Suchen" }).click();
    await expect(page.getByRole("option", { name: "Berlin Deutschland" })).toBeVisible();
    expect(requests).toBe(1);
  });
});

test.describe("langsames Netz, Offline und App-Resume", () => {
  test("macht eine langsame Ortssuche sichtbar und abbrechbar", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Zeitsteuerung wird einmal in Chromium geprüft.");
    await mockGeocoder(page, [berlinResult], 2_500);
    await page.goto("/");
    await page.getByRole("combobox", { name: "Ort oder Region" }).fill("Berlin");
    await page.getByRole("button", { name: "Suchen" }).click();
    await expect(page.getByRole("button", { name: "Abbrechen" })).toBeVisible();
    await expect(page.locator("[data-milos-place-status]")).toContainText(
      "Orte werden gesucht",
    );
    await page.getByRole("button", { name: "Abbrechen" }).click();
    await expect(page.locator("[data-milos-place-status]")).toContainText("abgebrochen");
    await expect(page.getByRole("option")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Suchen" })).toBeEnabled();
  });

  test("öffnet den gespeicherten Ort nach der Erstladung offline wieder", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Service-Worker-Offlinetest wird einmal geprüft.");
    await mockGeocoder(page);
    await page.goto("/");
    await selectBerlin(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Berlin" })).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Berlin" })).toBeVisible();
    await expect(page.getByText("Sonnenaufgang", { exact: true })).toBeVisible();
    await context.setOffline(false);
  });

  test("aktualisiert beim Resume über Sonnenuntergang und Dämmerungsende", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Uhrsteuerung wird einmal in Chromium geprüft.");
    await page.addInitScript((location) => {
      localStorage.setItem("milosapps.daylight.location.v1", JSON.stringify(location));
    }, berlinLocation);
    await page.clock.install({ time: new Date("2026-05-01T18:00:00Z") });
    await page.goto("/");
    await expect(page.locator("#answer-card")).toHaveAttribute("data-phase", "daylight");
    await page.clock.setFixedTime(new Date("2026-05-01T18:45:00Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByRole("heading", { name: /Restlicht/ })).toBeVisible();
    await page.clock.setFixedTime(new Date("2026-05-01T20:00:00Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByRole("heading", { name: "Nein – es ist dunkel" })).toBeVisible();
  });

  test("aktualisiert beim Resume über lokale Mitternacht", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Uhrsteuerung wird einmal in Chromium geprüft.");
    await page.addInitScript((location) => {
      localStorage.setItem("milosapps.daylight.location.v1", JSON.stringify(location));
    }, berlinLocation);
    await page.clock.install({ time: new Date("2026-07-30T21:59:00Z") });
    await page.goto("/");
    await expect(page.getByText("Donnerstag, 30. Juli 2026")).toBeVisible();
    await page.clock.setFixedTime(new Date("2026-07-30T22:01:00Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByText("Freitag, 31. Juli 2026")).toBeVisible();
  });
});
