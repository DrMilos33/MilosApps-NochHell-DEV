import { describe, expect, it } from "vitest";
import {
  calculateSolarDay,
  firstCrossing,
  solarElevation,
} from "../../src/lib/astronomy";
import { formatLocalTime, type LocalDate } from "../../src/lib/timezone";

interface ReferenceCase {
  label: string;
  date: LocalDate;
  latitude: number;
  longitude: number;
  timeZone: string;
  sunrise: string;
  sunset: string;
  civilDusk: string;
}

const usnoReferences: ReferenceCase[] = [
  {
    label: "Greenwich am Äquator",
    date: { year: 2026, month: 5, day: 1 },
    latitude: 0,
    longitude: 0,
    timeZone: "UTC",
    sunrise: "05:54",
    sunset: "18:00",
    civilDusk: "18:22",
  },
  {
    label: "Berlin nach Beginn der Sommerzeit",
    date: { year: 2026, month: 3, day: 29 },
    latitude: 52.52,
    longitude: 13.405,
    timeZone: "Europe/Berlin",
    sunrise: "06:48",
    sunset: "19:35",
    civilDusk: "20:10",
  },
  {
    label: "Berlin nach Ende der Sommerzeit",
    date: { year: 2026, month: 10, day: 25 },
    latitude: 52.52,
    longitude: 13.405,
    timeZone: "Europe/Berlin",
    sunrise: "06:50",
    sunset: "16:50",
    civilDusk: "17:26",
  },
];

function expectWithinMinutes(actual: string, expected: string, tolerance = 2): void {
  const toMinutes = (value: string): number => {
    const [hours = 0, minutes = 0] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  expect(Math.abs(toMinutes(actual) - toMinutes(expected))).toBeLessThanOrEqual(tolerance);
}

describe("astronomische Referenzen", () => {
  for (const reference of usnoReferences) {
    it(`liegt für ${reference.label} höchstens zwei Minuten von USNO entfernt`, () => {
      const day = calculateSolarDay(
        reference.date,
        reference.latitude,
        reference.longitude,
        reference.timeZone,
      );
      expectWithinMinutes(
        formatLocalTime(firstCrossing(day.horizon, "rising")!, reference.timeZone),
        reference.sunrise,
      );
      expectWithinMinutes(
        formatLocalTime(firstCrossing(day.horizon, "setting")!, reference.timeZone),
        reference.sunset,
      );
      expectWithinMinutes(
        formatLocalTime(firstCrossing(day.civil, "setting")!, reference.timeZone),
        reference.civilDusk,
      );
    });
  }

  it("erkennt Tromsø im Sommer als Polartag", () => {
    const day = calculateSolarDay(
      { year: 2026, month: 6, day: 21 },
      69.6492,
      18.9553,
      "Europe/Oslo",
    );
    expect(day.horizon.condition).toBe("always-above");
    expect(day.civil.condition).toBe("always-above");
    expect(day.horizon.crossings).toHaveLength(0);
  });

  it("erkennt Tromsø im Winter als Polarnacht mit bürgerlicher Dämmerung", () => {
    const day = calculateSolarDay(
      { year: 2026, month: 12, day: 21 },
      69.6492,
      18.9553,
      "Europe/Oslo",
    );
    expect(day.horizon.condition).toBe("always-below");
    expect(day.civil.condition).toBe("crosses");
    expect(formatLocalTime(firstCrossing(day.civil, "rising")!, "Europe/Oslo")).toBe("09:31");
    expect(formatLocalTime(firstCrossing(day.civil, "setting")!, "Europe/Oslo")).toBe("13:53");
  });

  it("erkennt Longyearbyen im tiefen Winter ohne bürgerliche Dämmerung", () => {
    const day = calculateSolarDay(
      { year: 2026, month: 12, day: 21 },
      78.2232,
      15.6469,
      "Arctic/Longyearbyen",
    );
    expect(day.horizon.condition).toBe("always-below");
    expect(day.civil.condition).toBe("always-below");
  });

  it("liefert am lokalen Sonnenmittag eine deutlich positive Sonnenhöhe", () => {
    const elevation = solarElevation(new Date("2026-05-01T12:00:00Z"), 0, 0);
    expect(elevation).toBeGreaterThan(70);
  });
});
