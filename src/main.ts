import "./styles.css";
import type {
  DaylightLocation,
  NormalizedPlace,
  PlaceSearchResult,
} from "./types";
import { createSnapshot, type DaylightSnapshot } from "./lib/daylight";
import {
  GeocodingError,
  loadCachedPlaces,
  searchPlaces,
  toStoredLocation,
} from "./lib/geocoding";
import {
  formatLightSummary,
  localeFor,
  translate,
  type Language,
  type MessageKey,
} from "./lib/i18n";
import {
  browserStorage,
  clearLocalData,
  coarsenDeviceCoordinate,
  loadDeviceSuggestion,
  loadLocation,
  saveDeviceSuggestion,
  saveLocation,
} from "./lib/storage";
import {
  formatLocalDate,
  formatLocalTime,
  formatTimeZoneLabel,
  resolveTimeZone,
} from "./lib/timezone";
import { loadRuntimeConfig } from "./lib/runtime-config";

declare global {
  var milosAppEssentials: { ready(): void };
}

const supportedLanguages: readonly Language[] = ["de", "en"];

function languageFromShell(value: unknown): Language {
  return supportedLanguages.includes(value as Language)
    ? (value as Language)
    : "de";
}

const runtimeConfig = await loadRuntimeConfig();
let language: Language = languageFromShell(document.documentElement.lang);
const environment = runtimeConfig.environment;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App container is missing.");
}

document.body.dataset.appKey = "daylight";
document.body.dataset.environment = environment;
app.dataset.appKey = "daylight";
app.dataset.environment = environment;

app.innerHTML = `
  <section class="intro" aria-labelledby="intro-title">
      <h1 id="intro-title" data-i18n="introTitle">Noch hell für einen Spaziergang?</h1>
      <div class="intro-row">
        <p class="intro-copy" data-i18n="introCopy">
          Ort wählen und Sonnenuntergang, Dämmerungsende sowie den nächsten
          Sonnenaufgang sehen.
        </p>
        <milos-share-button id="share-button"></milos-share-button>
      </div>
    </section>

    <section class="location-card" aria-labelledby="location-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker" data-i18n="locationKicker">Dein Ort</p>
          <h2 id="location-title" data-i18n="locationTitle">Ort wählen</h2>
        </div>
      </div>

      <div class="location-options">
        <milos-place-search
          id="place-search"
          label-de="Ort oder Region"
          label-en="Place or region"
          placeholder-de="z. B. Freiburg"
          placeholder-en="e.g. Freiburg"
        ></milos-place-search>
        <button
          id="cancel-search"
          class="button button-quiet place-cancel"
          type="button"
          data-i18n="cancel"
          hidden
        >
          Abbrechen
        </button>
        <p id="search-hint" class="field-hint" data-i18n="searchHint">
          Suche erst nach dem Absenden. Der Suchtext geht dann an OpenStreetMap.
        </p>
        <div id="local-suggestions" class="local-suggestions" hidden>
          <p class="local-suggestions-title" data-i18n="localSuggestionsTitle">
            Lokale Vorschläge
          </p>
          <div id="local-suggestion-list" class="local-suggestion-list"></div>
        </div>
      </div>
    </section>

    <section id="dashboard" class="dashboard" aria-labelledby="answer-title" hidden>
      <article id="answer-card" class="answer-card">
        <div class="answer-sky" aria-hidden="true">
          <span class="answer-sun"></span>
          <span class="answer-horizon"></span>
        </div>
        <div class="answer-content">
          <div class="answer-location">
            <div>
              <p id="location-context" class="section-kicker" data-i18n="selectedLocation">
                Ausgewählter Ort
              </p>
              <h2 id="location-name"></h2>
              <p id="location-detail" class="location-detail"></p>
            </div>
            <button
              id="change-location"
              class="button button-glass"
              type="button"
              data-i18n="changeLocation"
            >
              Ort ändern
            </button>
          </div>
          <div class="answer-main">
            <p class="answer-label" data-i18n="answerLabel">Noch hell?</p>
            <h2 id="answer-title" tabindex="-1"></h2>
            <p id="answer-detail" class="answer-detail"></p>
          </div>
          <p id="answer-updated" class="answer-updated"></p>
        </div>
      </article>

      <div class="events-section">
        <div class="section-heading events-heading">
          <div>
            <p class="section-kicker" data-i18n="eventsKicker">Heute & morgen</p>
            <h2 data-i18n="eventsTitle">Sonnenzeiten</h2>
          </div>
          <p id="calculation-date" class="section-note"></p>
        </div>

        <dl class="event-grid">
          <div class="event-card event-sunrise">
            <dt data-i18n="sunrise">Sonnenaufgang</dt>
            <dd id="sunrise-time"></dd>
            <dd id="sunrise-note" class="event-note"></dd>
          </div>
          <div class="event-card event-sunset">
            <dt data-i18n="sunset">Sonnenuntergang</dt>
            <dd id="sunset-time"></dd>
            <dd id="sunset-note" class="event-note"></dd>
          </div>
          <div class="event-card event-twilight">
            <dt data-i18n="civilDusk">Ende bürgerliche Dämmerung</dt>
            <dd id="civil-dusk-time"></dd>
            <dd id="civil-dusk-note" class="event-note"></dd>
          </div>
          <div class="event-card event-tomorrow">
            <dt data-i18n="tomorrowSunrise">Morgen: Sonnenaufgang</dt>
            <dd id="tomorrow-sunrise-time"></dd>
            <dd id="tomorrow-sunrise-note" class="event-note"></dd>
          </div>
        </dl>
      </div>

      <aside class="accuracy-note" aria-labelledby="accuracy-title">
        <div class="accuracy-mark" aria-hidden="true">≈</div>
        <div>
          <h2 id="accuracy-title" data-i18n="accuracyTitle">
            Gute Orientierung, keine Sichtgarantie
          </h2>
          <p data-i18n="accuracyCopy">
            Berge, Gebäude und die aktuelle Atmosphäre können den sichtbaren
            Sonnenauf- oder -untergang verschieben. Nahe den Polen wächst die
            rechnerische Unsicherheit.
          </p>
        </div>
      </aside>
    </section>

    <section class="privacy-section" aria-label="Datenschutz" data-i18n-aria-label="privacyLabel">
      <p class="privacy-summary">
        <strong data-i18n="privacyShort">Privat:</strong>
        <span data-i18n="privacySummary">
          Ort, Sprache und ein kleiner Suchcache bleiben lokal; Gerätekoordinaten werden vor dem Speichern gerundet.
        </span>
        <a
          data-milos-privacy-info
          href="https://dev.milos-apps.de/datenschutz"
          data-i18n="privacyLink"
        >Datenschutz</a>
      </p>
      <details class="privacy-details">
        <summary data-i18n="privacyDetails">Lokale Daten verwalten</summary>
        <p data-i18n="privacyCopy">
          Kein Tracking, keine Cookies, kein Konto und keine Koordinaten in der Seitenadresse.
        </p>
        <button
          id="clear-data"
          class="button button-danger"
          type="button"
          data-i18n="clearData"
        >
          Lokale Ortsdaten löschen
        </button>
        <p id="storage-note" class="field-hint"></p>
      </details>
    </section>

  <p class="data-attribution">
    <span data-i18n="attributionPrefix">Ortsdaten ©</span>
    <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">
      <span data-i18n="attributionName">OpenStreetMap-Mitwirkende</span>
    </a>,
    <span data-i18n="attributionSuffix">
      ODbL. Sonnenzeiten nach NOAA/Meeus-Näherung.
    </span>
  </p>
`;

function element<T extends HTMLElement>(selector: string): T {
  const value = document.querySelector<T>(selector);
  if (!value) {
    throw new Error(`Expected element is missing: ${selector}`);
  }
  return value;
}

type PlaceProviderOptions = {
  query: string;
  locale: Language;
  signal: AbortSignal;
};

interface MilosPlaceSearchElement extends HTMLElement {
  input?: HTMLInputElement;
  status?: HTMLParagraphElement;
  cancelSearch(): void;
  setSearchProvider(
    provider: (options: PlaceProviderOptions) => Promise<NormalizedPlace[]>,
  ): void;
  setLocateProvider(
    provider: (options: { locale: Language }) => Promise<NormalizedPlace>,
  ): void;
}

interface MilosShareButtonElement extends HTMLElement {
  setPayloadProvider(
    provider: () => { title: string; text: string; url: string },
  ): void;
}

await customElements.whenDefined("milos-place-search");
await customElements.whenDefined("milos-share-button");

const placeSearch = element<MilosPlaceSearchElement>("#place-search");
const locationCard = element<HTMLElement>(".location-card");
const cancelSearchButton = element<HTMLButtonElement>("#cancel-search");
const shareButton = element<MilosShareButtonElement>("#share-button");
const searchState = placeSearch.status ?? element<HTMLParagraphElement>(
  "#place-search [data-milos-place-status]",
);
const dashboard = element<HTMLElement>("#dashboard");
const answerCard = element<HTMLElement>("#answer-card");
const answerTitle = element<HTMLHeadingElement>("#answer-title");
const clearDataButton = element<HTMLButtonElement>("#clear-data");
const storageNote = element<HTMLParagraphElement>("#storage-note");
const localSuggestions = element<HTMLElement>("#local-suggestions");
const localSuggestionList = element<HTMLElement>("#local-suggestion-list");

type Feedback = {
  key: MessageKey;
  values?: Record<string, string | number> | undefined;
  kind?: "info" | "error" | "success" | undefined;
};

let currentLocation: DaylightLocation | null = loadLocation();
let locationPickerOpen = currentLocation === null;
let deviceSuggestion: DaylightLocation | null =
  currentLocation?.source === "device" ? currentLocation : loadDeviceSuggestion();
if (deviceSuggestion && currentLocation?.source === "device") {
  saveDeviceSuggestion(deviceSuggestion);
}
let refreshTimer: number | null = null;
let searchFeedback: Feedback | null = null;
let storageFeedback: Feedback | null = null;
let activeSearchSignal: AbortSignal | null = null;

function renderFeedback(target: HTMLElement, feedback: Feedback | null): void {
  target.textContent = feedback
    ? translate(language, feedback.key, feedback.values)
    : "";
}

function setSearchMessage(
  key: MessageKey,
  kind: "info" | "error" | "success" = "info",
  values?: Record<string, string | number>,
): void {
  searchFeedback = { key, kind, values };
  renderFeedback(searchState, searchFeedback);
  searchState.dataset.kind = kind;
  searchState.setAttribute("role", kind === "error" ? "alert" : "status");
}

function setStorageMessage(
  key: MessageKey,
  values?: Record<string, string | number>,
): void {
  storageFeedback = { key, values };
  renderFeedback(storageNote, storageFeedback);
}

function applyStaticLanguage(): void {
  document.documentElement.lang = language;
  document.title = translate(language, "documentTitle");
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) {
    description.content = translate(language, "documentDescription");
  }

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((target) => {
    const key = target.dataset.i18n as MessageKey | undefined;
    if (key) {
      target.textContent = translate(language, key);
    }
  });
  document
    .querySelectorAll<HTMLElement>("[data-i18n-aria-label]")
    .forEach((target) => {
      const key = target.dataset.i18nAriaLabel as MessageKey | undefined;
      if (key) {
        target.setAttribute("aria-label", translate(language, key));
      }
    });
  renderFeedback(searchState, searchFeedback);
  renderFeedback(storageNote, storageFeedback);
  renderLocalSuggestions();
}

function readableContext(value: string): string {
  return value
    .split(/\s*(?:,|·)\s*/)
    .filter(Boolean)
    .join(" · ");
}

function renderLocalSuggestions(): void {
  const suggestions: DaylightLocation[] = [];
  const seen = new Set<string>();
  const add = (location: DaylightLocation) => {
    const key = `${location.id}|${location.latitude}|${location.longitude}`;
    if (!seen.has(key)) {
      seen.add(key);
      suggestions.push(location);
    }
  };
  if (deviceSuggestion) add(deviceSuggestion);
  if (currentLocation) add(currentLocation);
  loadCachedPlaces(language).map(toStoredLocation).forEach(add);

  localSuggestionList.replaceChildren();
  suggestions.slice(0, 4).forEach((location) => {
    const button = document.createElement("button");
    button.className = "local-suggestion";
    button.type = "button";
    const name = document.createElement("strong");
    name.textContent =
      location.source === "device"
        ? translate(language, "nearbyName")
        : location.name;
    const context = document.createElement("span");
    context.textContent =
      location.source === "device"
        ? translate(language, "nearbyContext")
        : readableContext(location.context);
    button.append(name, context);
    button.addEventListener("click", () => selectLocation(location));
    localSuggestionList.append(button);
  });
  localSuggestions.hidden = suggestions.length === 0;
}

function eventCopy(
  instant: Date | null,
  snapshot: DaylightSnapshot,
  kind: "sunrise" | "sunset" | "civil-dusk" | "tomorrow-sunrise",
): { value: string; note: string } {
  if (instant) {
    return {
      value: formatLocalTime(
        instant,
        snapshot.location.timeZone,
        localeFor(language),
      ),
      note: translate(
        language,
        kind === "tomorrow-sunrise" ? "nextDayLocalTime" : "localTime",
      ),
    };
  }

  const day = kind === "tomorrow-sunrise" ? snapshot.tomorrow : snapshot.today;
  const events = kind === "civil-dusk" ? day.civil : day.horizon;
  if (events.condition === "always-above") {
    return {
      value: translate(
        language,
        kind === "civil-dusk" ? "endsNever" : "noEvent",
      ),
      note: translate(
        language,
        kind === "civil-dusk" ? "sunAboveTwilight" : "polarDayNote",
      ),
    };
  }
  if (events.condition === "always-below") {
    return {
      value: translate(
        language,
        kind === "civil-dusk" ? "noTwilight" : "noEvent",
      ),
      note: translate(
        language,
        kind === "civil-dusk" ? "sunBelowTwilight" : "polarNightNote",
      ),
    };
  }
  return {
    value: translate(language, "notOnDate"),
    note: translate(language, "eventOutsideDate"),
  };
}

function writeEvent(
  valueSelector: string,
  noteSelector: string,
  copy: { value: string; note: string },
): void {
  element<HTMLElement>(valueSelector).textContent = copy.value;
  element<HTMLElement>(noteSelector).textContent = copy.note;
}

function renderSnapshot(focusAnswer = false): void {
  if (!currentLocation) {
    locationPickerOpen = true;
    locationCard.hidden = false;
    dashboard.hidden = true;
    document.body.dataset.phase = "unselected";
    return;
  }

  const snapshot = createSnapshot(currentLocation);
  const summary = formatLightSummary(
    snapshot.summary,
    snapshot.generatedAt,
    language,
  );
  dashboard.hidden = false;
  locationCard.hidden = !locationPickerOpen;
  document.body.dataset.phase = snapshot.summary.phase;
  answerCard.dataset.phase = snapshot.summary.phase;
  element("#location-name").textContent =
    currentLocation.source === "device"
      ? translate(language, "nearbyName")
      : currentLocation.name;
  element("#location-context").textContent = translate(
    language,
    currentLocation.source === "device"
      ? "roundedDeviceLocation"
      : "selectedLocation",
  );
  element("#location-detail").textContent = [
    currentLocation.source === "device"
      ? translate(language, "nearbyContext")
      : readableContext(currentLocation.context),
    formatTimeZoneLabel(
      snapshot.generatedAt,
      currentLocation.timeZone,
      localeFor(language),
    ),
  ]
    .filter(Boolean)
    .join(" · ");
  answerTitle.textContent = summary.answer;
  element("#answer-detail").textContent = summary.detail;
  element("#answer-updated").textContent = translate(language, "updated", {
    time: formatLocalTime(
      snapshot.generatedAt,
      currentLocation.timeZone,
      localeFor(language),
    ),
  });
  element("#calculation-date").textContent = formatLocalDate(
    snapshot.localDate,
    currentLocation.timeZone,
    localeFor(language),
  );

  writeEvent(
    "#sunrise-time",
    "#sunrise-note",
    eventCopy(snapshot.sunrise, snapshot, "sunrise"),
  );
  writeEvent(
    "#sunset-time",
    "#sunset-note",
    eventCopy(snapshot.sunset, snapshot, "sunset"),
  );
  writeEvent(
    "#civil-dusk-time",
    "#civil-dusk-note",
    eventCopy(snapshot.civilDusk, snapshot, "civil-dusk"),
  );
  writeEvent(
    "#tomorrow-sunrise-time",
    "#tomorrow-sunrise-note",
    eventCopy(snapshot.tomorrowSunrise, snapshot, "tomorrow-sunrise"),
  );

  const duration = snapshot.today.bounds.durationHours;
  if (duration !== 24) {
    element("#calculation-date").textContent += ` · ${translate(
      language,
      "dstDay",
      { hours: duration },
    )}`;
  }
  if (focusAnswer) {
    answerTitle.focus({ preventScroll: true });
    dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectLocation(location: DaylightLocation): void {
  currentLocation = location;
  locationPickerOpen = false;
  if (location.source === "device") {
    deviceSuggestion = location;
    saveDeviceSuggestion(location);
  }
  const stored = saveLocation(location);
  setStorageMessage(stored ? "storedLocation" : "storageUnavailable");
  setSearchMessage("selectedMessage", "success", {
    name:
      location.source === "device"
        ? translate(language, "nearbyName")
        : location.name,
  });
  renderLocalSuggestions();
  renderSnapshot(true);
}

function providerFailure(error: unknown): MessageKey {
  if (!navigator.onLine) return "searchOffline";
  if (error instanceof GeocodingError && error.code === "network") {
    return "searchNetworkUnavailable";
  }
  if (error instanceof GeocodingError && error.code === "http") {
    return "searchHttpError";
  }
  if (error instanceof GeocodingError && error.code === "invalid-response") {
    return "searchInvalidResponse";
  }
  return "searchFailed";
}

function normalizedPlace(result: PlaceSearchResult): NormalizedPlace {
  return {
    id: result.id,
    name: result.name,
    region: result.region,
    country: result.country,
    countryCode: result.countryCode,
    latitude: result.latitude,
    longitude: result.longitude,
    type: result.type,
    timeZone: result.timeZone,
  };
}

function locationFromPlace(place: NormalizedPlace): DaylightLocation {
  const source = place.id.startsWith("device-") ? "device" : "manual";
  return toStoredLocation({
    ...place,
    context: [place.region, place.country].filter(Boolean).join(" · "),
    timeZone:
      place.timeZone ?? resolveTimeZone(place.latitude, place.longitude),
    source,
    osmType: place.type,
  });
}

function abortProviderAfterMessage(key: MessageKey, values?: Record<string, string | number>): never {
  setSearchMessage(key, "error", values);
  throw new DOMException("Handled by Daylight", "AbortError");
}

function locateDevice(): Promise<NormalizedPlace> {
  if (!navigator.geolocation) {
    abortProviderAfterMessage("locationUnsupported");
  }
  setSearchMessage("locationPermissionPrompt");
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const latitude = coarsenDeviceCoordinate(position.coords.latitude);
          const longitude = coarsenDeviceCoordinate(position.coords.longitude);
          resolve({
            id: `device-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
            name: translate(language, "nearbyName"),
            region: translate(language, "nearbyContext"),
            country: "",
            countryCode: "",
            latitude,
            longitude,
            timeZone: resolveTimeZone(latitude, longitude),
            type: "device",
          });
        } catch {
          setSearchMessage("locationProcessFailed", "error");
          reject(new DOMException("Handled by Daylight", "AbortError"));
        }
      },
      (error) => {
        const keys: Record<number, MessageKey> = {
          [error.PERMISSION_DENIED]: "locationDenied",
          [error.POSITION_UNAVAILABLE]: "locationUnavailable",
          [error.TIMEOUT]: "locationTimeout",
        };
        setSearchMessage(keys[error.code] ?? "locationFailed", "error");
        placeSearch.input?.focus();
        reject(new DOMException("Handled by Daylight", "AbortError"));
      },
      {
        enableHighAccuracy: false,
        timeout: 10_000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  });
}

function changeLanguage(nextLanguage: unknown): void {
  const selected = languageFromShell(nextLanguage);
  if (selected === language) {
    return;
  }
  placeSearch.cancelSearch();
  language = selected;
  applyStaticLanguage();
  renderSnapshot();
}

window.addEventListener("milosapps:localechange", (event) => {
  const detail = (event as CustomEvent<{ locale?: unknown }>).detail;
  changeLanguage(detail?.locale);
});

placeSearch.setSearchProvider(async ({ query, locale, signal }) => {
  activeSearchSignal = signal;
  cancelSearchButton.hidden = false;
  try {
    const results = await searchPlaces(query, signal, locale);
    if (signal.aborted || activeSearchSignal !== signal) {
      throw new DOMException("Outdated place search", "AbortError");
    }
    return results.map(normalizedPlace);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      setSearchMessage("searchCancelled");
      throw error;
    }
    const key = providerFailure(error);
    const values =
      key === "searchHttpError" && error instanceof GeocodingError
        ? { status: error.status ?? "–" }
        : undefined;
    abortProviderAfterMessage(key, values);
  } finally {
    if (activeSearchSignal === signal) {
      activeSearchSignal = null;
      cancelSearchButton.hidden = true;
    }
  }
});

cancelSearchButton.addEventListener("click", () => {
  placeSearch.cancelSearch();
});

placeSearch.setLocateProvider(async () => locateDevice());

placeSearch.addEventListener("milosapps:placechange", (event) => {
  const detail = (event as CustomEvent<NormalizedPlace>).detail;
  selectLocation(locationFromPlace(detail));
});

shareButton.setPayloadProvider(() => ({
  title: document.title,
  text: translate(language, "shareText"),
  url: new URL(".", window.location.href).href,
}));

element<HTMLButtonElement>("#change-location").addEventListener("click", () => {
  locationPickerOpen = true;
  locationCard.hidden = false;
  locationCard.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
  placeSearch.input?.focus({ preventScroll: true });
});

clearDataButton.addEventListener("click", () => {
  const cleared = clearLocalData();
  currentLocation = null;
  locationPickerOpen = true;
  deviceSuggestion = null;
  renderSnapshot();
  renderLocalSuggestions();
  setStorageMessage(cleared ? "dataCleared" : "noLocalData");
  setSearchMessage("dataClearedStatus", "success");
  if (placeSearch.input) placeSearch.input.value = "";
  placeSearch.input?.focus();
});

function refreshForResume(): void {
  if (document.visibilityState === "visible" && currentLocation) {
    renderSnapshot();
  }
}

document.addEventListener("visibilitychange", refreshForResume);
window.addEventListener("focus", refreshForResume);
window.addEventListener("pageshow", refreshForResume);
window.addEventListener("online", () => setSearchMessage("online", "success"));
window.addEventListener("offline", () => setSearchMessage("offline"));

if ("serviceWorker" in navigator && import.meta.env.PROD && window.isSecureContext) {
  const registerServiceWorker = () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline support is progressive enhancement; the app remains usable online.
    });
  };
  if (document.readyState === "complete") {
    registerServiceWorker();
  } else {
    window.addEventListener("load", registerServiceWorker, { once: true });
  }
}

if (!browserStorage()) {
  setStorageMessage("browserStorageBlocked");
}

applyStaticLanguage();
renderSnapshot();
globalThis.milosAppEssentials.ready();
refreshTimer = window.setInterval(() => renderSnapshot(), 60_000);
window.addEventListener("beforeunload", () => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
  }
});
