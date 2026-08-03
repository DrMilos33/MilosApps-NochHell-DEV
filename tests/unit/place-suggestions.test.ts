import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resetPlaceSuggestionCache,
  searchPlaceSuggestions,
} from "../../src/lib/place-suggestions";

afterEach(() => {
  resetPlaceSuggestionCache();
  vi.unstubAllGlobals();
});

describe("dynamische Ortsvorschläge", () => {
  it("normalisiert Open-Meteo-Orte mit Region, Land und IANA-Zeitzone", async () => {
    vi.stubGlobal("window", {
      __DAYLIGHT_CONFIG__: {
        suggestionsEndpoint:
          "https://geocoding-api.open-meteo.com/v1/search",
      },
    });
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      new Response(
        JSON.stringify({
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
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchPlaceSuggestions(
      "Freib",
      new AbortController().signal,
      "de",
    );

    expect(results).toEqual([
      expect.objectContaining({
        id: "open-meteo-2779766",
        name: "Freibach",
        region: "Politischer Bezirk Völkermarkt, Kärnten",
        country: "Österreich",
        countryCode: "AT",
        latitude: 46.53333,
        longitude: 14.46667,
        timeZone: "Europe/Vienna",
        type: "PPL",
      }),
    ]);
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("name")).toBe("Freib");
    expect(requestUrl.searchParams.get("count")).toBe("6");
    expect(requestUrl.searchParams.get("language")).toBe("de");
    expect(requestUrl.searchParams.get("format")).toBe("json");
  });

  it("fragt erst ab drei Zeichen an und verwendet den flüchtigen Sitzungscache", async () => {
    vi.stubGlobal("window", {
      __DAYLIGHT_CONFIG__: {
        suggestionsEndpoint:
          "https://geocoding-api.open-meteo.com/v1/search",
      },
    });
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;

    expect(await searchPlaceSuggestions("Fr", signal, "de")).toEqual([]);
    await searchPlaceSuggestions("  Frei  ", signal, "de");
    await searchPlaceSuggestions("frei", signal, "de");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("verwirft manipulierte oder unvollständige Providerergebnisse", async () => {
    vi.stubGlobal("window", {
      __DAYLIGHT_CONFIG__: {
        suggestionsEndpoint:
          "https://geocoding-api.open-meteo.com/v1/search",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            results: [
              { id: 1, name: "", latitude: 52, longitude: 13 },
              { id: 2, name: "Außerhalb", latitude: 999, longitude: 13 },
              { id: 3, name: "Ohne Zeitzone", latitude: 52, longitude: 13 },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    expect(
      await searchPlaceSuggestions(
        "Berlin",
        new AbortController().signal,
        "de",
      ),
    ).toEqual([]);
  });

  it("verwirft credential-behaftete oder unsichere Runtime-Endpunkte", async () => {
    vi.stubGlobal("window", {
      __DAYLIGHT_CONFIG__: {
        suggestionsEndpoint: "https://user:secret@example.invalid/search",
      },
    });
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await searchPlaceSuggestions(
      "Berlin",
      new AbortController().signal,
      "de",
    );

    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).origin).toBe(
      "https://geocoding-api.open-meteo.com",
    );
  });
});
