import { describe, expect, it } from "vitest";
import {
  formatLightSummary,
  formatPlaceType,
  formatRemaining,
  normalizeLanguage,
  translate,
} from "../../src/lib/i18n";

describe("public-app-shell/v2 Fachlokalisierung", () => {
  it("übernimmt nur unterstützte Shell-Sprachen in die Fachoberfläche", () => {
    expect(normalizeLanguage("en")).toBe("en");
    expect(normalizeLanguage("de")).toBe("de");
    expect(normalizeLanguage("fr")).toBe("de");
    expect(normalizeLanguage(null)).toBe("de");
  });

  it("formatiert Restzeit und dynamische Antworten vollständig in DE und EN", () => {
    expect(formatRemaining(1, "de")).toBe("1 Min.");
    expect(formatRemaining(60_001, "en")).toBe("2 min");
    expect(formatRemaining(3_660_000, "de")).toBe("1 Std. 1 Min.");
    expect(formatRemaining(3_660_000, "en")).toBe("1 hr 1 min");

    const now = new Date("2026-05-01T18:00:00Z");
    const target = new Date("2026-05-01T19:01:00Z");
    expect(
      formatLightSummary(
        {
          phase: "evening-twilight",
          state: "evening-twilight",
          target,
        },
        now,
        "de",
      ),
    ).toEqual({
      answer: "Noch 1 Std. 1 Min. Restlicht",
      detail: "Bis zum Ende der bürgerlichen Dämmerung.",
    });
    expect(
      formatLightSummary(
        {
          phase: "evening-twilight",
          state: "evening-twilight",
          target,
        },
        now,
        "en",
      ),
    ).toEqual({
      answer: "1 hr 1 min of twilight left",
      detail: "Until the end of civil twilight.",
    });
  });

  it("übersetzt Fehlermeldungen und Ortstypen", () => {
    expect(translate("de", "searchOffline")).toContain("offline");
    expect(translate("en", "searchOffline")).toContain("offline");
    expect(translate("de", "searchNetworkUnavailable")).toContain(
      "Netzwerkverbindung",
    );
    expect(translate("en", "searchNetworkUnavailable")).toContain(
      "network connection",
    );
    expect(translate("de", "shareText")).not.toMatch(/52\.|Koordinat/);
    expect(translate("en", "shareText")).toContain("without private location data");
    expect(formatPlaceType("city", "de")).toBe("Stadt");
    expect(formatPlaceType("city", "en")).toBe("city");
  });
});
