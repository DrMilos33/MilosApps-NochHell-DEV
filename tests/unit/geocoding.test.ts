import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GeocodingError,
  loadCachedPlaces,
  searchPlaces,
  toStoredLocation,
} from "../../src/lib/geocoding";
import {
  legacyStorageKeys,
  storageKeys,
  type BrowserStorage,
} from "../../src/lib/storage";

class MemoryStorage implements BrowserStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const berlin = {
  id: 2950159,
  name: "Berlin",
  latitude: 52.5173885,
  longitude: 13.3951309,
  feature_code: "PPLC",
  country_code: "DE",
  timezone: "Europe/Berlin",
  country: "Deutschland",
  admin1: "Berlin",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalisierte Ortssuche", () => {
  it("normalisiert abgesendete Open-Meteo-Ergebnisse und minimiert gespeicherte Daten", async () => {
    vi.stubGlobal("window", globalThis);
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      new Response(
        JSON.stringify({
          results: [
            berlin,
            {
              id: 2925177,
              name: "Freiburg im Breisgau",
              latitude: 47.9961,
              longitude: 7.8494,
              feature_code: "PPLA3",
              country_code: "DE",
              timezone: "Europe/Berlin",
              country: "Deutschland",
              admin1: "Baden-Württemberg",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchPlaces(
      "Berlin",
      new AbortController().signal,
      "de",
      new MemoryStorage(),
      Date.now(),
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: "open-meteo-2950159",
      name: "Berlin",
      region: "",
      country: "Deutschland",
      countryCode: "DE",
      type: "PPLC",
    });
    expect(results[1]).toMatchObject({
      name: "Freiburg im Breisgau",
      region: "Baden-Württemberg",
      country: "Deutschland",
      type: "PPLA3",
    });
    expect(toStoredLocation(results[0]!)).toEqual({
      id: "open-meteo-2950159",
      name: "Berlin",
      context: "Deutschland",
      latitude: 52.5173885,
      longitude: 13.3951309,
      timeZone: "Europe/Berlin",
      source: "manual",
    });
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.origin).toBe("https://geocoding-api.open-meteo.com");
    expect(requestUrl.searchParams.get("name")).toBe("Berlin");
    expect(requestUrl.searchParams.get("count")).toBe("7");
    expect(requestUrl.searchParams.get("language")).toBe("de");
    expect(requestUrl.searchParams.get("format")).toBe("json");
    expect(requestUrl.searchParams.has("q")).toBe(false);
  });

  it("verwendet den persistenten Suchcache ohne zweiten Provideraufruf", async () => {
    vi.stubGlobal("window", globalThis);
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ results: [berlin] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const storage = new MemoryStorage();
    const now = Date.UTC(2026, 7, 4);

    const first = await searchPlaces(
      "Berlin",
      new AbortController().signal,
      "de",
      storage,
      now,
    );
    const second = await searchPlaces(
      "  berlin  ",
      new AbortController().signal,
      "de",
      storage,
      now + 1_000,
    );

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("unterscheidet Netzwerk-, HTTP- und ungültige Antwortfehler", async () => {
    vi.stubGlobal("window", globalThis);
    const signal = new AbortController().signal;
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("offline"))));
    await expect(searchPlaces("Berlin", signal, "de", new MemoryStorage())).rejects.toMatchObject({
      code: "network",
    } satisfies Partial<GeocodingError>);

    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    await expect(searchPlaces("Berlin", signal, "de", new MemoryStorage())).rejects.toMatchObject({
      code: "http",
      status: 503,
    } satisfies Partial<GeocodingError>);

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
    await expect(searchPlaces("Berlin", signal, "de", new MemoryStorage())).rejects.toMatchObject({
      code: "invalid-response",
    } satisfies Partial<GeocodingError>);
  });

  it("liefert nur frische lokale Ergebnisse der gewählten Sprache und migriert den alten Cache-Key", () => {
    const storage = new MemoryStorage();
    const now = Date.UTC(2026, 7, 3);
    const cachedBerlin = {
      id: "open-meteo-2950159",
      name: "Berlin",
      context: "Berlin, Deutschland",
      region: "Berlin",
      country: "Deutschland",
      countryCode: "DE",
      latitude: 52.52,
      longitude: 13.4,
      timeZone: "Europe/Berlin",
      source: "manual" as const,
      type: "PPLC",
      osmType: "PPLC",
    };
    storage.setItem(
      legacyStorageKeys.geocodingCache,
      JSON.stringify({
        "de:berlin": { storedAt: now - 1_000, results: [cachedBerlin] },
        "en:berlin": { storedAt: now, results: [{ ...cachedBerlin, country: "Germany" }] },
        "de:alt": { storedAt: now - 31 * 24 * 60 * 60 * 1000, results: [cachedBerlin] },
        "de:zukunft": { storedAt: now + 1_000, results: [cachedBerlin] },
        "de:manipuliert": {
          storedAt: now - 500,
          results: [{ ...cachedBerlin, id: "bad", latitude: 999 }],
        },
      }),
    );

    expect(loadCachedPlaces("de", storage, now)).toEqual([cachedBerlin]);
    expect(storage.getItem(storageKeys.geocodingCache)).not.toBeNull();
    expect(storage.getItem(legacyStorageKeys.geocodingCache)).toBeNull();
  });
});
