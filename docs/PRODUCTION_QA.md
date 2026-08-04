# Production-QA: Noch hell? 1.0.0

Stand: 4. August 2026  
Branch: `codex/daylight-production-candidate`  
Teststufe: `full`

## Lokales Release-Gate

| Gate | Ergebnis |
| --- | --- |
| Public App Shell | PASS; `public-app-shell/v2.0.3` @ `ed898412306e22c6ae1b10ee8953df29f8acd627`, Production-Konfiguration und 5er-Lock |
| Public App Essentials | PASS; `public-app-essentials/v1.1.5` @ `2942132ad3bf6cf39edc9f52ed918de6a230be23`, Production-Konfiguration und 6er-Lock |
| Unit-/Fachtests | 32/32 PASS |
| Production-Build | PASS; TypeScript, Vite, kein Sourcemap, externe Same-Origin-Assets, Icon- und Lock-Hashes |
| Browsermatrix | 127 PASS, 32 bewusst profilgebundene Skips, 0 Fehler; Chromium, Firefox, mobile Chromium |
| Production-Vertrag | PASS; Port 4319 strict, App-Identität, 1.0.0, Production=true, exakter 40-stelliger Build-Source-SHA |
| Provider-Smoke | PASS; Open‑Meteo HTTP 200, `Access-Control-Allow-Origin: *`, IANA-Zeitzone mit Origin `https://sinddielampenan.de` |
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

## Noch ausstehend

Der echte Windows-Recheckout mit `core.autocrlf=true` wird auf dem finalen
lokalen Kandidatencommit wiederholt, weil Manifest, Vendorbootstrap und Locks
geändert wurden. Externe Cloudflare-, Domain- und No-Login-Prüfungen bleiben
bis zur bestätigten Project-ID absichtlich offen; sie dürfen nicht durch eine
erfundene URL ersetzt werden.
