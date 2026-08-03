import type { RuntimeConfig } from "../types";

const defaults: RuntimeConfig = {
  geocodingEndpoint: "https://nominatim.openstreetmap.org/search",
  suggestionsEndpoint: "https://geocoding-api.open-meteo.com/v1/search",
  environment: "dev",
};

export function validatedHttpsEndpoint(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hash
      ? url.href
      : fallback;
  } catch {
    return fallback;
  }
}

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch("./runtime-config.json", { cache: "no-cache" });
    if (!response.ok) {
      return defaults;
    }
    const value = (await response.json()) as Partial<RuntimeConfig>;
    const config: RuntimeConfig = {
      geocodingEndpoint:
        validatedHttpsEndpoint(value.geocodingEndpoint, defaults.geocodingEndpoint),
      suggestionsEndpoint:
        validatedHttpsEndpoint(value.suggestionsEndpoint, defaults.suggestionsEndpoint),
      environment: value.environment === "production" ? "production" : "dev",
    };
    window.__DAYLIGHT_CONFIG__ = config;
    return config;
  } catch {
    window.__DAYLIGHT_CONFIG__ = defaults;
    return defaults;
  }
}
