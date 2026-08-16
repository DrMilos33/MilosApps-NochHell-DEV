# Production-QA: Noch hell? 1.0.1

Stand: 16. August 2026

Branch: `codex/daylight-production-refresh`

Teststufe: `full`

## Lokales Release-Gate

| Gate | Ergebnis |
| --- | --- |
| Public App Shell | PASS; `public-app-shell/v2.0.3` @ `ed898412306e22c6ae1b10ee8953df29f8acd627`, Production-Konfiguration und 5er-Lock |
| Public App Essentials | PASS; `public-app-essentials/v1.1.5` @ `2942132ad3bf6cf39edc9f52ed918de6a230be23`, Production-Konfiguration und 6er-Lock |
| Unit-/Fachtests | 32/32 PASS |
| Production-Build | PASS; TypeScript, Vite, kein Sourcemap, externe Same-Origin-Assets, Icon- und Lock-Hashes |
| Browsermatrix | 128 PASS, 34 bewusst profilgebundene Skips, 0 Fehler; Chromium, Firefox, mobile Chromium |
| Production-Vertrag | PASS; Port 4319 strict, App-Identität, 1.0.1, Production=true, Ads=false, exakter 40-stelliger Build-Source-SHA |
| Provider-Smoke | PASS; Open‑Meteo HTTP 200, `Access-Control-Allow-Origin: *`, IANA-Zeitzone mit Origin `https://sinddielampenan.de` |
| Windows-Frischcheckout | PASS auf `1e15349b4ee067a6fd569e16f1fd51fa3e99d915`; `core.autocrlf=true`, beide Vendorbestände und das Loader-SVG `i/lf w/lf`, Verifier, Build, 32 Fachtests und Source-/Build-SVG-SHA grün |
| Diff | `git diff --check` PASS |

Die Browsermatrix umfasst:

- NOAA-/USNO-nahe Sonnenzeiten, Äquator, Polartag, Polarnacht;
- beide Berliner DST-Tage, Mitternacht und internationalen Datumssprung;
- Standardort Köln, dynamische Vorschläge, abgesendete Suche, gleichnamige und
  unbekannte Orte, Cache, Abort und verspätete Providerantwort;
- freiwillige Ortung erlaubt/verweigert/abgebrochen/Timeout und Rundung vor
  Speicherung;
- Offline-Wiederöffnung und App-Resume über Sonnenuntergang,
  Dämmerungsende sowie Mitternacht;
- network-only `/health.json`, eigene Production-Cache-ID und fehlende neue
  Offline-Suche;
- vollständiges DE/EN mit Reload-Persistenz, Tastatur, Fokus, Axe, 44-Pixel-
  Ziele und Reduced Motion;
- Desktop, 390 × 844 sowie 360 × 800 bei 200 Prozent ohne horizontalen
  Überlauf;
- echte Response-CSP mit ausschließlich Same-Origin-Runtime und Open‑Meteo in
  `connect-src`, kein `unsafe-inline`, `unsafe-eval` oder Nominatim;
- app-eigene Datenschutzseite, Loader 32 × 32, Shell-Icon 38 × 38 und
  MIME-/Hash-Gates.

Zusätzliche Build-Gates prüfen crawlbaren Initialinhalt, Root-/Datenschutz-
Canonical, `robots.txt`, `sitemap.xml`, die exakte Publisherzeile in
`ads.txt`, fehlende Werbeskripte und eine CSP ohne Werbe- oder Trackingziele.

## Externe Production-Verifikation

| Feld | Ergebnis |
| --- | --- |
| Source | `1e15349b4ee067a6fd569e16f1fd51fa3e99d915` |
| Cloudflare Deployment | `3f07fc31-cb7f-46ef-b525-055871e4ce00` |
| Eindeutige URL | `https://3f07fc31.milosapps-daylight-production.pages.dev/` |
| Custom Domain | `https://sinddielampenan.de/` |
| Health | HTTP 200, `ready/daylight/1.0.1/production`, `database=false`, `productionApproved=true`, `adsEnabled=false`, exakter Source-SHA |
| Browser | eindeutige URL und Apex jeweils PASS: No-Login, DE/EN+Reload, 1440 × 900, 390 × 844, 360 × 800 bei 200 Prozent, Provider, Outside-Click, Offline-Wiederöffnung und network-only Health |
| CSP/MIME | strikte Same-Origin-CSP plus ausschließlich Open‑Meteo in `connect-src`; Icon SVG bytegleich; keine CSP-/Browserfehler |
| SEO | crawlbarer Initialinhalt, Root-/Datenschutz-Canonical, `robots.txt` und `sitemap.xml` extern HTTP 200 |
| Ads | `adsEnabled=false`, keine Ad-/CMP-Skripte oder Werbe-CSP-Ziele; cookie-lose GET+HEAD `/ads.txt` HTTP 200 `text/plain`, exakte bestätigte Publisherzeile |
| Domains | HTTP Apex 301 auf HTTPS Apex; HTTPS `www` 301 auf HTTPS Apex; HTTP `www` 301 auf HTTPS `www` und anschließend Apex |

Cloudflare hatte beim ersten Upload `9d4a6272…` Web Analytics automatisch
injiziert; die strikte CSP blockierte den Beacon und das No-Tracking-Gate
meldete den Fehler. `web_analytics_tag` und `web_analytics_token` wurden im
Daylight-Pages-Projekt auf `null` gesetzt und dasselbe Source-Artefakt erneut
bereitgestellt. Nur `3f07fc31…` gilt als gesund. Unmittelbarer Rollback ist
`bef2c73a-c3ab-41db-aeb3-465ba17e6bde` mit Source `dc2181ae…`; zusätzlich
bleibt `9aa38e45-70b6-4daa-9456-81e7005d993b` verfügbar.
