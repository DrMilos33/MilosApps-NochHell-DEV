# Production-Refresh: Noch hell?

Stand: 16. August 2026

Kampagne: `public-app-production-launch-2026-08`

Autoritativer DEV-Stand: `2e3d9d2a1623a92bdcafa1035b40b08ce49623c7`

Vorheriger gesunder Production-Source:
`dc2181ae3080979d18369ba410677525119cea89`

## Zielvertrag

| Feld | Wert |
| --- | --- |
| Provider | Cloudflare Pages, statisch |
| Cloudflare Account | `98d3a05bb6d2780ec7ddf3ebf15a8c69` |
| Pages-Projekt | `milosapps-daylight-production` |
| Build | `pnpm install --frozen-lockfile && pnpm build` |
| Node | 24 oder neuer |
| Output | `dist/` |
| Functions | keine |
| Umgebung | `production` |
| Version | `1.0.1` |
| Pages-URL | `https://milosapps-daylight-production.pages.dev/` |
| Custom Domains | `https://sinddielampenan.de/`, `https://www.sinddielampenan.de/` |

Das bestehende statische Pages-Projekt, die beiden Domains und der
Direct-Upload-Lifecycle sind read-only bestätigt. Der Refresh verändert weder
Portal noch Shared-Verträge oder eine App-Datenbank. Vor dem Upload bleibt der
aktive Production-Stand unverändert.

## Build- und Readiness-Vertrag

`scripts/finalize-production-build.mjs` schreibt beim Build den vollständigen
Git-Commit des ausgecheckten Kandidaten in `dist/health.json`. Readiness ist
nur gültig bei:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "1.0.1",
  "environment": "production",
  "database": false,
  "productionApproved": true,
  "adsEnabled": false,
  "sourceCommit": "<exakter 40-stelliger Build-Commit>"
}
```

Cloudflare `_headers` setzt für Health `Cache-Control: no-store`. Der Service
Worker enthält Health nicht in der Precache-Liste und lässt jeden
`/health.json`-Request vollständig am Cache vorbei ins Netz. Ein beliebiger
HTTP-200 oder ein offline gespeicherter Health-Response gilt nicht als bereit.

## Provider, Datenschutz, Werbung und CSP

- Open‑Meteo beantwortet dynamische Vorschläge und ausdrücklich abgesendete
  Suchen. Öffentliches Nominatim ist aus Production entfernt, weil sein
  globales Ein-Anfrage-pro-Sekunde-Limit statisch nicht durchsetzbar ist.
- Die App bleibt kostenlos, nicht monetarisiert und mit `adsEnabled=false`
  innerhalb der geprüften nichtkommerziellen Open‑Meteo-Grenze. Vor Werbung,
  starkem Wachstum oder Vertragsänderung ist die Bewertung zu wiederholen.
- Die dauerhafte Datenschutzseite liegt kanonisch unter `/datenschutz`; es
  gibt kein Cookie- oder Schein-Consent-Banner.
- Die Root-`ads.txt` enthält ausschließlich die bestätigte Publisherzeile
  `google.com, pub-6713794414913834, DIRECT, f08c47fec0942fa0` für eine spätere
  Site-Verifizierung. Es gibt weiterhin keinen AdSense-/CMP-Code und keine
  Werbe-CSP-Ziele. Werbung benötigt eine separate Freigabe samt Provider-,
  Datenschutz- und Lizenzprüfung.
- `connect-src` enthält ausschließlich Same-Origin und
  `https://geocoding-api.open-meteo.com`; `unsafe-inline`, `unsafe-eval`,
  Nominatim und Werbedomains bleiben ausgeschlossen.
- Share-URLs enthalten weder Ortsnamen noch Koordinaten. Der freiwillige
  Gerätestandort wird vor Speicherung gerundet und nicht an Open‑Meteo gesendet.

## Suchmaschinen-Readiness

Das gebaute Dokument enthält bereits vor JavaScript-Ausführung eine
aussagekräftige Überschrift, die Daylight-Funktion, den Standardort Köln und
die Grenzen ohne Konto, Tracking oder Werbung. Root und Datenschutz besitzen
Self-Canonical-URLs. `robots.txt` erlaubt Crawling und verweist auf die eigene
`sitemap.xml` mit ausschließlich kanonischen HTTPS-URLs. `ads.txt` wird für
cookie-lose GET- und HEAD-Anfragen exakt und als `text/plain` ausgeliefert.

## Offline- und Rollbackgrenze

Production verwendet den eigenen Cache
`milosapps.daylight.production-offline-shell.v2`; DEV-Caches und das
DEV-Pages-Artefakt bleiben getrennt. Gespeicherte Orte öffnen offline, neue
Suchen nicht. Unmittelbare Rollbackgrenze ist der beim Audit aktive Deployment
`bef2c73a-c3ab-41db-aeb3-465ba17e6bde` (Source `dc2181ae…`). Als zusätzlich
verfügbarer vorheriger Pages-Rollback ist
`9aa38e45-70b6-4daa-9456-81e7005d993b` dokumentiert. Es gibt keine
Datenbankmigration.
