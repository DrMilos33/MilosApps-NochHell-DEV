import { describe, expect, it } from "vitest";
import {
  addLocalDays,
  firstInstantOfLocalDate,
  localDateAt,
  localDayBounds,
  resolveTimeZone,
} from "../../src/lib/timezone";

describe("lokale Kalendertage und Zeitzonen", () => {
  it("bildet den Berliner Sommerzeitstart als 23-Stunden-Tag ab", () => {
    const bounds = localDayBounds({ year: 2026, month: 3, day: 29 }, "Europe/Berlin");
    expect(bounds.durationHours).toBe(23);
    expect(bounds.start.toISOString()).toBe("2026-03-28T23:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-03-29T22:00:00.000Z");
  });

  it("bildet das Berliner Sommerzeitende als 25-Stunden-Tag ab", () => {
    const bounds = localDayBounds({ year: 2026, month: 10, day: 25 }, "Europe/Berlin");
    expect(bounds.durationHours).toBe(25);
    expect(bounds.start.toISOString()).toBe("2026-10-24T22:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });

  it("behandelt UTC+14 und den internationalen Datumssprung", () => {
    const start = firstInstantOfLocalDate(
      { year: 2026, month: 1, day: 1 },
      "Pacific/Kiritimati",
    );
    expect(start.toISOString()).toBe("2025-12-31T10:00:00.000Z");
    expect(localDateAt(new Date("2025-12-31T11:00:00Z"), "Pacific/Kiritimati")).toEqual({
      year: 2026,
      month: 1,
      day: 1,
    });
  });

  it("addiert lokale Kalendertage unabhängig von der Host-Zeitzone", () => {
    expect(addLocalDays({ year: 2024, month: 2, day: 28 }, 1)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
    expect(addLocalDays({ year: 2024, month: 12, day: 31 }, 1)).toEqual({
      year: 2025,
      month: 1,
      day: 1,
    });
  });

  it("ordnet Referenzorte lokal einer IANA-Zeitzone zu", () => {
    expect(resolveTimeZone(52.52, 13.405)).toBe("Europe/Berlin");
    expect(resolveTimeZone(40.7128, -74.006)).toBe("America/New_York");
    expect(resolveTimeZone(-33.8688, 151.2093)).toBe("Australia/Sydney");
  });
});
