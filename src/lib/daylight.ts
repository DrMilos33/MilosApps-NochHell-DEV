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
  answer: string;
  detail: string;
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

export function formatRemaining(milliseconds: number): string {
  const totalMinutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} Min.`;
  }
  if (minutes === 0) {
    return `${hours} Std.`;
  }
  return `${hours} Std. ${minutes} Min.`;
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
      answer: "Ja – durchgehend",
      detail: "Die Sonne geht an diesem Ort heute nicht unter.",
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
      answer:
        elevation >= solarThresholds.civilTwilight
          ? "Dämmerlicht"
          : "Nein – Polarnacht",
      detail:
        nextLight && nextLight > now
          ? `Die Sonne bleibt heute unter dem Horizont. Nächstes Licht in ${formatRemaining(
              nextLight.getTime() - now.getTime(),
            )}`
          : "Die Sonne bleibt heute unter dem Horizont.",
      target: nextLight,
    };
  }

  if (elevation >= solarThresholds.sunrise) {
    const target = civilDusk && civilDusk > now ? civilDusk : sunset;
    return {
      phase: "daylight",
      answer:
        target && target > now
          ? `Noch ${formatRemaining(target.getTime() - now.getTime())} hell`
          : "Ja – noch hell",
      detail:
        civilDusk && civilDusk > now
          ? "Bis zum Ende der bürgerlichen Dämmerung."
          : "Die Sonne steht noch über dem Horizont.",
      target,
    };
  }

  if (elevation >= solarThresholds.civilTwilight) {
    if (sunrise && sunrise > now) {
      return {
        phase: "morning-twilight",
        answer: "Es wird hell",
        detail: `Sonnenaufgang in ${formatRemaining(sunrise.getTime() - now.getTime())}`,
        target: sunrise,
      };
    }
    if (civilDusk && civilDusk > now) {
      return {
        phase: "evening-twilight",
        answer: `Noch ${formatRemaining(civilDusk.getTime() - now.getTime())} Restlicht`,
        detail: "Bis zum Ende der bürgerlichen Dämmerung.",
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
    answer: "Nein – es ist dunkel",
    detail:
      nextSunrise && nextSunrise > now
        ? `Sonnenaufgang in ${formatRemaining(nextSunrise.getTime() - now.getTime())}`
        : "Heute und morgen gibt es keinen Sonnenaufgang.",
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
