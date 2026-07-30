import type { LightSummary } from "./daylight";

export type Language = "de" | "en";
export type AppEnvironment = "dev" | "production";
export type LanguageStorage = Pick<Storage, "getItem" | "setItem">;

export const languageStorageKey = "milosapps.daylight.language";

const deMessages = {
  documentTitle: "Noch hell? – MilosApps",
  documentDescription:
    "Noch hell? zeigt Sonnenaufgang, Sonnenuntergang, Dämmerungsende und die verbleibende Helligkeit für deinen Ort.",
  skip: "Zum Inhalt springen",
  brandHome: "MilosApps-Startseite",
  appNav: "App-Navigation",
  languageNav: "Sprache",
  allApps: "Alle Apps",
  introEyebrow: "Tageslicht, auf einen Blick",
  introTitle: "Passt der Spaziergang noch ins Helle?",
  introCopy:
    "Ein Ort genügt. Du siehst Sonnenuntergang, Dämmerungsende und den nächsten Sonnenaufgang – ohne Wetter, Konto oder Standorttracking.",
  locationKicker: "Dein Ort",
  locationTitle: "Suchen oder Gerät fragen",
  locationNote: "Beide Wege liefern dieselbe vollständige Ansicht.",
  placeLabel: "Ort oder Region",
  placePlaceholder: "z. B. Freiburg oder Tromsø",
  searchButton: "Ort suchen",
  searchRunning: "Suche läuft …",
  cancel: "Abbrechen",
  searchHint:
    "Suche erst nach dem Absenden. Der Suchtext geht dann an OpenStreetMap.",
  deviceTitle: "Gerätestandort",
  deviceCopy: "Nur nach deinem Tipp, auf etwa 1 km gerundet gespeichert.",
  locateButton: "Standort verwenden",
  locatingButton: "Standort wird gefragt …",
  resultsHeading: "Gefundene Orte",
  resultCountOne: "1 gefundener Ort",
  resultCountMany: "{count} gefundene Orte",
  emptyResult:
    "Kein passender Ort gefunden. Ergänze Land oder Region und versuche es erneut.",
  selectedLocation: "Ausgewählter Ort",
  roundedDeviceLocation: "Gerundeter Gerätestandort",
  nearbyName: "In deiner Nähe",
  nearbyContext: "Auf etwa 1 km gerundet",
  changeLocation: "Ort ändern",
  answerLabel: "Noch hell?",
  eventsKicker: "Heute & morgen",
  eventsTitle: "Sonnenzeiten",
  sunrise: "Sonnenaufgang",
  sunset: "Sonnenuntergang",
  civilDusk: "Ende bürgerliche Dämmerung",
  tomorrowSunrise: "Morgen: Sonnenaufgang",
  accuracyTitle: "Gute Orientierung, keine Sichtgarantie",
  accuracyCopy:
    "Berge, Gebäude und die aktuelle Atmosphäre können den sichtbaren Sonnenauf- oder -untergang verschieben. Nahe den Polen wächst die rechnerische Unsicherheit.",
  privacyKicker: "Privat by design",
  privacyTitle: "Dein genauer Standort bleibt auf diesem Gerät.",
  privacyCopy:
    "Gerätekoordinaten werden vor dem Speichern gerundet. Es gibt kein Konto, keine App-Datenbank und keine Koordinaten in der Seitenadresse.",
  clearData: "Lokale Ortsdaten löschen",
  footerText: "Tageslichtzeiten für deinen Ort – lokal berechnet, ohne Konto.",
  attributionPrefix: "Ortsdaten ©",
  attributionName: "OpenStreetMap-Mitwirkende",
  attributionSuffix: "ODbL. Sonnenzeiten nach NOAA/Meeus-Näherung.",
  footerNav: "Rechtliches",
  legal: "Impressum",
  privacy: "Datenschutz",
  localTime: "Ortszeit",
  nextDayLocalTime: "Ortszeit am nächsten Kalendertag",
  endsNever: "Endet nicht",
  noEvent: "Kein Ereignis",
  noTwilight: "Keine Dämmerung",
  notOnDate: "Nicht an diesem Datum",
  sunAboveTwilight: "Die Sonne bleibt über der Dämmerungsgrenze.",
  polarDayNote: "Polartag: Die Sonne bleibt über dem Horizont.",
  sunBelowTwilight: "Die Sonne erreicht die bürgerliche Dämmerungsgrenze nicht.",
  polarNightNote: "Polarnacht: Die Sonne bleibt unter dem Horizont.",
  eventOutsideDate: "Das Ereignis liegt außerhalb dieses lokalen Kalendertags.",
  updated: "Aktualisiert {time} Uhr Ortszeit",
  dstDay: "Zeitumstellung ({hours} Std.)",
  selectedMessage: "{name} ist ausgewählt.",
  storedLocation: "Der gewählte Ort ist lokal für die nächste Wiederöffnung gespeichert.",
  storageUnavailable:
    "Lokales Speichern ist in diesem Browser nicht verfügbar; die Ansicht funktioniert trotzdem.",
  browserStorageBlocked:
    "Dieser Browser blockiert lokale Speicherung. Die App funktioniert für die aktuelle Sitzung.",
  searchMinimum: "Bitte gib mindestens zwei Zeichen ein.",
  searchingFor: "Suche nach „{query}“ …",
  searchNotFound: "Kein Ort gefunden.",
  chooseResult: "Wähle den passenden Ort aus der Ergebnisliste.",
  searchCancelled: "Ortssuche abgebrochen.",
  searchFailed: "Die Ortssuche ist fehlgeschlagen.",
  searchOffline: "Du bist offline. Ein gespeicherter Ort funktioniert weiterhin.",
  searchNetworkUnavailable:
    "Eine neue Ortssuche braucht eine erreichbare Netzwerkverbindung. Ein gespeicherter Ort funktioniert weiterhin.",
  searchHttpError: "Die Ortssuche antwortet gerade nicht ({status}).",
  searchInvalidResponse: "Die Ortssuche hat ein unerwartetes Ergebnis geliefert.",
  locationUnsupported:
    "Dieses Gerät bietet keine Standortfunktion. Nutze stattdessen die gleichwertige Ortssuche.",
  locationPermissionPrompt: "Der Browser fragt jetzt nach deiner Standortfreigabe.",
  locationProcessFailed: "Der Standort konnte nicht verarbeitet werden.",
  locationDenied:
    "Standort nicht freigegeben oder Abfrage abgebrochen. Die Ortssuche funktioniert vollständig ohne Freigabe.",
  locationUnavailable:
    "Das Gerät konnte gerade keinen Standort bestimmen. Nutze die Ortssuche oder versuche es später erneut.",
  locationTimeout:
    "Die Standortbestimmung hat zu lange gedauert. Nutze die Ortssuche oder versuche es erneut.",
  locationFailed: "Die Standortbestimmung ist fehlgeschlagen.",
  dataCleared: "Gespeicherter Ort und Suchcache wurden vollständig gelöscht.",
  noLocalData: "Es waren keine zugänglichen lokalen Ortsdaten vorhanden.",
  dataClearedStatus: "Lokale Ortsdaten gelöscht. Du kannst jederzeit neu suchen.",
  online: "Wieder online.",
  offline: "Offline. Gespeicherte Sonnenzeiten werden weiter lokal berechnet.",
  timeZoneUnsupported: "Die ermittelte Zeitzone wird von diesem Browser nicht unterstützt.",
  summaryPolarDayAnswer: "Ja – durchgehend",
  summaryPolarDayDetail: "Die Sonne geht an diesem Ort heute nicht unter.",
  summaryPolarTwilightAnswer: "Dämmerlicht",
  summaryPolarNightAnswer: "Nein – Polarnacht",
  summaryPolarNightTimed: "Die Sonne bleibt heute unter dem Horizont. Nächstes Licht in {time}",
  summaryPolarNightDetail: "Die Sonne bleibt heute unter dem Horizont.",
  summaryDaylightTimed: "Noch {time} hell",
  summaryDaylightAnswer: "Ja – noch hell",
  summaryUntilDusk: "Bis zum Ende der bürgerlichen Dämmerung.",
  summarySunAboveHorizon: "Die Sonne steht noch über dem Horizont.",
  summaryMorningAnswer: "Es wird hell",
  summarySunriseTimed: "Sonnenaufgang in {time}",
  summaryEveningTimed: "Noch {time} Restlicht",
  summaryNightAnswer: "Nein – es ist dunkel",
  summaryNoSunrise: "Heute und morgen gibt es keinen Sonnenaufgang.",
  placeTypeCity: "Stadt",
  placeTypeTown: "Stadt",
  placeTypeVillage: "Dorf",
  placeTypeMunicipality: "Gemeinde",
  placeTypeHamlet: "Weiler",
  placeTypeAdministrative: "Verwaltungsgebiet",
  placeTypePlace: "Ort",
  unnamedPlace: "Unbenannter Ort",
} as const;

export type MessageKey = keyof typeof deMessages;

const enMessages: Record<MessageKey, string> = {
  documentTitle: "Still light? – MilosApps",
  documentDescription:
    "Still light? shows sunrise, sunset, the end of civil twilight and remaining daylight for your location.",
  skip: "Skip to content",
  brandHome: "MilosApps home",
  appNav: "App navigation",
  languageNav: "Language",
  allApps: "All apps",
  introEyebrow: "Daylight at a glance",
  introTitle: "Is there enough daylight left for a walk?",
  introCopy:
    "One place is enough. See sunset, the end of twilight and the next sunrise – without weather, an account or location tracking.",
  locationKicker: "Your place",
  locationTitle: "Search or ask your device",
  locationNote: "Both options lead to the same complete view.",
  placeLabel: "Place or region",
  placePlaceholder: "e.g. Freiburg or Tromsø",
  searchButton: "Search place",
  searchRunning: "Searching …",
  cancel: "Cancel",
  searchHint:
    "The search starts only after you submit. The search text is then sent to OpenStreetMap.",
  deviceTitle: "Device location",
  deviceCopy: "Only after your tap, stored rounded to about 1 km.",
  locateButton: "Use location",
  locatingButton: "Requesting location …",
  resultsHeading: "Places found",
  resultCountOne: "1 place found",
  resultCountMany: "{count} places found",
  emptyResult: "No matching place found. Add a country or region and try again.",
  selectedLocation: "Selected place",
  roundedDeviceLocation: "Rounded device location",
  nearbyName: "Near you",
  nearbyContext: "Rounded to about 1 km",
  changeLocation: "Change place",
  answerLabel: "Still light?",
  eventsKicker: "Today & tomorrow",
  eventsTitle: "Sun times",
  sunrise: "Sunrise",
  sunset: "Sunset",
  civilDusk: "End of civil twilight",
  tomorrowSunrise: "Tomorrow: sunrise",
  accuracyTitle: "Useful guidance, not a visibility guarantee",
  accuracyCopy:
    "Mountains, buildings and current atmospheric conditions can shift the visible sunrise or sunset. Computational uncertainty increases near the poles.",
  privacyKicker: "Private by design",
  privacyTitle: "Your precise location stays on this device.",
  privacyCopy:
    "Device coordinates are rounded before storage. There is no account, app database or coordinates in the page address.",
  clearData: "Delete local place data",
  footerText: "Daylight times for your place – calculated locally, without an account.",
  attributionPrefix: "Place data ©",
  attributionName: "OpenStreetMap contributors",
  attributionSuffix: "ODbL. Sun times use a NOAA/Meeus approximation.",
  footerNav: "Legal",
  legal: "Legal notice",
  privacy: "Privacy",
  localTime: "Local time",
  nextDayLocalTime: "Local time on the next calendar day",
  endsNever: "Does not end",
  noEvent: "No event",
  noTwilight: "No twilight",
  notOnDate: "Not on this date",
  sunAboveTwilight: "The sun stays above the twilight threshold.",
  polarDayNote: "Polar day: the sun stays above the horizon.",
  sunBelowTwilight: "The sun does not reach the civil twilight threshold.",
  polarNightNote: "Polar night: the sun stays below the horizon.",
  eventOutsideDate: "The event falls outside this local calendar day.",
  updated: "Updated {time} local time",
  dstDay: "Clock change ({hours} hrs)",
  selectedMessage: "{name} is selected.",
  storedLocation: "The selected place is stored locally for the next reopening.",
  storageUnavailable:
    "Local storage is unavailable in this browser; the current view still works.",
  browserStorageBlocked:
    "This browser blocks local storage. The app works for the current session.",
  searchMinimum: "Enter at least two characters.",
  searchingFor: "Searching for “{query}” …",
  searchNotFound: "No place found.",
  chooseResult: "Choose the matching place from the results.",
  searchCancelled: "Place search cancelled.",
  searchFailed: "The place search failed.",
  searchOffline: "You are offline. A saved place will continue to work.",
  searchNetworkUnavailable:
    "A new place search needs an available network connection. A saved place will continue to work.",
  searchHttpError: "The place search is not responding right now ({status}).",
  searchInvalidResponse: "The place search returned an unexpected result.",
  locationUnsupported:
    "This device does not provide location access. Use the equivalent place search instead.",
  locationPermissionPrompt: "Your browser is now asking for location permission.",
  locationProcessFailed: "The location could not be processed.",
  locationDenied:
    "Location was not allowed or the request was cancelled. Place search works fully without permission.",
  locationUnavailable:
    "The device could not determine a location right now. Use place search or try again later.",
  locationTimeout: "Location took too long. Use place search or try again.",
  locationFailed: "Location failed.",
  dataCleared: "The saved place and search cache were completely deleted.",
  noLocalData: "There was no accessible local place data.",
  dataClearedStatus: "Local place data deleted. You can search again at any time.",
  online: "Back online.",
  offline: "Offline. Saved sun times continue to be calculated locally.",
  timeZoneUnsupported: "This browser does not support the detected time zone.",
  summaryPolarDayAnswer: "Yes – all day",
  summaryPolarDayDetail: "The sun does not set at this place today.",
  summaryPolarTwilightAnswer: "Twilight",
  summaryPolarNightAnswer: "No – polar night",
  summaryPolarNightTimed: "The sun stays below the horizon today. Next light in {time}",
  summaryPolarNightDetail: "The sun stays below the horizon today.",
  summaryDaylightTimed: "{time} of daylight left",
  summaryDaylightAnswer: "Yes – still light",
  summaryUntilDusk: "Until the end of civil twilight.",
  summarySunAboveHorizon: "The sun is still above the horizon.",
  summaryMorningAnswer: "It is getting light",
  summarySunriseTimed: "Sunrise in {time}",
  summaryEveningTimed: "{time} of twilight left",
  summaryNightAnswer: "No – it is dark",
  summaryNoSunrise: "There is no sunrise today or tomorrow.",
  placeTypeCity: "city",
  placeTypeTown: "town",
  placeTypeVillage: "village",
  placeTypeMunicipality: "municipality",
  placeTypeHamlet: "hamlet",
  placeTypeAdministrative: "administrative area",
  placeTypePlace: "place",
  unnamedPlace: "Unnamed place",
};

const messages: Record<Language, Record<MessageKey, string>> = {
  de: deMessages,
  en: enMessages,
};

export function normalizeLanguage(value: unknown): Language {
  return value === "en" ? "en" : "de";
}

export function readStoredLanguage(storage?: LanguageStorage | null): Language {
  try {
    const target = storage ?? window.localStorage;
    return normalizeLanguage(target.getItem(languageStorageKey));
  } catch {
    return "de";
  }
}

export function persistLanguage(
  language: Language,
  storage?: LanguageStorage | null,
): boolean {
  try {
    const target = storage ?? window.localStorage;
    target.setItem(languageStorageKey, language);
    return true;
  } catch {
    return false;
  }
}

export function translate(
  language: Language,
  key: MessageKey,
  values: Record<string, string | number> = {},
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    messages[language][key],
  );
}

export function localeFor(language: Language): "de-DE" | "en-GB" {
  return language === "en" ? "en-GB" : "de-DE";
}

export function shellLinks(environment: AppEnvironment): {
  home: string;
  apps: string;
  legal: string;
  privacy: string;
} {
  const base =
    environment === "production" ? "https://milos-apps.de" : "https://dev.milos-apps.de";
  return {
    home: `${base}/`,
    apps: `${base}/apps`,
    legal: `${base}/impressum`,
    privacy: `${base}/datenschutz`,
  };
}

export function formatRemaining(milliseconds: number, language: Language): string {
  const totalMinutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (language === "en") {
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  }
  if (hours === 0) return `${minutes} Min.`;
  if (minutes === 0) return `${hours} Std.`;
  return `${hours} Std. ${minutes} Min.`;
}

export function formatLightSummary(
  summary: LightSummary,
  now: Date,
  language: Language,
): { answer: string; detail: string } {
  const remaining =
    summary.target && summary.target > now
      ? formatRemaining(summary.target.getTime() - now.getTime(), language)
      : null;

  switch (summary.state) {
    case "polar-day":
      return {
        answer: translate(language, "summaryPolarDayAnswer"),
        detail: translate(language, "summaryPolarDayDetail"),
      };
    case "polar-night-twilight":
    case "polar-night-dark":
      return {
        answer: translate(
          language,
          summary.state === "polar-night-twilight"
            ? "summaryPolarTwilightAnswer"
            : "summaryPolarNightAnswer",
        ),
        detail: remaining
          ? translate(language, "summaryPolarNightTimed", { time: remaining })
          : translate(language, "summaryPolarNightDetail"),
      };
    case "daylight-until-dusk":
    case "daylight-over-horizon":
      return {
        answer: remaining
          ? translate(language, "summaryDaylightTimed", { time: remaining })
          : translate(language, "summaryDaylightAnswer"),
        detail: translate(
          language,
          summary.state === "daylight-until-dusk"
            ? "summaryUntilDusk"
            : "summarySunAboveHorizon",
        ),
      };
    case "morning-twilight":
      return {
        answer: translate(language, "summaryMorningAnswer"),
        detail: remaining
          ? translate(language, "summarySunriseTimed", { time: remaining })
          : translate(language, "summaryNoSunrise"),
      };
    case "evening-twilight":
      return {
        answer: remaining
          ? translate(language, "summaryEveningTimed", { time: remaining })
          : translate(language, "summaryDaylightAnswer"),
        detail: translate(language, "summaryUntilDusk"),
      };
    case "night":
      return {
        answer: translate(language, "summaryNightAnswer"),
        detail: remaining
          ? translate(language, "summarySunriseTimed", { time: remaining })
          : translate(language, "summaryNoSunrise"),
      };
  }
}

export function formatPlaceType(value: string, language: Language): string {
  const normalized = value.toLocaleLowerCase("en-US");
  const keyByType: Partial<Record<string, MessageKey>> = {
    city: "placeTypeCity",
    town: "placeTypeTown",
    village: "placeTypeVillage",
    municipality: "placeTypeMunicipality",
    hamlet: "placeTypeHamlet",
    administrative: "placeTypeAdministrative",
    place: "placeTypePlace",
    ort: "placeTypePlace",
  };
  const key = keyByType[normalized];
  return key ? translate(language, key) : value;
}
