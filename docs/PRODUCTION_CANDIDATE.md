# Production-Kandidat: Noch hell?

Stand: 4. August 2026

Kampagne: `public-app-production-launch-2026-08`

Autoritative Ausgangsrevision: `8401b8d34d9eed57f6ca840da3c6e34be6b2bc8a`

## Zielvertrag

| Feld | Wert |
| --- | --- |
| Provider | Cloudflare Pages, statisch |
| Vorgesehener Projektname | `milosapps-daylight-production` |
| Build | `pnpm install --frozen-lockfile && pnpm build` |
| Node | 24 oder neuer |
| Output | `dist/` |
| Functions | keine |
| Umgebung | `production` |
| Version | `1.0.0` |
| Custom Domains nach gesundem Pages-Deploy | `sinddielampenan.de`, `www.sinddielampenan.de` |

Die exakte Cloudflare-Project-ID, Pages-URL und Health-URL sind noch nicht
bestätigt. Deshalb bleibt der Kandidat lokal/release-verified und wird weder zu
Cloudflare hochgeladen noch mit den Domains verbunden. Die bestehende
reversible Porkbun-302-Weiterleitung zum unveränderten DEV bleibt bis zum
koordinierten Domain-Cutover bestehen.

## Build- und Readiness-Vertrag

`scripts/finalize-production-build.mjs` schreibt beim Build den vollständigen
Git-Commit des ausgecheckten Kandidaten in `dist/health.json`. Readiness ist
nur gültig bei:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "1.0.0",
  "environment": "production",
  "database": false,
  "productionApproved": true,
  "sourceCommit": "<exakter 40-stelliger Build-Commit>"
}
```

Cloudflare `_headers` setzt für Health `Cache-Control: no-store`. Der Service
Worker enthält Health nicht in der Precache-Liste und lässt jeden
`/health.json`-Request vollständig am Cache vorbei ins Netz. Ein beliebiger
HTTP-200 oder ein offline gespeicherter Health-Response gilt nicht als bereit.

## Provider, Datenschutz und CSP

- Open‑Meteo beantwortet sowohl dynamische Vorschläge als auch ausdrücklich
  abgesendete Suchen. Öffentliches Nominatim ist aus Production entfernt, weil
  sein globales Ein-Anfrage-pro-Sekunde-Limit statisch nicht zentral
  durchsetzbar ist.
- Die App bleibt kostenlos, werbefrei, nicht monetarisiert und damit innerhalb
  der geprüften nichtkommerziellen Open‑Meteo-Grenze. Quoten und Vertrag müssen
  vor Monetarisierung oder starkem Wachstum erneut bewertet werden.
- Die app-eigene dauerhafte Datenschutzseite liegt unter
  `/datenschutz.html`; kein Cookie- oder Schein-Consent-Banner.
- Die Response-CSP erlaubt Scripts, Styles, Bilder, Manifest und Worker nur
  Same-Origin. `connect-src` enthält ausschließlich Same-Origin und
  `https://geocoding-api.open-meteo.com`; kein `unsafe-inline`, `unsafe-eval`
  oder Nominatim-Ziel.
- Share-URLs enthalten weder Ortsnamen noch Koordinaten. Gerätestandort wird
  nur freiwillig abgefragt, vor Speicherung gerundet und nicht an den Provider
  übertragen.

## Offline- und Rollbackgrenze

Production verwendet den eigenen Cache
`milosapps.daylight.production-offline-shell.v1`; vorhandene DEV-Caches und das
DEV-Pages-Artefakt bleiben getrennt. Gespeicherte Orte öffnen offline, neue
Suchen nicht. Bei fehlerhafter Erstveröffentlichung wird das Cloudflare-Ziel
deaktiviert, der Portalroute bleibt bis zu einem gesunden Ersatz 404, und die
Porkbun-302 kann auf den vor dem Cutover dokumentierten DEV-Stand
zurückgesetzt werden. Es gibt keine Datenbankmigration.

## Noch erforderliche externe Werte

1. bestätigte Cloudflare-Account-/Project-ID für
   `milosapps-daylight-production`;
2. daraus resultierende absolute HTTPS-Pages-URL und `/health.json`;
3. erst nach erfolgreichem App-Deploy: bestätigter Domain-Cutover für Apex und
   `www` sowie Portal-Production-Route im separaten Portal-Lifecycle.

Bis diese Werte vorliegen, findet keine externe Productionmutation statt.
