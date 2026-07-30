import { describe, expect, it } from "vitest";
import type { DaylightLocation } from "../../src/types";
import {
  clearLocalData,
  coarsenDeviceCoordinate,
  loadLocation,
  saveLocation,
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

const location: DaylightLocation = {
  id: "manual-1",
  name: "Freiburg im Breisgau",
  context: "Baden-Württemberg, Deutschland",
  latitude: 47.9961,
  longitude: 7.8494,
  timeZone: "Europe/Berlin",
  source: "manual",
};

describe("lokale Ortsdaten", () => {
  it("speichert und lädt nur ein valides Schema", () => {
    const storage = new MemoryStorage();
    expect(saveLocation(location, storage)).toBe(true);
    expect(loadLocation(storage)).toEqual(location);
  });

  it("verwirft beschädigte oder manipulierte Einträge", () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKeys.location, '{"name":"Ort","latitude":999}');
    expect(loadLocation(storage)).toBeNull();
    expect(storage.getItem(storageKeys.location)).toBeNull();
  });

  it("löscht Ort und Geocoding-Cache vollständig", () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKeys.location, "{}");
    storage.setItem(storageKeys.geocodingCache, "{}");
    expect(clearLocalData(storage)).toBe(true);
    expect(storage.values.size).toBe(0);
  });

  it("rundet Gerätekoordinaten vor dem Speichern auf zwei Dezimalstellen", () => {
    expect(coarsenDeviceCoordinate(52.520008)).toBe(52.52);
    expect(coarsenDeviceCoordinate(-13.405123)).toBe(-13.41);
  });
});
