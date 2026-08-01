import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
  await page.getByRole("searchbox", { name: "Ort oder Region" }).fill("Berlin");
  await page.getByRole("button", { name: "Ort suchen" }).click();
  await page
    .getByRole("button", { name: "Berlin Deutschland Stadt" })
    .click();
}

async function openStoredLocationAt(
  page: Page,
  location: typeof berlinLocation,
  instant: string,
): Promise<void> {
  await page.addInitScript((storedLocation) => {
    localStorage.setItem("daylight.location.v1", JSON.stringify(storedLocation));
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
      version: "0.3.0",
      environment: "dev",
    });
  });

  test("bietet manuelle Suche und Geräteortung gleichwertig ohne Login an", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Passt der Spaziergang noch ins Helle?" })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Ort oder Region" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Standort verwenden" })).toBeVisible();
    await expect(page.getByText("Beide Wege liefern dieselbe vollständige Ansicht.")).toBeVisible();
    await expect(page.getByText(/Anmelden|Login|Konto erstellen/)).toHaveCount(0);
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
    await page.getByRole("searchbox", { name: "Ort oder Region" }).fill("Neustadt");
    await page.getByRole("button", { name: "Ort suchen" }).click();

    await expect(
      page.getByRole("button", { name: "Neustadt Rheinland-Pfalz, Deutschland Stadt" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Neustadt Hamburg, Deutschland Stadt" }),
    ).toBeVisible();
  });

  test("erklärt unbekannte Orte und erlaubt einen neuen Versuch", async ({ page }) => {
    await page.unroute("https://nominatim.openstreetmap.org/search**");
    await mockGeocoder(page, []);
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Ort oder Region" }).fill("Unbekanntshausen");
    await page.getByRole("button", { name: "Ort suchen" }).click();
    await expect(page.getByRole("alert")).toContainText("Kein Ort gefunden");
    await expect(page.getByText("Ergänze Land oder Region")).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Ort oder Region" })).toBeEnabled();
  });

  test("ist vollständig mit Tastatur bedienbar", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("searchbox", { name: "Ort oder Region" });
    await search.focus();
    await search.fill("Berlin");
    await search.press("Enter");
    const result = page.getByRole("button", { name: "Berlin Deutschland Stadt" });
    await result.focus();
    await result.press("Enter");
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
    await expect(page.getByRole("heading", { name: "Passt der Spaziergang noch ins Helle?" })).toBeVisible();

    await page.emulateMedia({ colorScheme: "dark" });
    const darkColor = await page.evaluate(() => getComputedStyle(document.body).color);
    expect(lightColor).not.toBe(darkColor);
    await expect(page.getByRole("button", { name: "Ort suchen" })).toBeVisible();
  });

  test("hält DOM und Startressourcen bewusst klein", async ({ page }) => {
    await page.goto("/");
    const metrics = await page.evaluate(() => ({
      domElements: document.querySelectorAll("*").length,
      transferredBytes: performance
        .getEntriesByType("resource")
        .reduce((sum, entry) => sum + (entry as PerformanceResourceTiming).transferSize, 0),
    }));
    expect(metrics.domElements).toBeLessThan(180);
    expect(metrics.transferredBytes).toBeLessThan(300_000);
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
    await expect(page.getByRole("link", { name: "Datenschutz" })).toHaveAttribute(
      "href",
      "https://dev.milos-apps.de/datenschutz",
    );
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
      page.getByRole("heading", { name: "Is there enough daylight left for a walk?" }),
    ).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Place or region" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Use location" })).toBeVisible();
    await expect(page.getByRole("link", { name: "All apps" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Legal notice" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();

    await page.getByRole("searchbox", { name: "Place or region" }).fill("Berlin");
    await page.getByRole("button", { name: "Search place" }).click();
    await page
      .getByRole("button", { name: "Berlin Deutschland city" })
      .click();

    await expect(page.getByText("Sunrise", { exact: true })).toBeVisible();
    await expect(page.getByText("Sunset", { exact: true })).toBeVisible();
    await expect(page.getByText("End of civil twilight", { exact: true })).toBeVisible();
    await expect(page.getByText("Tomorrow: sunrise", { exact: true })).toBeVisible();
    await expect(page.getByText("Local time", { exact: true }).first()).toBeVisible();
    await expect(page.locator("#answer-title")).toContainText(/daylight left|still light/i);
    await expect(page.getByText(/Until the end of civil twilight|above the horizon/)).toBeVisible();
    await expect(page.getByText("Private by design", { exact: true })).toBeVisible();
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

    await page.getByRole("searchbox", { name: "Place or region" }).fill("Unknownville");
    await page.getByRole("button", { name: "Search place" }).click();
    await expect(page.getByRole("alert")).toContainText("No place found");
    await expect(page.getByText(/Add a country or region/)).toBeVisible();

    await page.getByRole("button", { name: "Use location" }).click();
    await expect(page.getByRole("alert")).toContainText("Location was not allowed");
    await expect(page.getByRole("searchbox", { name: "Place or region" })).toBeFocused();

    await page.unroute("https://nominatim.openstreetmap.org/search**");
    await page.route("https://nominatim.openstreetmap.org/search**", async (route) => {
      await route.abort("internetdisconnected");
    });
    await page.getByRole("searchbox", { name: "Place or region" }).fill("Hamburg");
    await page.getByRole("button", { name: "Search place" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "A new place search needs an available network connection.",
    );

    await page.unroute("https://nominatim.openstreetmap.org/search**");
    await context.setOffline(true);
    await page.getByRole("searchbox", { name: "Place or region" }).fill("Bremen");
    await page.getByRole("button", { name: "Search place" }).click();
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

  test("hat auch in EN keine automatisiert erkennbaren WCAG-Verstöße", async ({
    page,
  }) => {
    await mockGeocoder(page);
    await page.goto("/");
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page.getByRole("searchbox", { name: "Place or region" }).fill("Berlin");
    await page.getByRole("button", { name: "Search place" }).click();
    await page
      .getByRole("button", { name: "Berlin Deutschland city" })
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
    await page.getByRole("button", { name: "Standort verwenden" }).click();
    await expect(page.getByRole("heading", { name: "In deiner Nähe" })).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem("daylight.location.v1"));
    expect(stored).toContain('"latitude":52.52');
    expect(stored).toContain('"longitude":13.4');
    expect(stored).not.toContain("52.520008");
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
      await page.getByRole("button", { name: "Standort verwenden" }).click();
      await expect(page.getByRole("alert")).toContainText(state.expected);
      await expect(page.getByRole("searchbox", { name: "Ort oder Region" })).toBeFocused();
    });
  }

  test("löscht gespeicherten Ort und Suchcache vollständig", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Storage-Entfernung wird einmal browserseitig geprüft.");
    await mockGeocoder(page);
    await page.goto("/");
    await selectBerlin(page);
    await page.getByRole("button", { name: "Lokale Ortsdaten löschen" }).click();
    await expect(page.getByText("vollständig gelöscht")).toBeVisible();
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys.filter((key) => key.startsWith("daylight."))).toEqual([]);
  });

  test("bedient dieselbe Ortssuche für wiederholte Eingaben aus dem lokalen Cache", async ({
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
    const searchbox = page.getByRole("searchbox", { name: "Ort oder Region" });
    await searchbox.fill("Berlin");
    await page.getByRole("button", { name: "Ort suchen" }).click();
    await expect(page.getByRole("button", { name: "Berlin Deutschland Stadt" })).toBeVisible();
    await searchbox.fill("  Berlin  ");
    await page.getByRole("button", { name: "Ort suchen" }).click();
    await expect(page.getByRole("button", { name: "Berlin Deutschland Stadt" })).toBeVisible();
    expect(requests).toBe(1);
  });
});

test.describe("langsames Netz, Offline und App-Resume", () => {
  test("macht eine langsame Ortssuche sichtbar und abbrechbar", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Zeitsteuerung wird einmal in Chromium geprüft.");
    await mockGeocoder(page, [berlinResult], 2_500);
    await page.goto("/");
    await page.getByRole("searchbox", { name: "Ort oder Region" }).fill("Berlin");
    await page.getByRole("button", { name: "Ort suchen" }).click();
    await expect(page.getByRole("button", { name: "Abbrechen" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Suche nach");
    await page.getByRole("button", { name: "Abbrechen" }).click();
    await expect(page.getByRole("status")).toContainText("abgebrochen");
    await expect(page.getByRole("button", { name: "Ort suchen" })).toBeEnabled();
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
      localStorage.setItem("daylight.location.v1", JSON.stringify(location));
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
      localStorage.setItem("daylight.location.v1", JSON.stringify(location));
    }, berlinLocation);
    await page.clock.install({ time: new Date("2026-07-30T21:59:00Z") });
    await page.goto("/");
    await expect(page.getByText("Donnerstag, 30. Juli 2026")).toBeVisible();
    await page.clock.setFixedTime(new Date("2026-07-30T22:01:00Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByText("Freitag, 31. Juli 2026")).toBeVisible();
  });
});
