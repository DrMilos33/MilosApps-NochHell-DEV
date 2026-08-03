# Gepinnte Shared-Verträge

Stand: 3. August 2026.

## `public-app-shell/v2`

| Feld | Wert |
| --- | --- |
| Contract-ID | `public-app-shell/v2` |
| Version | `2.0.3` |
| Shared-Commit | `ed898412306e22c6ae1b10ee8953df29f8acd627` |
| Shared-Tag | `public-app-shell-v2.0.3` |
| Quelle | `https://github.com/DrMilos33/MilosApps-Shared/tree/ed898412306e22c6ae1b10ee8953df29f8acd627/contracts/public-app-shell/v2` |
| Lokaler Vendor | `vendor/milosapps-shell/v2/` |
| Lock | `vendor/milosapps-shell/v2/shell-lock.json` |
| Runtime-Abhängigkeit | keine |
| Production-Freigabe | `false` |

Die Übernahme ist vollständig app-eigen. Dieses Repository importiert zur
Laufzeit keine Datei aus `MilosApps-Shared`.

Umgesetzt sind:

- normal fließende vendorte Web Component mit app-eigenem Sonnenaufgang-SVG,
  `MilosApps`, DEV-Badge, DE-/UK-Flaggen, sichtbaren DE/EN-Labels und
  `Alle Apps`/`All apps`;
- vollständige sichtbare DE-/EN-Oberfläche einschließlich dynamischer
  Sonnenzustände, Suche, Standort-, Speicher-, Offline- und Fehlermeldungen;
- Shell-Persistenz unter `milosapps.daylight.language`; das app-eigene
  Locale-Modul initialisiert zusätzlich aus `document.documentElement.lang`
  und hört auf `milosapps:localechange`;
- absolute Portal-, App-Verzeichnis-, Impressums- und Datenschutzlinks aus
  derselben expliziten DEV-Umgebung wie das DEV-Badge;
- kompakter Shell-Footer mit App-Text und Pflichtlinks; die OSM-/NOAA-
  Attribution bleibt im Daylight-Hauptinhalt sichtbar;
- 44-Pixel-Ziele, sichtbarer Fokus, Reduced Motion, 390-Pixel-Reflow und
  360 × 800 bei 200 Prozent ohne horizontalen Überlauf;
- CSP-sichere externe Same-Origin-CSS-Dateien für Shadow DOM und App-Theme,
  ohne Inline-Style, Nonce, Hash oder `unsafe-inline`;
- portabler Validator und SHA-256-Lock für Component, Shadow-CSS, Bootstrap,
  Theme-CSS und Verifier.

Die Shell-Umgebung steht kanonisch in `milos-app.json`. Der DEV-Build verwendet
`environment=dev`, absolute HTTPS-DEV-URLs und `productionApproved=false`.
Eine Production-Abbildung wird weder erzeugt noch veröffentlicht.

## `public-app-essentials/v1`

| Feld | Wert |
| --- | --- |
| Contract-ID | `public-app-essentials/v1` |
| Version | `1.1.5` |
| Shared-Commit | `2942132ad3bf6cf39edc9f52ed918de6a230be23` |
| Shared-Tag | `public-app-essentials-v1.1.5` |
| Quelle | `https://github.com/DrMilos33/MilosApps-Shared/tree/2942132ad3bf6cf39edc9f52ed918de6a230be23/contracts/public-app-essentials/v1` |
| Lokaler Vendor | `vendor/milosapps-essentials/v1/` |
| Lock | `vendor/milosapps-essentials/v1/essentials-lock.json` |
| Runtime-Abhängigkeit | keine |
| Production-Freigabe | `false` |

Daylight aktiviert den 32 × 32 Pixel großen CSS-first Startzustand, die
dauerhafte No-Cookies-Information ohne Banner oder Schließzustand, Teilen ohne
private Ortsdaten und die gemeinsame explizite Ort-/Regionssuche. Die eine
Shared-Combobox verwendet für dynamische Vorschläge die vertragliche Fähigkeit
`provider-autocomplete-direct` und schließt bei Außenklick, Escape, Auswahl,
Sprachwechsel sowie Disconnect. Datumsauswahl bleibt deaktiviert. Die
app-eigene Nominatim-Anbindung bleibt davon getrennt und behält für die
explizite Enter-/Suchen-Aktion 1,1 Sekunden Mindestabstand, Cache, Attribution,
austauschbaren Endpunkt sowie die unterschiedenen Offline-, Netzwerk-, HTTP-
und Antwortfehler. Gerätestandorte werden weiterhin vor jeder Speicherung
gerundet.

`milos-essentials.json` ist die kanonische Verbraucherdefinition. Sie bindet
den physischen Vendorpfad getrennt vom öffentlichen Same-Origin-Pfad und nennt
`src/main.ts` samt ausgeliefertem Modulpfad als tatsächlichen Verbraucher-
Einstieg. Der Sync erzeugt sechs gelockte Dateien einschließlich des vendorten
Schemas. Beide CSS-Dateien, Bootstrap und Runtime bleiben
im gebauten App-Artefakt als externe Same-Origin-Dateien unter dem Vendorpfad
erhalten; `scripts/verify-built-essentials.mjs` vergleicht die gebauten Bytes
fail-closed mit dem SHA-256-Lock. Weder CDN noch Shared-Laufzeitimport,
`data:`-Inlining oder Portal-CSP-Ausnahme werden verwendet.

Eine enge `.gitattributes` im Essentials-Vendorverzeichnis erzwingt LF für
genau diesen bytegelockten Bestand. Damit bleiben die SHA-256-Nachweise auch
nach einem Windows-Recheckout mit aktivem `core.autocrlf` reproduzierbar.

Der physische Loader-Iconpfad `public/daylight-icon.svg` und die stabile
öffentliche Same-Origin-URL `./daylight-icon.svg` sind getrennt gelockt. Der
Build- und HTTP-Nachweis prüft MIME-Typ und Bytegleichheit zur Quelldatei.

Essentials-Bootstrap ist das erste Modul im Dokument. Die App beendet den
Startzustand erst nach fachlicher Initialisierung über
`globalThis.milosAppEssentials.ready()`; ein direkter
`milosapps:ready`-Dispatch existiert nicht mehr.

## Rollback

Ein Rollback setzt Quell- und Pages-Stand auf den letzten gesunden v1-DEV-Stand
zurück. Shared selbst wird nicht verändert und erzwingt kein Deployment; der
historische v1-Pin bleibt in der zurückgesetzten App-Revision enthalten.
