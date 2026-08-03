import { describe, expect, it } from "vitest";
import type { DaylightLocation } from "../../src/types";
import {
  clearLocalData,
  coarsenDeviceCoordinate,
  legacyStorageKeys,
  loadDeviceSuggestion,
  loadLocation,
  saveDeviceSuggestion,
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

  it("migriert den bisherigen Orts-Key atomar in den gemeinsamen Namespace", () => {
    const storage = new MemoryStorage();
    storage.setItem(legacyStorageKeys.location, JSON.stringify(location));
    expect(loadLocation(storage)).toEqual(location);
    expect(storage.getItem(storageKeys.location)).toBe(JSON.stringify(location));
    expect(storage.getItem(legacyStorageKeys.location)).toBeNull();
  });

  it("löscht Ort und Geocoding-Cache vollständig", () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKeys.location, "{}");
    storage.setItem(storageKeys.geocodingCache, "{}");
    storage.setItem(storageKeys.deviceSuggestion, "{}");
    storage.setItem(legacyStorageKeys.location, "{}");
    storage.setItem(legacyStorageKeys.geocodingCache, "{}");
    expect(clearLocalData(storage)).toBe(true);
    expect(storage.values.size).toBe(0);
  });

  it("rundet Gerätekoordinaten vor dem Speichern auf zwei Dezimalstellen", () => {
    expect(coarsenDeviceCoordinate(52.520008)).toBe(52.52);
    expect(coarsenDeviceCoordinate(-13.405123)).toBe(-13.41);
  });

  it("bewahrt nur einen freiwillig gerundeten Gerätestandort als Vorschlag", () => {
    const storage = new MemoryStorage();
    const deviceLocation: DaylightLocation = {
      ...location,
      id: "device-52.52-13.40",
      name: "In deiner Nähe",
      context: "Auf etwa 1 km gerundet",
      latitude: 52.52,
      longitude: 13.4,
      source: "device",
    };
    expect(saveDeviceSuggestion(location, storage)).toBe(false);
    expect(saveDeviceSuggestion(deviceLocation, storage)).toBe(true);
    expect(loadDeviceSuggestion(storage)).toEqual(deviceLocation);
  });
});
