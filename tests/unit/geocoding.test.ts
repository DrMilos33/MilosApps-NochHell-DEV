import { afterEach, describe, expect, it, vi } from "vitest";
import {
  searchPlaces,
  toStoredLocation,
} from "../../src/lib/geocoding";
import type { BrowserStorage } from "../../src/lib/storage";

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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalisierte Ortssuche", () => {
  it("liefert Name, Region, Land und Ländercode ohne Zusatzfelder zu speichern", async () => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            {
              osm_id: 1,
              osm_type: "relation",
              lat: "52.5173885",
              lon: "13.3951309",
              display_name: "Berlin, Deutschland",
              name: "Berlin",
              addresstype: "city",
              address: {
                city: "Berlin",
                state: "Berlin",
                country: "Deutschland",
                country_code: "de",
              },
            },
            {
              osm_id: 2,
              osm_type: "relation",
              lat: "47.9961",
              lon: "7.8494",
              display_name: "Freiburg im Breisgau, Baden-Württemberg, Deutschland",
              name: "Freiburg im Breisgau",
              addresstype: "city",
              address: {
                city: "Freiburg im Breisgau",
                state: "Baden-Württemberg",
                country: "Deutschland",
                country_code: "de",
              },
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    const results = await searchPlaces(
      "Berlin",
      new AbortController().signal,
      "de",
      new MemoryStorage(),
      Date.now(),
    );

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      name: "Berlin",
      region: "",
      country: "Deutschland",
      countryCode: "DE",
      type: "city",
    });
    expect(results[1]).toMatchObject({
      name: "Freiburg im Breisgau",
      region: "Baden-Württemberg",
      country: "Deutschland",
      type: "city",
    });
    expect(toStoredLocation(results[0]!)).toEqual({
      id: "relation-1",
      name: "Berlin",
      context: "Deutschland",
      latitude: 52.5173885,
      longitude: 13.3951309,
      timeZone: "Europe/Berlin",
      source: "manual",
    });
  });
});
