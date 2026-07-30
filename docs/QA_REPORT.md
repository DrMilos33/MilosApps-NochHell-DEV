# QA-Bericht: Noch hell?

Stand: 30. Juli 2026  
Branch: `codex/daylight-dev`  
Implementierungsmeilenstein: `2b5ffe7`  
Erweiterte QA-Matrix: `a259a5f`
DEV-Vertrag und Übergabe: `8071fe2`

## Ergebnis

Der lokale DEV-Stand erfüllt den freigegebenen Produktumfang. Zwei
Miteinander-Product-QA-Runden wurden nach dem ersten lauffähigen Stand
durchgeführt, gefundene Fehler wurden behoben und durch Regressionstests
abgesichert. Production und fremde Repositories blieben unverändert.

## Automatisierte Abschlussmatrix

| Prüfung | Ergebnis | Abdeckung |
| --- | --- | --- |
| `pnpm test` | 20 bestanden | Astronomie, Tageslichtlogik, Zeitzonen, Geocoding, Speicherung |
| `pnpm build` | bestanden | TypeScript und Produktionsbundle |
| `pnpm test:e2e` | 68 bestanden, 10 übersprungen | Chromium Desktop, Firefox Desktop, Pixel-7-Profil |
| `pnpm verify:dev` | bestanden | App-Key-Readiness und strikter Portkollisionsabbruch |
| axe-core | keine automatisiert erkennbaren Verstöße | Start- und Ergebnisfluss |
| Ressourcenbudget | bestanden | unter 180 DOM-Elementen und 300 kB Transfer im geprüften Startzustand |

Das Produktionsbundle der zweiten Runde umfasst ungefähr 97,0 kB JavaScript
(39,2 kB gzip) und 12,4 kB CSS (3,7 kB gzip).

Die zehn übersprungenen Fälle sind bewusst auf Chromium begrenzte
Browser-Simulationen: Geolocation-Berechtigungen, lokales Löschen/Suchcache,
langsamer Request-Abbruch, Service-Worker-Offlinebetrieb und künstliche
Uhr-/Resume-Wechsel. Diese Fälle liefen jeweils in Desktop- und
Mobil-Chromium. Kernfluss, astronomische Oberfläche, Tastatur, Reflow,
Farbschemata, Konsolenfreiheit, Ressourcenbudget und axe liefen zusätzlich in
Firefox.

## Runde 1: Funktion, Zustände und Datenschutz

Erste valide Matrix auf dem app-spezifischen Port 4319: 42 bestanden,
9 bewusst übersprungen.

Bestätigte und behobene Defekte:

1. Ein früher Lauf auf Port 4173 traf eine fremde App und erzeugte wertlose
   Ergebnisse. DEV und E2E wurden auf den reservierten Port 4319 mit
   `strictPort`, deaktivierter Serverwiederverwendung und App-Key-Prüfung
   umgestellt. Kein fremder Server wurde beendet.
2. Hinweise in der Ereignisliste verwendeten ungültige Kinder innerhalb eines
   `<dl>`. Sie wurden als semantische `<dd>`-Elemente umgesetzt.
3. Die Service-Worker-Registrierung konnte ein bereits vergangenes
   `load`-Ereignis verpassen. Die Registrierung berücksichtigt nun den
   aktuellen Dokumentzustand; der Offline-Regressionsfall ist grün.
4. Zwei Ergebnisformulierungen erzeugten einen doppelten Punkt. Die Textlogik
   wurde bereinigt.

## Runde 2: Grenzfälle, Reflow und Robustheit

Die Matrix wurde um 26 Fälle erweitert und vollständig erneut ausgeführt:
68 bestanden, 10 bewusst übersprungen.

Zusätzlich bestätigt:

- USNO-nahe Zeiten am Äquator und beide Berliner Zeitumstellungstage;
- Polartag in Tromsø sowie tiefe Polarnacht ohne bürgerliche Dämmerung in
  Longyearbyen;
- lokales Datum über den internationalen Datumssprung;
- keine Konsolen- oder Seitenfehler im Hauptfluss;
- helle und dunkle Systemdarstellung;
- wiederholte manuelle Suche aus dem lokalen Cache;
- Smartphone-Reflow bei 390 × 844, Desktopdarstellung und
  200-Prozent-äquivalente schmale Breite ohne horizontales Scrollen.

Eine fehlerhafte E2E-Erwartung von 17:59 Uhr wurde auf die USNO-Referenz
18:00 Uhr korrigiert; die App-Berechnung war korrekt.

## Nutzungsmatrix

| Szenario | Ergebnis |
| --- | --- |
| Manuelle Ortssuche / Geräteortung | gleichwertige Ergebnisansicht, kein Login |
| Erlaubt / verweigert / abgebrochen / nicht verfügbar / Timeout | bestanden |
| Unbekannter / gleichnamiger Ort | verständlicher Leerzustand / eindeutiger Kontext |
| Polartag / Polarnacht / keine bürgerliche Dämmerung | keine erfundenen Zeiten |
| Sommerzeit 23/25 Stunden | Ortsdatum und Tageslänge sichtbar korrekt |
| Mitternacht / App-Resume über Sonnenuntergang und Dämmerungsende | Ansicht aktualisiert |
| Langsames Geocoding / Abbruch | Status sichtbar, Abbruch wirksam |
| Offline-Wiederöffnung | gespeicherter Ort und App-Shell verfügbar |
| Tastatur / Fokus | Kernfluss vollständig bedienbar |
| Screenreader-Semantik | Landmarken, Überschriften, Live-Status und Definitionen geprüft |
| 200-Prozent-Reflow | kein horizontaler Dokumentüberlauf |
| Mobil / Desktop | automatisiert und visuell geprüft |

## Verbleibende Grenzen

- Kein manueller Test mit echter NVDA-, JAWS- oder VoiceOver-Sprachausgabe;
  geprüft wurden der semantische Browserbaum, zugängliche Namen, Fokusablauf
  und axe-core.
- `tz-lookup` ist nahe Zeitzonengrenzen eine Approximation.
- Die öffentliche Nominatim-Instanz ist ein austauschbarer externer
  DEV-Dienst mit eigener Verfügbarkeit und Nutzungsrichtlinie.

## Freigabeempfehlung

Der unabhängige HTTPS-DEV-Stand ist freigabefähig. Portal & Identity hat URL,
Redirect und Darstellung im Portal-DEV am 30. Juli 2026 final validiert.
Production bleibt gesperrt.

## Externe DEV-Verifikation

Am 30. Juli 2026 wurde die aus
`f4ee359367f9b89766976a627bc6b9a82719f89f` erzeugte Pages-Revision
`2735413d04d1a300fc67424f3e2e50f3ea0d93e0` direkt unter
`https://drmilos33.github.io/MilosApps-NochHell-DEV/` geprüft.

| Prüfung | Ergebnis |
| --- | --- |
| Startseite und `/health.json` | HTTP 200 über HTTPS |
| Health-Inhalt | `status=ready`, `appKey=daylight`, `environment=dev`, `database=false` |
| Frischer Desktop-Chromium-Kontext | Live-Suche „Berlin“, Auswahl und vier Ereigniskarten bestanden |
| Frisches Pixel-7-Profil | 412 px breit, kein horizontaler Überlauf |
| Offline-Grenze einer neuen Suche | „Du bist offline. Ein gespeicherter Ort funktioniert weiterhin.“ |
| Authentifizierung | null Cookies, keine Login- oder Kontooberfläche |
| Datenschutz | keine Koordinaten oder Suchparameter in der App-URL |
| Konsole | keine Fehler im normalen Online-Hauptfluss |

Der direkte Aufruf benötigt weder Portal-Cookie noch Milos-Login. Die
Online-Ortssuche bleibt bewusst eine externe Netzfunktion; lokale Berechnung
und gespeicherter Ort sind davon getrennt.

## Portal-DEV-Finalabnahme

Portal & Identity bestätigte am 30. Juli 2026:

| Prüfung | Ergebnis |
| --- | --- |
| Portalübersicht `/apps` | Karte „Noch hell?“ sichtbar |
| Route `/apps/daylight` | Redirect auf die unabhängige HTTPS-DEV-URL korrekt |
| Portal-DEV-Revision | Integrationscommit `eab551a`, direkter Vorgänger des aktiven Railway-Stands `e74bc712` |
| Portal-Smoke | Direktaufruf, Desktop und 390 Pixel ohne Login, Browserfehler oder Überlauf |
| Production-Grenze | Karte nicht sichtbar; Production unverändert |
| Repository-Grenze | Portal-Task änderte das App-Repository nicht |

Der zugehörige GitHub-Actions-Lauf startete wegen eines
Billing-/Spending-Limits keinen einzigen Step. Die Portalprüfung stützte sich
deshalb auf den aktiven Railway-Stand und grüne lokale Portaltests. Dieser
externe CI-Infrastrukturfehler ändert weder App-Readiness noch den bestätigten
Portal-DEV-Redirect.
