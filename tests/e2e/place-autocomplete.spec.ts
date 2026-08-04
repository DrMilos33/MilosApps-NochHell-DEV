import { expect, test } from "@playwright/test";

const freibachSuggestions = {
  results: [
    {
      id: 2779766,
      name: "Freibach",
      latitude: 46.53333,
      longitude: 14.46667,
      feature_code: "PPL",
      country_code: "AT",
      timezone: "Europe/Vienna",
      country: "Österreich",
      admin1: "Kärnten",
      admin2: "Politischer Bezirk Völkermarkt",
    },
    {
      id: 2779306,
      name: "Zell-Freibach",
      latitude: 46.46667,
      longitude: 14.43333,
      feature_code: "PPL",
      country_code: "AT",
      timezone: "Europe/Vienna",
      country: "Österreich",
      admin1: "Kärnten",
      admin2: "Politischer Bezirk Klagenfurt Land",
    },
  ],
};

async function openLocationPicker(page: import("@playwright/test").Page): Promise<void> {
  const locationCard = page.locator(".location-card");
  if (!(await locationCard.isVisible())) {
    await page.getByRole("button", { name: "Ort ändern", exact: true }).click();
  }
  await expect(locationCard).toBeVisible();
}

test.describe("dynamische Orts-Combobox", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(
      "https://geocoding-api.open-meteo.com/v1/search**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(freibachSuggestions),
        });
      },
    );
  });

  test("lädt ab drei Zeichen ohne Enter in genau eine app-gestaltete Liste", async ({
    page,
  }) => {
    let suggestionRequests = 0;
    let explicitRequests = 0;
    page.on("request", (request) => {
      if (request.url().startsWith("https://geocoding-api.open-meteo.com/")) {
        const count = new URL(request.url()).searchParams.get("count");
        if (count === "6") suggestionRequests += 1;
        if (count === "7") explicitRequests += 1;
      }
    });
    await page.goto("/");
    await openLocationPicker(page);
    const input = page.getByRole("combobox", { name: "Ort oder Region" });
    await input.fill("Fr");
    await page.waitForTimeout(550);
    expect(suggestionRequests).toBe(0);
    await input.fill("Freib");

    const option = page.getByRole("option", {
      name: /Freibach.*Politischer Bezirk Völkermarkt, Kärnten.*Österreich/,
    });
    await expect(option).toBeVisible();
    expect(suggestionRequests).toBe(1);
    expect(explicitRequests).toBe(0);
    await expect(page.locator("[role=listbox]:visible")).toHaveCount(1);
    await expect(page.locator("#local-suggestions")).toHaveCount(0);
    await expect(input).toHaveAttribute("aria-expanded", "true");

    const colors = await page.locator("[data-milos-place-results]").evaluate((node) => {
      const probe = document.createElement("span");
      probe.style.background = "var(--paper-solid)";
      document.body.append(probe);
      const appSurface = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        background: getComputedStyle(node).backgroundColor,
        appSurface,
        position: getComputedStyle(node).position,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    expect(colors.background).toBe(colors.appSurface);
    expect(colors.position).toBe("static");
    expect(colors.scrollWidth).toBe(colors.clientWidth);

    await option.click();
    await expect(page.getByRole("heading", { name: "Freibach" })).toBeVisible();
    await expect(page.locator(".location-card")).toBeHidden();
    await expect(page.locator("[role=listbox]:visible")).toHaveCount(0);
  });

  test("schließt die offene Liste bei Außenklick, Escape und Auswahl", async ({
    page,
  }) => {
    await page.goto("/");
    await openLocationPicker(page);
    const input = page.getByRole("combobox", { name: "Ort oder Region" });
    const option = page.getByRole("option", {
      name: /Freibach.*Politischer Bezirk Völkermarkt, Kärnten.*Österreich/,
    });
    await input.fill("Freib");
    await expect(option).toBeVisible();
    await page.getByRole("heading", { name: "Ort wählen" }).click();
    await expect(option).toBeHidden();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await expect(input).toHaveValue("Freib");

    await input.fill("");
    await input.fill("Freib");
    await expect(option).toBeVisible();
    await input.press("Escape");
    await expect(option).toBeHidden();
    await expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("führt bekannte und neue Orte in derselben Liste zusammen", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "milosapps.daylight.geocoding-cache.v1",
        JSON.stringify({
          "de:freiburg": {
            storedAt: Date.now(),
            results: [
              {
                id: "relation-62768",
                name: "Freiburg im Breisgau",
                context: "Baden-Württemberg, Deutschland",
                region: "Baden-Württemberg",
                country: "Deutschland",
                countryCode: "DE",
                latitude: 47.9961,
                longitude: 7.8494,
                timeZone: "Europe/Berlin",
                source: "manual",
                type: "city",
                osmType: "relation",
              },
            ],
          },
        }),
      );
    });
    await page.goto("/");
    await openLocationPicker(page);
    await page.getByRole("combobox", { name: "Ort oder Region" }).fill("Freib");

    const options = page.getByRole("option");
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toContainText("Freiburg im Breisgau");
    await expect(options.nth(1)).toContainText("Freibach");
    await expect(page.locator("[role=listbox]:visible")).toHaveCount(1);
  });

  test("verwirft eine verspätete alte Antwort nach neuer Eingabe", async ({ page }) => {
    await page.unroute("https://geocoding-api.open-meteo.com/v1/search**");
    await page.route(
      "https://geocoding-api.open-meteo.com/v1/search**",
      async (route) => {
        const query = new URL(route.request().url()).searchParams.get("name");
        if (query === "Frei") {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            query === "Frei" ? freibachSuggestions : { results: [] },
          ),
        });
      },
    );
    await page.goto("/");
    await openLocationPicker(page);
    const input = page.getByRole("combobox", { name: "Ort oder Region" });
    await input.fill("Frei");
    await page.waitForTimeout(500);
    await input.fill("Hamb");
    await page.waitForTimeout(900);

    await expect(page.getByRole("option", { name: /Freibach/ })).toHaveCount(0);
    await expect(input).toHaveValue("Hamb");
  });

  test("meldet einen nicht erreichbaren Vorschlagsprovider ehrlich", async ({ page }) => {
    await page.unroute("https://geocoding-api.open-meteo.com/v1/search**");
    await page.route(
      "https://geocoding-api.open-meteo.com/v1/search**",
      async (route) => route.fulfill({ status: 503, body: "unavailable" }),
    );
    await page.goto("/");
    await openLocationPicker(page);
    await page.getByRole("combobox", { name: "Ort oder Region" }).fill("Freib");

    await expect(page.getByText("Die Ortssuche ist gerade nicht erreichbar.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Suchen" })).toBeEnabled();
  });
});
