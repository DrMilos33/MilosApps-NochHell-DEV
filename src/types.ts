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
  osmType: string;
}

export interface RuntimeConfig {
  geocodingEndpoint: string;
  environment: "dev" | "production";
}

declare global {
  interface Window {
    __DAYLIGHT_CONFIG__?: Partial<RuntimeConfig>;
  }
}
