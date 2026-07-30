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
    .getByRole("button", { name: "Berlin Deutschland city" })
    .click();
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
      page.getByRole("button", { name: "Neustadt Rheinland-Pfalz, Deutschland city" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Neustadt Hamburg, Deutschland city" }),
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
    const result = page.getByRole("button", { name: "Berlin Deutschland city" });
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

  test("aktualisiert beim Resume über das Dämmerungsende", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Uhrsteuerung wird einmal in Chromium geprüft.");
    await page.addInitScript((location) => {
      localStorage.setItem("daylight.location.v1", JSON.stringify(location));
    }, berlinLocation);
    await page.clock.install({ time: new Date("2026-05-01T18:45:00Z") });
    await page.goto("/");
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
