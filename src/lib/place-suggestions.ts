import type { Language } from "./i18n";
import { validatedHttpsEndpoint } from "./runtime-config";
import { isValidTimeZone } from "./timezone";
import type { PlaceSearchResult } from "../types";

const DEFAULT_ENDPOINT =
  "https://geocoding-api.open-meteo.com/v1/search";
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 20;

type SuggestionCacheEntry = {
  storedAt: number;
  results: PlaceSearchResult[];
};

type OpenMeteoPlace = {
  id?: unknown;
  name?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  feature_code?: unknown;
  country_code?: unknown;
  timezone?: unknown;
  country?: unknown;
  admin1?: unknown;
  admin2?: unknown;
};

const suggestionCache = new Map<string, SuggestionCacheEntry>();

function configuredEndpoint(): string {
  return validatedHttpsEndpoint(
    window.__DAYLIGHT_CONFIG__?.suggestionsEndpoint,
    DEFAULT_ENDPOINT,
  );
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePlace(value: OpenMeteoPlace): PlaceSearchResult | null {
  const id =
    typeof value.id === "number" || typeof value.id === "string"
      ? String(value.id)
      : "";
  const name = cleanText(value.name);
  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  const timeZone = cleanText(value.timezone);
  if (
    !id ||
    !name ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !isValidTimeZone(timeZone)
  ) {
    return null;
  }

  const seenRegions = new Set<string>();
  const region = [cleanText(value.admin2), cleanText(value.admin1)]
    .filter((part) => {
      const key = part.toLocaleLowerCase();
      if (!part || key === name.toLocaleLowerCase() || seenRegions.has(key)) {
        return false;
      }
      seenRegions.add(key);
      return true;
    })
    .join(", ");
  const country = cleanText(value.country);
  const type = cleanText(value.feature_code) || "place";

  return {
    id: `open-meteo-${id}`,
    name,
    context: [region, country].filter(Boolean).join(", "),
    region,
    country,
    countryCode: cleanText(value.country_code).toUpperCase(),
    latitude,
    longitude,
    timeZone,
    source: "manual",
    type,
    osmType: type,
  };
}

function remember(
  key: string,
  entry: SuggestionCacheEntry,
): void {
  suggestionCache.delete(key);
  suggestionCache.set(key, entry);
  while (suggestionCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = suggestionCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    suggestionCache.delete(oldestKey);
  }
}

export async function searchPlaceSuggestions(
  rawQuery: string,
  signal: AbortSignal,
  language: Language,
  now = Date.now(),
): Promise<PlaceSearchResult[]> {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  if (query.length < 3) return [];

  const endpoint = configuredEndpoint();
  const cacheKey = `${endpoint}|${language}|${query.toLocaleLowerCase(
    language === "en" ? "en-GB" : "de-DE",
  )}`;
  const cached = suggestionCache.get(cacheKey);
  if (
    cached &&
    cached.storedAt <= now &&
    now - cached.storedAt <= CACHE_MAX_AGE_MS
  ) {
    return cached.results;
  }

  const url = new URL(endpoint);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", language);
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Suggestion provider returned HTTP ${response.status}.`);
  }
  const body = (await response.json()) as { results?: unknown };
  const values = Array.isArray(body?.results) ? body.results : [];
  const results = values
    .map((value) => normalizePlace(value as OpenMeteoPlace))
    .filter((value): value is PlaceSearchResult => value !== null)
    .slice(0, 6);
  remember(cacheKey, { storedAt: now, results });
  return results;
}

export function resetPlaceSuggestionCache(): void {
  suggestionCache.clear();
}
