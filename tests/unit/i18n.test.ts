import { describe, expect, it } from "vitest";
import {
  formatLightSummary,
  formatPlaceType,
  formatRemaining,
  languageStorageKey,
  normalizeLanguage,
  persistLanguage,
  readStoredLanguage,
  shellLinks,
  translate,
  type LanguageStorage,
} from "../../src/lib/i18n";

class MemoryStorage implements LanguageStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("public-app-shell/v1 Lokalisierung", () => {
  it("verwendet den app-spezifischen Schlüssel und fällt bei Schäden auf DE zurück", () => {
    const storage = new MemoryStorage();
    expect(languageStorageKey).toBe("milosapps.daylight.language");
    expect(readStoredLanguage(storage)).toBe("de");
    storage.setItem(languageStorageKey, "fr");
    expect(readStoredLanguage(storage)).toBe("de");
    expect(normalizeLanguage(null)).toBe("de");
  });

  it("speichert EN und liest es wieder", () => {
    const storage = new MemoryStorage();
    expect(persistLanguage("en", storage)).toBe(true);
    expect(readStoredLanguage(storage)).toBe("en");
  });

  it("liefert ausschließlich absolute umgebungsgebundene Shell-Links", () => {
    expect(shellLinks("dev")).toEqual({
      home: "https://dev.milos-apps.de/",
      apps: "https://dev.milos-apps.de/apps",
      legal: "https://dev.milos-apps.de/impressum",
      privacy: "https://dev.milos-apps.de/datenschutz",
    });
    expect(shellLinks("production")).toEqual({
      home: "https://milos-apps.de/",
      apps: "https://milos-apps.de/apps",
      legal: "https://milos-apps.de/impressum",
      privacy: "https://milos-apps.de/datenschutz",
    });
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
    expect(formatPlaceType("city", "de")).toBe("Stadt");
    expect(formatPlaceType("city", "en")).toBe("city");
  });
});
