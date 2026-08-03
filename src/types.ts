export type LocationSource = "manual" | "device";

export interface DaylightLocation {
  id: string;
  name: string;
  context: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  source: LocationSource;
}

export interface PlaceSearchResult extends DaylightLocation {
  region: string;
  country: string;
  countryCode: string;
  type: string;
  osmType: string;
}

export interface NormalizedPlace {
  id: string;
  name: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  type: string;
  timeZone?: string;
}

export interface RuntimeConfig {
  geocodingEndpoint: string;
  suggestionsEndpoint: string;
  environment: "dev" | "production";
}

declare global {
  interface Window {
    __DAYLIGHT_CONFIG__?: Partial<RuntimeConfig>;
  }
}
