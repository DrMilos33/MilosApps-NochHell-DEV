import type { DaylightLocation } from "../types";
import { isValidTimeZone } from "./timezone";

export const storageKeys = {
  location: "daylight.location.v1",
  geocodingCache: "daylight.geocoding-cache.v1",
} as const;

export type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function browserStorage(): BrowserStorage | null {
  try {
    const storage = window.localStorage;
    const probe = "daylight.storage-probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function validCoordinate(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

export function isDaylightLocation(value: unknown): value is DaylightLocation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<DaylightLocation>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    candidate.name.length > 0 &&
    typeof candidate.context === "string" &&
    validCoordinate(candidate.latitude, -90, 90) &&
    validCoordinate(candidate.longitude, -180, 180) &&
    typeof candidate.timeZone === "string" &&
    isValidTimeZone(candidate.timeZone) &&
    (candidate.source === "manual" || candidate.source === "device")
  );
}

export function loadLocation(storage = browserStorage()): DaylightLocation | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(storageKeys.location);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isDaylightLocation(parsed)) {
      storage.removeItem(storageKeys.location);
      return null;
    }
    return parsed;
  } catch {
    try {
      storage.removeItem(storageKeys.location);
    } catch {
      // Storage is optional; a failed cleanup must not prevent app use.
    }
    return null;
  }
}

export function saveLocation(
  location: DaylightLocation,
  storage = browserStorage(),
): boolean {
  if (!storage || !isDaylightLocation(location)) {
    return false;
  }
  try {
    storage.setItem(storageKeys.location, JSON.stringify(location));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalData(storage = browserStorage()): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.removeItem(storageKeys.location);
    storage.removeItem(storageKeys.geocodingCache);
    return true;
  } catch {
    return false;
  }
}

export function coarsenDeviceCoordinate(value: number): number {
  return Number(value.toFixed(2));
}
