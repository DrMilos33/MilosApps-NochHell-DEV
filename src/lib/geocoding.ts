import type { DaylightLocation, PlaceSearchResult, RuntimeConfig } from "../types";
import type { Language } from "./i18n";
import { resolveTimeZone } from "./timezone";
import {
  browserStorage,
  storageKeys,
  type BrowserStorage,
} from "./storage";

const MINIMUM_REQUEST_INTERVAL_MS = 1_100;
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 20;
let lastRequestStartedAt = 0;

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimResult {
  osm_id: number;
  osm_type: string;
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  addresstype?: string;
  name?: string;
  address?: NominatimAddress;
}

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

function runtimeConfig(): RuntimeConfig {
  return {
    geocodingEndpoint:
      window.__DAYLIGHT_CONFIG__?.geocodingEndpoint ??
      "https://nominatim.openstreetmap.org/search",
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
    const parsed: unknown = JSON.parse(storage.getItem(storageKeys.geocodingCache) ?? "{}");
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as GeocodingCache;
  } catch {
    return {};
  }
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

function abortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function placeName(result: NominatimResult, language: Language): string {
  const address = result.address ?? {};
  return (
    result.name ??
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.hamlet ??
    result.display_name.split(",")[0]?.trim() ??
    (language === "en" ? "Unnamed place" : "Unbenannter Ort")
  );
}

function placeContext(result: NominatimResult, name: string): string {
  const address = result.address ?? {};
  const values = [address.county, address.state, address.country]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, all) => value !== name && all.indexOf(value) === index);
  return values.join(", ") || result.display_name;
}

function toPlace(result: NominatimResult, language: Language): PlaceSearchResult | null {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  try {
    const name = placeName(result, language);
    return {
      id: `${result.osm_type}-${result.osm_id}`,
      name,
      context: placeContext(result, name),
      latitude,
      longitude,
      timeZone: resolveTimeZone(latitude, longitude),
      source: "manual",
      osmType: result.addresstype ?? result.type ?? "Ort",
    };
  } catch {
    return null;
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

  const delay = Math.max(0, MINIMUM_REQUEST_INTERVAL_MS - (now - lastRequestStartedAt));
  if (delay > 0) {
    await abortableDelay(delay, signal);
  }
  lastRequestStartedAt = Date.now();

  const endpoint = new URL(runtimeConfig().geocodingEndpoint);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("addressdetails", "1");
  endpoint.searchParams.set("limit", "7");
  endpoint.searchParams.set("accept-language", language);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": language,
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
  if (!Array.isArray(body)) {
    throw new GeocodingError("invalid-response");
  }
  const results = body
    .map((entry) => toPlace(entry as NominatimResult, language))
    .filter((entry): entry is PlaceSearchResult => entry !== null);
  cache[cacheKey] = { storedAt: Date.now(), results };
  writeCache(cache, storage);
  return results;
}

export function toStoredLocation(result: PlaceSearchResult): DaylightLocation {
  const { osmType: _osmType, ...location } = result;
  return location;
}
