import type { DaylightLocation } from "../types";
import {
  calculateSolarDay,
  firstCrossing,
  solarElevation,
  solarThresholds,
  type SolarDay,
} from "./astronomy";
import {
  addLocalDays,
  localDateAt,
  type LocalDate,
} from "./timezone";

export type LightPhase =
  | "daylight"
  | "morning-twilight"
  | "evening-twilight"
  | "night"
  | "polar-day"
  | "polar-night";

export interface LightSummary {
  phase: LightPhase;
  state:
    | "polar-day"
    | "polar-night-twilight"
    | "polar-night-dark"
    | "daylight-until-dusk"
    | "daylight-over-horizon"
    | "morning-twilight"
    | "evening-twilight"
    | "night";
  target: Date | null;
}

export interface DaylightSnapshot {
  generatedAt: Date;
  location: DaylightLocation;
  localDate: LocalDate;
  today: SolarDay;
  tomorrow: SolarDay;
  sunrise: Date | null;
  sunset: Date | null;
  civilDusk: Date | null;
  tomorrowSunrise: Date | null;
  summary: LightSummary;
}

function firstFuture(...instants: Array<Date | null>): Date | null {
  return instants.find((instant): instant is Date => instant !== null) ?? null;
}

export function summarizeLight(
  now: Date,
  location: DaylightLocation,
  today: SolarDay,
  tomorrow: SolarDay,
): LightSummary {
  const elevation = solarElevation(now, location.latitude, location.longitude);
  const sunrise = firstCrossing(today.horizon, "rising");
  const sunset = firstCrossing(today.horizon, "setting");
  const civilDawn = firstCrossing(today.civil, "rising");
  const civilDusk = firstCrossing(today.civil, "setting");
  const tomorrowSunrise = firstCrossing(tomorrow.horizon, "rising");

  if (today.horizon.condition === "always-above") {
    return {
      phase: "polar-day",
      state: "polar-day",
      target: null,
    };
  }

  if (today.horizon.condition === "always-below") {
    const nextLight = firstFuture(
      civilDawn && civilDawn > now ? civilDawn : null,
      tomorrowSunrise,
    );
    return {
      phase: "polar-night",
      state:
        elevation >= solarThresholds.civilTwilight
          ? "polar-night-twilight"
          : "polar-night-dark",
      target: nextLight,
    };
  }

  if (elevation >= solarThresholds.sunrise) {
    const target = civilDusk && civilDusk > now ? civilDusk : sunset;
    return {
      phase: "daylight",
      state:
        civilDusk && civilDusk > now
          ? "daylight-until-dusk"
          : "daylight-over-horizon",
      target,
    };
  }

  if (elevation >= solarThresholds.civilTwilight) {
    if (sunrise && sunrise > now) {
      return {
        phase: "morning-twilight",
        state: "morning-twilight",
        target: sunrise,
      };
    }
    if (civilDusk && civilDusk > now) {
      return {
        phase: "evening-twilight",
        state: "evening-twilight",
        target: civilDusk,
      };
    }
  }

  const nextSunrise = firstFuture(
    sunrise && sunrise > now ? sunrise : null,
    tomorrowSunrise,
  );
  return {
    phase: "night",
    state: "night",
    target: nextSunrise,
  };
}

export function createSnapshot(
  location: DaylightLocation,
  now = new Date(),
): DaylightSnapshot {
  const localDate = localDateAt(now, location.timeZone);
  const tomorrowDate = addLocalDays(localDate, 1);
  const today = calculateSolarDay(
    localDate,
    location.latitude,
    location.longitude,
    location.timeZone,
  );
  const tomorrow = calculateSolarDay(
    tomorrowDate,
    location.latitude,
    location.longitude,
    location.timeZone,
  );

  return {
    generatedAt: now,
    location,
    localDate,
    today,
    tomorrow,
    sunrise: firstCrossing(today.horizon, "rising"),
    sunset: firstCrossing(today.horizon, "setting"),
    civilDusk: firstCrossing(today.civil, "setting"),
    tomorrowSunrise: firstCrossing(tomorrow.horizon, "rising"),
    summary: summarizeLight(now, location, today, tomorrow),
  };
}
