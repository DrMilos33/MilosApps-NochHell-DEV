import { describe, expect, it } from "vitest";
import type { DaylightLocation } from "../../src/types";
import { createSnapshot, formatRemaining } from "../../src/lib/daylight";

const berlin: DaylightLocation = {
  id: "berlin",
  name: "Berlin",
  context: "Deutschland",
  latitude: 52.52,
  longitude: 13.405,
  timeZone: "Europe/Berlin",
  source: "manual",
};

describe("Resthelligkeit", () => {
  it("rundet verbleibende Zeit nicht vorzeitig auf null", () => {
    expect(formatRemaining(1)).toBe("1 Min.");
    expect(formatRemaining(60_001)).toBe("2 Min.");
    expect(formatRemaining(3_600_000)).toBe("1 Std.");
    expect(formatRemaining(3_660_000)).toBe("1 Std. 1 Min.");
  });

  it("unterscheidet Morgen-, Tages-, Abend- und Nachtzustand", () => {
    const morning = createSnapshot(berlin, new Date("2026-05-01T03:30:00Z"));
    const day = createSnapshot(berlin, new Date("2026-05-01T11:00:00Z"));
    const evening = createSnapshot(berlin, new Date("2026-05-01T18:45:00Z"));
    const night = createSnapshot(berlin, new Date("2026-05-01T21:30:00Z"));

    expect(morning.summary.phase).toBe("morning-twilight");
    expect(day.summary.phase).toBe("daylight");
    expect(evening.summary.phase).toBe("evening-twilight");
    expect(night.summary.phase).toBe("night");
  });

  it("nennt Polartag und Polarnacht ehrlich", () => {
    const tromsoe = {
      ...berlin,
      id: "tromsoe",
      name: "Tromsø",
      latitude: 69.6492,
      longitude: 18.9553,
      timeZone: "Europe/Oslo",
    };
    const summer = createSnapshot(tromsoe, new Date("2026-06-21T12:00:00Z"));
    const winter = createSnapshot(tromsoe, new Date("2026-12-21T12:00:00Z"));

    expect(summer.summary.phase).toBe("polar-day");
    expect(summer.summary.answer).toContain("durchgehend");
    expect(winter.summary.phase).toBe("polar-night");
    expect(winter.summary.detail).toContain("unter dem Horizont");
  });

  it("wechselt beim Erzeugen eines neuen Snapshots über lokale Mitternacht", () => {
    const before = createSnapshot(berlin, new Date("2026-07-30T21:59:00Z"));
    const after = createSnapshot(berlin, new Date("2026-07-30T22:01:00Z"));
    expect(before.localDate.day).toBe(30);
    expect(after.localDate.day).toBe(31);
  });
});
