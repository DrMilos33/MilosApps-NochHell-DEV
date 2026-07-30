import "./styles.css";
import type { DaylightLocation, PlaceSearchResult } from "./types";
import { createSnapshot, type DaylightSnapshot } from "./lib/daylight";
import { searchPlaces, toStoredLocation } from "./lib/geocoding";
import {
  browserStorage,
  clearLocalData,
  coarsenDeviceCoordinate,
  loadLocation,
  saveLocation,
} from "./lib/storage";
import {
  formatLocalDate,
  formatLocalTime,
  formatTimeZoneLabel,
  resolveTimeZone,
} from "./lib/timezone";
import { loadRuntimeConfig } from "./lib/runtime-config";

await loadRuntimeConfig();

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App-Container fehlt.");
}

app.innerHTML = `
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="./" aria-label="Noch hell? Startseite">
        <span class="brand-mark" aria-hidden="true"><span></span></span>
        <span>Noch hell?</span>
      </a>
      <span class="privacy-pill">Ohne Konto · lokal</span>
    </div>
  </header>

  <main id="main" class="shell">
    <section class="intro" aria-labelledby="intro-title">
      <p class="eyebrow">Tageslicht, auf einen Blick</p>
      <h1 id="intro-title">Passt der Spaziergang noch ins Helle?</h1>
      <p class="intro-copy">
        Ein Ort genügt. Du siehst Sonnenuntergang, Dämmerungsende und den
        nächsten Sonnenaufgang – ohne Wetter, Konto oder Standorttracking.
      </p>
    </section>

    <section class="location-card" aria-labelledby="location-title">
      <div class="section-heading">
        <div>
          <p class="section-kicker">Dein Ort</p>
          <h2 id="location-title">Suchen oder Gerät fragen</h2>
        </div>
        <p class="section-note">Beide Wege liefern dieselbe vollständige Ansicht.</p>
      </div>

      <div class="location-options">
        <form id="place-form" class="search-form" novalidate>
          <label for="place-query">Ort oder Region</label>
          <div class="input-row">
            <input
              id="place-query"
              name="place"
              type="search"
              inputmode="search"
              autocomplete="off"
              minlength="2"
              placeholder="z. B. Freiburg oder Tromsø"
              aria-describedby="search-hint"
            />
            <button id="search-button" class="button button-primary" type="submit">
              Ort suchen
            </button>
            <button id="cancel-search" class="button button-quiet" type="button" hidden>
              Abbrechen
            </button>
          </div>
          <p id="search-hint" class="field-hint">
            Suche erst nach dem Absenden. Der Suchtext geht dann an OpenStreetMap.
          </p>
        </form>

        <div class="device-option">
          <div>
            <strong>Gerätestandort</strong>
            <span>Nur nach deinem Tipp, auf etwa 1 km gerundet gespeichert.</span>
          </div>
          <button id="locate-button" class="button button-secondary" type="button">
            Standort verwenden
          </button>
        </div>
      </div>

      <div id="search-state" class="search-state" role="status" aria-live="polite"></div>
      <div id="search-results" class="search-results" aria-live="off" hidden>
        <h3 id="results-title">Gefundene Orte</h3>
        <div id="results-list" class="results-list" role="list" aria-labelledby="results-title"></div>
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
              <p id="location-context" class="section-kicker">Ausgewählter Ort</p>
              <h2 id="location-name"></h2>
              <p id="location-detail" class="location-detail"></p>
            </div>
            <button id="change-location" class="button button-glass" type="button">
              Ort ändern
            </button>
          </div>
          <div class="answer-main">
            <p class="answer-label">Noch hell?</p>
            <h2 id="answer-title" tabindex="-1"></h2>
            <p id="answer-detail" class="answer-detail"></p>
          </div>
          <p id="answer-updated" class="answer-updated"></p>
        </div>
      </article>

      <div class="events-section">
        <div class="section-heading events-heading">
          <div>
            <p class="section-kicker">Heute & morgen</p>
            <h2>Sonnenzeiten</h2>
          </div>
          <p id="calculation-date" class="section-note"></p>
        </div>

        <dl class="event-grid">
          <div class="event-card event-sunrise">
            <dt>Sonnenaufgang</dt>
            <dd id="sunrise-time"></dd>
            <dd id="sunrise-note" class="event-note"></dd>
          </div>
          <div class="event-card event-sunset">
            <dt>Sonnenuntergang</dt>
            <dd id="sunset-time"></dd>
            <dd id="sunset-note" class="event-note"></dd>
          </div>
          <div class="event-card event-twilight">
            <dt>Ende bürgerliche Dämmerung</dt>
            <dd id="civil-dusk-time"></dd>
            <dd id="civil-dusk-note" class="event-note"></dd>
          </div>
          <div class="event-card event-tomorrow">
            <dt>Morgen: Sonnenaufgang</dt>
            <dd id="tomorrow-sunrise-time"></dd>
            <dd id="tomorrow-sunrise-note" class="event-note"></dd>
          </div>
        </dl>
      </div>

      <aside class="accuracy-note" aria-labelledby="accuracy-title">
        <div class="accuracy-mark" aria-hidden="true">≈</div>
        <div>
          <h2 id="accuracy-title">Gute Orientierung, keine Sichtgarantie</h2>
          <p>
            Berge, Gebäude und die aktuelle Atmosphäre können den sichtbaren
            Sonnenauf- oder -untergang verschieben. Nahe den Polen wächst die
            rechnerische Unsicherheit.
          </p>
        </div>
      </aside>
    </section>

    <section class="privacy-section" aria-labelledby="privacy-title">
      <div>
        <p class="section-kicker">Privat by design</p>
        <h2 id="privacy-title">Dein genauer Standort bleibt auf diesem Gerät.</h2>
      </div>
      <div class="privacy-grid">
        <p>
          Gerätekoordinaten werden vor dem Speichern gerundet. Es gibt kein
          Konto, keine App-Datenbank und keine Koordinaten in der Seitenadresse.
        </p>
        <button id="clear-data" class="button button-danger" type="button">
          Lokale Ortsdaten löschen
        </button>
      </div>
      <p id="storage-note" class="field-hint"></p>
    </section>
  </main>

  <footer class="site-footer">
    <div class="shell footer-inner">
      <p>
        Ortsdaten ©
        <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap-Mitwirkende</a>,
        ODbL. Sonnenzeiten nach NOAA/Meeus-Näherung.
      </p>
      <p><a href="./health.json">DEV-Healthcheck</a> · App-Key <code>daylight</code></p>
    </div>
  </footer>
`;

function element<T extends HTMLElement>(selector: string): T {
  const value = document.querySelector<T>(selector);
  if (!value) {
    throw new Error(`Erwartetes Element fehlt: ${selector}`);
  }
  return value;
}

const placeForm = element<HTMLFormElement>("#place-form");
const placeQuery = element<HTMLInputElement>("#place-query");
const searchButton = element<HTMLButtonElement>("#search-button");
const cancelSearchButton = element<HTMLButtonElement>("#cancel-search");
const locateButton = element<HTMLButtonElement>("#locate-button");
const searchState = element<HTMLDivElement>("#search-state");
const searchResults = element<HTMLDivElement>("#search-results");
const resultsList = element<HTMLDivElement>("#results-list");
const resultsTitle = element<HTMLHeadingElement>("#results-title");
const dashboard = element<HTMLElement>("#dashboard");
const answerCard = element<HTMLElement>("#answer-card");
const answerTitle = element<HTMLHeadingElement>("#answer-title");
const clearDataButton = element<HTMLButtonElement>("#clear-data");
const storageNote = element<HTMLParagraphElement>("#storage-note");

let currentLocation: DaylightLocation | null = loadLocation();
let searchController: AbortController | null = null;
let refreshTimer: number | null = null;

function setSearchMessage(message: string, kind: "info" | "error" | "success" = "info"): void {
  searchState.textContent = message;
  searchState.dataset.kind = kind;
  searchState.setAttribute("role", kind === "error" ? "alert" : "status");
}

function eventCopy(
  instant: Date | null,
  snapshot: DaylightSnapshot,
  kind: "sunrise" | "sunset" | "civil-dusk" | "tomorrow-sunrise",
): { value: string; note: string } {
  if (instant) {
    return {
      value: formatLocalTime(instant, snapshot.location.timeZone),
      note: kind === "tomorrow-sunrise" ? "Ortszeit am nächsten Kalendertag" : "Ortszeit",
    };
  }

  const day = kind === "tomorrow-sunrise" ? snapshot.tomorrow : snapshot.today;
  const events = kind === "civil-dusk" ? day.civil : day.horizon;
  if (events.condition === "always-above") {
    return {
      value: kind === "civil-dusk" ? "Endet nicht" : "Kein Ereignis",
      note:
        kind === "civil-dusk"
          ? "Die Sonne bleibt über der Dämmerungsgrenze."
          : "Polartag: Die Sonne bleibt über dem Horizont.",
    };
  }
  if (events.condition === "always-below") {
    return {
      value: kind === "civil-dusk" ? "Keine Dämmerung" : "Kein Ereignis",
      note:
        kind === "civil-dusk"
          ? "Die Sonne erreicht die bürgerliche Dämmerungsgrenze nicht."
          : "Polarnacht: Die Sonne bleibt unter dem Horizont.",
    };
  }
  return {
    value: "Nicht an diesem Datum",
    note: "Das Ereignis liegt außerhalb dieses lokalen Kalendertags.",
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
    dashboard.hidden = true;
    document.body.dataset.phase = "unselected";
    return;
  }

  const snapshot = createSnapshot(currentLocation);
  dashboard.hidden = false;
  document.body.dataset.phase = snapshot.summary.phase;
  answerCard.dataset.phase = snapshot.summary.phase;
  element("#location-name").textContent = currentLocation.name;
  element("#location-context").textContent =
    currentLocation.source === "device" ? "Gerundeter Gerätestandort" : "Ausgewählter Ort";
  element("#location-detail").textContent = [
    currentLocation.context,
    formatTimeZoneLabel(snapshot.generatedAt, currentLocation.timeZone),
  ]
    .filter(Boolean)
    .join(" · ");
  answerTitle.textContent = snapshot.summary.answer;
  element("#answer-detail").textContent = snapshot.summary.detail;
  element("#answer-updated").textContent = `Aktualisiert ${formatLocalTime(
    snapshot.generatedAt,
    currentLocation.timeZone,
  )} Uhr Ortszeit`;
  element("#calculation-date").textContent = formatLocalDate(
    snapshot.localDate,
    currentLocation.timeZone,
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
    element("#calculation-date").textContent += ` · Zeitumstellung (${duration} Std.)`;
  }
  if (focusAnswer) {
    answerTitle.focus({ preventScroll: true });
    dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectLocation(location: DaylightLocation): void {
  currentLocation = location;
  const stored = saveLocation(location);
  storageNote.textContent = stored
    ? "Der gewählte Ort ist lokal für die nächste Wiederöffnung gespeichert."
    : "Lokales Speichern ist in diesem Browser nicht verfügbar; die Ansicht funktioniert trotzdem.";
  searchResults.hidden = true;
  resultsList.replaceChildren();
  setSearchMessage(`${location.name} ist ausgewählt.`, "success");
  renderSnapshot(true);
}

function renderResults(results: PlaceSearchResult[]): void {
  resultsList.replaceChildren();
  searchResults.hidden = false;
  resultsTitle.textContent =
    results.length === 1 ? "1 gefundener Ort" : `${results.length} gefundene Orte`;

  if (results.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-result";
    empty.textContent = "Kein passender Ort gefunden. Ergänze Land oder Region und versuche es erneut.";
    resultsList.append(empty);
    return;
  }

  for (const result of results) {
    const item = document.createElement("div");
    item.setAttribute("role", "listitem");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "result-button";
    const name = document.createElement("strong");
    name.textContent = result.name;
    const context = document.createElement("span");
    context.textContent = result.context;
    const type = document.createElement("small");
    type.textContent = result.osmType;
    button.append(name, context, type);
    button.addEventListener("click", () => selectLocation(toStoredLocation(result)));
    item.append(button);
    resultsList.append(item);
  }
}

function setSearching(active: boolean): void {
  searchButton.disabled = active;
  placeQuery.disabled = active;
  cancelSearchButton.hidden = !active;
  searchButton.textContent = active ? "Suche läuft …" : "Ort suchen";
}

placeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = placeQuery.value.trim();
  if (query.length < 2) {
    setSearchMessage("Bitte gib mindestens zwei Zeichen ein.", "error");
    placeQuery.focus();
    return;
  }
  searchController?.abort();
  searchController = new AbortController();
  setSearching(true);
  setSearchMessage(`Suche nach „${query}“ …`);
  searchResults.hidden = true;

  try {
    const results = await searchPlaces(query, searchController.signal);
    renderResults(results);
    setSearchMessage(
      results.length === 0
        ? "Kein Ort gefunden."
        : "Wähle den passenden Ort aus der Ergebnisliste.",
      results.length === 0 ? "error" : "success",
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      setSearchMessage("Ortssuche abgebrochen.");
    } else {
      setSearchMessage(
        navigator.onLine
          ? error instanceof Error
            ? error.message
            : "Die Ortssuche ist fehlgeschlagen."
          : "Du bist offline. Ein gespeicherter Ort funktioniert weiterhin.",
        "error",
      );
    }
  } finally {
    setSearching(false);
    searchController = null;
  }
});

cancelSearchButton.addEventListener("click", () => {
  searchController?.abort();
});

locateButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setSearchMessage(
      "Dieses Gerät bietet keine Standortfunktion. Nutze stattdessen die gleichwertige Ortssuche.",
      "error",
    );
    placeQuery.focus();
    return;
  }

  locateButton.disabled = true;
  locateButton.textContent = "Standort wird gefragt …";
  setSearchMessage("Der Browser fragt jetzt nach deiner Standortfreigabe.");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      try {
        const latitude = coarsenDeviceCoordinate(position.coords.latitude);
        const longitude = coarsenDeviceCoordinate(position.coords.longitude);
        const location: DaylightLocation = {
          id: `device-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
          name: "In deiner Nähe",
          context: "Auf etwa 1 km gerundet",
          latitude,
          longitude,
          timeZone: resolveTimeZone(latitude, longitude),
          source: "device",
        };
        selectLocation(location);
      } catch (error) {
        setSearchMessage(
          error instanceof Error ? error.message : "Der Standort konnte nicht verarbeitet werden.",
          "error",
        );
      } finally {
        locateButton.disabled = false;
        locateButton.textContent = "Standort verwenden";
      }
    },
    (error) => {
      const messages: Record<number, string> = {
        [error.PERMISSION_DENIED]:
          "Standort nicht freigegeben oder Abfrage abgebrochen. Die Ortssuche funktioniert vollständig ohne Freigabe.",
        [error.POSITION_UNAVAILABLE]:
          "Das Gerät konnte gerade keinen Standort bestimmen. Nutze die Ortssuche oder versuche es später erneut.",
        [error.TIMEOUT]:
          "Die Standortbestimmung hat zu lange gedauert. Nutze die Ortssuche oder versuche es erneut.",
      };
      setSearchMessage(messages[error.code] ?? "Die Standortbestimmung ist fehlgeschlagen.", "error");
      locateButton.disabled = false;
      locateButton.textContent = "Standort verwenden";
      placeQuery.focus();
    },
    {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 5 * 60 * 1000,
    },
  );
});

element<HTMLButtonElement>("#change-location").addEventListener("click", () => {
  element<HTMLElement>(".location-card").scrollIntoView({ behavior: "smooth", block: "start" });
  placeQuery.focus({ preventScroll: true });
});

clearDataButton.addEventListener("click", () => {
  const cleared = clearLocalData();
  currentLocation = null;
  renderSnapshot();
  storageNote.textContent = cleared
    ? "Gespeicherter Ort und Suchcache wurden vollständig gelöscht."
    : "Es waren keine zugänglichen lokalen Ortsdaten vorhanden.";
  setSearchMessage("Lokale Ortsdaten gelöscht. Du kannst jederzeit neu suchen.", "success");
  placeQuery.value = "";
  placeQuery.focus();
});

function refreshForResume(): void {
  if (document.visibilityState === "visible" && currentLocation) {
    renderSnapshot();
  }
}

document.addEventListener("visibilitychange", refreshForResume);
window.addEventListener("focus", refreshForResume);
window.addEventListener("pageshow", refreshForResume);
window.addEventListener("online", () => setSearchMessage("Wieder online.", "success"));
window.addEventListener("offline", () =>
  setSearchMessage("Offline. Gespeicherte Sonnenzeiten werden weiter lokal berechnet."),
);

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
  storageNote.textContent =
    "Dieser Browser blockiert lokale Speicherung. Die App funktioniert für die aktuelle Sitzung.";
}

renderSnapshot();
refreshTimer = window.setInterval(() => renderSnapshot(), 60_000);
window.addEventListener("beforeunload", () => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
  }
});
