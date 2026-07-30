import {
  type LocalDate,
  localDayBounds,
} from "./timezone";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const SUNRISE_ALTITUDE = -0.833;
const CIVIL_TWILIGHT_ALTITUDE = -6;
const SAMPLE_INTERVAL_MS = 2 * 60 * 1000;

export interface SolarCrossing {
  instant: Date;
  direction: "rising" | "setting";
}

export interface SolarThresholdEvents {
  crossings: SolarCrossing[];
  condition: "always-above" | "always-below" | "crosses";
  minimumElevation: number;
  maximumElevation: number;
}

export interface SolarDay {
  date: LocalDate;
  bounds: {
    start: Date;
    end: Date;
    durationHours: number;
  };
  horizon: SolarThresholdEvents;
  civil: SolarThresholdEvents;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function julianDay(instant: Date): number {
  return instant.getTime() / 86_400_000 + 2_440_587.5;
}

function solarTerms(instant: Date): {
  equationOfTimeMinutes: number;
  declinationDegrees: number;
} {
  const century = (julianDay(instant) - 2_451_545) / 36_525;
  const meanLongitude = normalizeDegrees(
    280.46646 + century * (36_000.76983 + century * 0.0003032),
  );
  const meanAnomaly =
    357.52911 + century * (35_999.05029 - 0.0001537 * century);
  const eccentricity =
    0.016708634 - century * (0.000042037 + 0.0000001267 * century);
  const meanObliquity =
    23 +
    (26 +
      (21.448 -
        century * (46.815 + century * (0.00059 - century * 0.001813))) /
        60) /
      60;
  const omega = 125.04 - 1934.136 * century;
  const correctedObliquity =
    meanObliquity + 0.00256 * Math.cos(omega * DEG_TO_RAD);
  const anomalyRad = meanAnomaly * DEG_TO_RAD;
  const equationOfCenter =
    Math.sin(anomalyRad) *
      (1.914602 - century * (0.004817 + 0.000014 * century)) +
    Math.sin(2 * anomalyRad) * (0.019993 - 0.000101 * century) +
    Math.sin(3 * anomalyRad) * 0.000289;
  const apparentLongitude =
    meanLongitude + equationOfCenter - 0.00569 - 0.00478 * Math.sin(omega * DEG_TO_RAD);
  const declination = Math.asin(
    Math.sin(correctedObliquity * DEG_TO_RAD) *
      Math.sin(apparentLongitude * DEG_TO_RAD),
  );
  const y = Math.tan((correctedObliquity * DEG_TO_RAD) / 2) ** 2;
  const longitudeRad = meanLongitude * DEG_TO_RAD;
  const equationOfTime =
    4 *
    RAD_TO_DEG *
    (y * Math.sin(2 * longitudeRad) -
      2 * eccentricity * Math.sin(anomalyRad) +
      4 * eccentricity * y * Math.sin(anomalyRad) * Math.cos(2 * longitudeRad) -
      0.5 * y * y * Math.sin(4 * longitudeRad) -
      1.25 * eccentricity * eccentricity * Math.sin(2 * anomalyRad));

  return {
    equationOfTimeMinutes: equationOfTime,
    declinationDegrees: declination * RAD_TO_DEG,
  };
}

export function solarElevation(
  instant: Date,
  latitude: number,
  longitude: number,
): number {
  const { equationOfTimeMinutes, declinationDegrees } = solarTerms(instant);
  const utcMinutes =
    instant.getUTCHours() * 60 +
    instant.getUTCMinutes() +
    instant.getUTCSeconds() / 60 +
    instant.getUTCMilliseconds() / 60_000;
  const trueSolarTime = ((utcMinutes + equationOfTimeMinutes + 4 * longitude) % 1440 + 1440) % 1440;
  const hourAngle = (trueSolarTime / 4 < 0 ? trueSolarTime / 4 + 180 : trueSolarTime / 4 - 180) * DEG_TO_RAD;
  const latitudeRad = latitude * DEG_TO_RAD;
  const declinationRad = declinationDegrees * DEG_TO_RAD;
  const cosineZenith = Math.min(
    1,
    Math.max(
      -1,
      Math.sin(latitudeRad) * Math.sin(declinationRad) +
        Math.cos(latitudeRad) * Math.cos(declinationRad) * Math.cos(hourAngle),
    ),
  );
  return 90 - Math.acos(cosineZenith) * RAD_TO_DEG;
}

function crossingInstant(
  leftTime: number,
  rightTime: number,
  threshold: number,
  latitude: number,
  longitude: number,
): Date {
  let left = leftTime;
  let right = rightTime;
  let leftValue = solarElevation(new Date(left), latitude, longitude) - threshold;

  while (right - left > 250) {
    const middle = Math.floor((left + right) / 2);
    const middleValue = solarElevation(new Date(middle), latitude, longitude) - threshold;
    if ((leftValue <= 0 && middleValue >= 0) || (leftValue >= 0 && middleValue <= 0)) {
      right = middle;
    } else {
      left = middle;
      leftValue = middleValue;
    }
  }
  return new Date(Math.round((left + right) / 2));
}

export function thresholdEvents(
  start: Date,
  end: Date,
  latitude: number,
  longitude: number,
  threshold: number,
): SolarThresholdEvents {
  const crossings: SolarCrossing[] = [];
  let previousTime = start.getTime();
  let previousValue = solarElevation(start, latitude, longitude) - threshold;
  let minimumElevation = previousValue + threshold;
  let maximumElevation = minimumElevation;

  for (
    let candidate = previousTime + SAMPLE_INTERVAL_MS;
    candidate <= end.getTime();
    candidate += SAMPLE_INTERVAL_MS
  ) {
    const currentTime = Math.min(candidate, end.getTime() - 1);
    const elevation = solarElevation(new Date(currentTime), latitude, longitude);
    const currentValue = elevation - threshold;
    minimumElevation = Math.min(minimumElevation, elevation);
    maximumElevation = Math.max(maximumElevation, elevation);

    if (
      (previousValue < 0 && currentValue >= 0) ||
      (previousValue > 0 && currentValue <= 0)
    ) {
      const instant = crossingInstant(
        previousTime,
        currentTime,
        threshold,
        latitude,
        longitude,
      );
      crossings.push({
        instant,
        direction: currentValue > previousValue ? "rising" : "setting",
      });
    }

    previousTime = currentTime;
    previousValue = currentValue;
    if (currentTime === end.getTime() - 1) {
      break;
    }
  }

  return {
    crossings,
    condition:
      crossings.length > 0
        ? "crosses"
        : minimumElevation > threshold
          ? "always-above"
          : "always-below",
    minimumElevation,
    maximumElevation,
  };
}

export function calculateSolarDay(
  date: LocalDate,
  latitude: number,
  longitude: number,
  timeZone: string,
): SolarDay {
  const bounds = localDayBounds(date, timeZone);
  return {
    date,
    bounds,
    horizon: thresholdEvents(
      bounds.start,
      bounds.end,
      latitude,
      longitude,
      SUNRISE_ALTITUDE,
    ),
    civil: thresholdEvents(
      bounds.start,
      bounds.end,
      latitude,
      longitude,
      CIVIL_TWILIGHT_ALTITUDE,
    ),
  };
}

export function firstCrossing(
  events: SolarThresholdEvents,
  direction: SolarCrossing["direction"],
): Date | null {
  return events.crossings.find((event) => event.direction === direction)?.instant ?? null;
}

export const solarThresholds = {
  sunrise: SUNRISE_ALTITUDE,
  civilTwilight: CIVIL_TWILIGHT_ALTITUDE,
} as const;
