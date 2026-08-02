# Gepinnte Shared-Verträge

Stand: 1. August 2026.

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
| Version | `1.0.0` |
| Shared-Commit | `b09e09008ff05fe87f05bc647a7c4964ff13e6f6` |
| Shared-Tag | `public-app-essentials-v1.0.0` |
| Quelle | `https://github.com/DrMilos33/MilosApps-Shared/tree/b09e09008ff05fe87f05bc647a7c4964ff13e6f6/contracts/public-app-essentials/v1` |
| Lokaler Vendor | `vendor/milosapps-essentials/v1/` |
| Lock | `vendor/milosapps-essentials/v1/essentials-lock.json` |
| Runtime-Abhängigkeit | keine |
| Production-Freigabe | `false` |

Daylight aktiviert den kleinen CSS-first Startzustand, den wahrheitsgemäßen
No-Cookies-Hinweis mit lokaler Schließpersistenz, Teilen ohne private
Ortsdaten und die gemeinsame explizite Ort-/Regionssuche. Datumsauswahl bleibt
deaktiviert. Die app-eigene Nominatim-Anbindung behält 1,1 Sekunden
Mindestabstand, Cache, Attribution, austauschbaren Endpunkt sowie die
unterschiedenen Offline-, Netzwerk-, HTTP- und Antwortfehler. Gerätestandorte
werden weiterhin vor jeder Speicherung gerundet.

`milos-essentials.json` ist die kanonische Verbraucherdefinition. Der Sync
erzeugt fünf gelockte Dateien. Beide CSS-Dateien, Bootstrap und Runtime bleiben
im gebauten App-Artefakt als externe Same-Origin-Dateien unter dem Vendorpfad
erhalten; `scripts/verify-built-essentials.mjs` vergleicht die gebauten Bytes
fail-closed mit dem SHA-256-Lock. Weder CDN noch Shared-Laufzeitimport,
`data:`-Inlining oder Portal-CSP-Ausnahme werden verwendet.

## Rollback

Ein Rollback setzt Quell- und Pages-Stand auf den letzten gesunden v1-DEV-Stand
zurück. Shared selbst wird nicht verändert und erzwingt kein Deployment; der
historische v1-Pin bleibt in der zurückgesetzten App-Revision enthalten.
