import type { RuntimeConfig } from "../types";

const defaults: RuntimeConfig = {
  geocodingEndpoint: "https://nominatim.openstreetmap.org/search",
};

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch("./runtime-config.json", { cache: "no-cache" });
    if (!response.ok) {
      return defaults;
    }
    const value = (await response.json()) as Partial<RuntimeConfig>;
    const config = {
      geocodingEndpoint:
        typeof value.geocodingEndpoint === "string" && value.geocodingEndpoint.startsWith("https://")
          ? value.geocodingEndpoint
          : defaults.geocodingEndpoint,
    };
    window.__DAYLIGHT_CONFIG__ = config;
    return config;
  } catch {
    window.__DAYLIGHT_CONFIG__ = defaults;
    return defaults;
  }
}
