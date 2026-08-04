import type { DaylightLocation, PlaceSearchResult, RuntimeConfig } from "../types";
import type { Language } from "./i18n";
import {
  normalizeOpenMeteoPlace,
  type OpenMeteoPlace,
} from "./place-suggestions";
import { isValidTimeZone } from "./timezone";
import {
  browserStorage,
  legacyStorageKeys,
  readMigratedStorageValue,
  storageKeys,
  type BrowserStorage,
} from "./storage";

const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 20;

interface CacheEntry {
  storedAt: number;
  results: PlaceSearchResult[];
}

export type GeocodingErrorCode =
  | "invalid-query"
  | "network"
  | "http"
  | "invalid-response";

export class GeocodingError extends Error {
  constructor(
    readonly code: GeocodingErrorCode,
    readonly status?: number,
  ) {
    super(code);
    this.name = "GeocodingError";
  }
}

type GeocodingCache = Record<string, CacheEntry>;

function runtimeConfig(): Pick<
  RuntimeConfig,
  "geocodingEndpoint" | "environment"
> {
  return {
    geocodingEndpoint:
      window.__DAYLIGHT_CONFIG__?.geocodingEndpoint ??
      "https://geocoding-api.open-meteo.com/v1/search",
    environment:
      window.__DAYLIGHT_CONFIG__?.environment === "production"
        ? "production"
        : "dev",
  };
}

function readCache(storage: BrowserStorage | null): GeocodingCache {
  if (!storage) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(
      readMigratedStorageValue(
        storageKeys.geocodingCache,
        legacyStorageKeys.geocodingCache,
        storage,
      ) ?? "{}",
    );
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as GeocodingCache;
  } catch {
    return {};
  }
}

function isCachedPlace(value: unknown): value is PlaceSearchResult {
  if (!value || typeof value !== "object") return false;
  const place = value as Partial<PlaceSearchResult>;
  return (
    typeof place.id === "string" &&
    typeof place.name === "string" &&
    place.name.length > 0 &&
    typeof place.region === "string" &&
    typeof place.country === "string" &&
    typeof place.countryCode === "string" &&
    typeof place.latitude === "number" &&
    Number.isFinite(place.latitude) &&
    place.latitude >= -90 &&
    place.latitude <= 90 &&
    typeof place.longitude === "number" &&
    Number.isFinite(place.longitude) &&
    place.longitude >= -180 &&
    place.longitude <= 180 &&
    typeof place.timeZone === "string" &&
    isValidTimeZone(place.timeZone) &&
    typeof place.type === "string" &&
    typeof place.osmType === "string" &&
    place.source === "manual"
  );
}

export function loadCachedPlaces(
  language: Language,
  storage = browserStorage(),
  now = Date.now(),
): PlaceSearchResult[] {
  const prefix = `${language}:`;
  const seen = new Set<string>();
  return Object.entries(readCache(storage))
    .filter(([key, entry]) =>
      key.startsWith(prefix) &&
      typeof entry?.storedAt === "number" &&
      entry.storedAt <= now &&
      now - entry.storedAt <= CACHE_MAX_AGE_MS &&
      Array.isArray(entry.results),
    )
    .sort(([, left], [, right]) => right.storedAt - left.storedAt)
    .flatMap(([, entry]) => entry.results)
    .filter(isCachedPlace)
    .filter((place) => {
      const key = `${place.id}|${place.latitude}|${place.longitude}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

function writeCache(cache: GeocodingCache, storage: BrowserStorage | null): void {
  if (!storage) {
    return;
  }
  try {
    const trimmed = Object.fromEntries(
      Object.entries(cache)
        .sort(([, left], [, right]) => right.storedAt - left.storedAt)
        .slice(0, CACHE_MAX_ENTRIES),
    );
    storage.setItem(storageKeys.geocodingCache, JSON.stringify(trimmed));
  } catch {
    // Search still works when storage is full or unavailable.
  }
}

export async function searchPlaces(
  rawQuery: string,
  signal: AbortSignal,
  language: Language = "de",
  storage = browserStorage(),
  now = Date.now(),
): Promise<PlaceSearchResult[]> {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  if (query.length < 2) {
    throw new GeocodingError("invalid-query");
  }

  const cacheKey = `${language}:${query.toLocaleLowerCase(
    language === "en" ? "en-GB" : "de-DE",
  )}`;
  const cache = readCache(storage);
  const cached = cache[cacheKey];
  if (cached && now - cached.storedAt <= CACHE_MAX_AGE_MS) {
    return cached.results;
  }

  const endpoint = new URL(runtimeConfig().geocodingEndpoint);
  endpoint.searchParams.set("name", query);
  endpoint.searchParams.set("count", "7");
  endpoint.searchParams.set("language", language);
  endpoint.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal,
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new GeocodingError("network");
  }
  if (!response.ok) {
    throw new GeocodingError("http", response.status);
  }

  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !Array.isArray((body as { results?: unknown }).results)) {
    throw new GeocodingError("invalid-response");
  }
  const results = (body as { results: unknown[] }).results
    .map((entry) => normalizeOpenMeteoPlace(entry as OpenMeteoPlace))
    .filter((entry): entry is PlaceSearchResult => entry !== null);
  cache[cacheKey] = { storedAt: Date.now(), results };
  writeCache(cache, storage);
  return results;
}

export function toStoredLocation(result: PlaceSearchResult): DaylightLocation {
  return {
    id: result.id,
    name: result.name,
    context: result.context,
    latitude: result.latitude,
    longitude: result.longitude,
    timeZone: result.timeZone,
    source: result.source,
  };
}
