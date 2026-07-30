# QA-Bericht: Noch hell?

Stand: 30. Juli 2026  
Branch: `codex/daylight-dev`  
Implementierungsmeilenstein: `2b5ffe7`  
Erweiterte QA-Matrix: `a259a5f`
DEV-Vertrag und Übergabe: `8071fe2`
Shared-Vertrag: `public-app-shell/v1` aus Shared-Commit
`f49b2c2b5bf1071f2f1ffb3e24b877251fffd2b4`

## Ergebnis

Der lokale DEV-Stand erfüllt den freigegebenen Produktumfang. Zwei
Miteinander-Product-QA-Runden wurden nach dem ersten lauffähigen Stand
durchgeführt, gefundene Fehler wurden behoben und durch Regressionstests
abgesichert. Production und fremde Repositories blieben unverändert.

## Automatisierte Abschlussmatrix

| Prüfung | Ergebnis | Abdeckung |
| --- | --- | --- |
| `pnpm test` | 24 bestanden | Astronomie, Tageslichtlogik, Zeitzonen, Geocoding, Speicherung, DE/EN und Umgebungslinks |
| `pnpm build` | bestanden | TypeScript und Produktionsbundle |
| `pnpm test:e2e` | 84 bestanden, 15 übersprungen | Chromium Desktop, Firefox Desktop, Pixel-7-Profil |
| `pnpm verify:dev` | bestanden | App-Key-Readiness und strikter Portkollisionsabbruch |
| axe-core | keine automatisiert erkennbaren Verstöße | Start- und Ergebnisfluss |
| Ressourcenbudget | bestanden | unter 180 DOM-Elementen und 300 kB Transfer im geprüften Startzustand |

Das Bundle nach der Shell-Integration umfasst ungefähr 113,9 kB JavaScript
(43,9 kB gzip) und 14,0 kB CSS (4,0 kB gzip).

Die fünfzehn übersprungenen Fälle sind bewusst auf passende Projekte begrenzte
Browser-Simulationen: Geolocation-Berechtigungen, lokales Löschen/Suchcache,
langsamer Request-Abbruch, Service-Worker-Offlinebetrieb und künstliche
Uhr-/Resume-Wechsel sowie die einmalige explizite
Desktop-Fokus-/Viewportgeometrie. Die fachlichen Chromium-Fälle liefen jeweils
in Desktop- und Mobil-Chromium. Kernfluss, astronomische Oberfläche, Tastatur, Reflow,
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

## Runde 3: `public-app-shell/v1` und vollständige Lokalisierung

Der erste lauffähige app-eigene Shell-Stand übernahm den gepinnten
Shared-Vertrag ohne Runtime-Import. Ergänzt wurden:

- eigenes 38-Pixel-SVG, `MilosApps`, DEV-Badge und absolute DEV-Links;
- vollständige DE-/EN-UI einschließlich Suche, Ortstypen, Ereigniskarten,
  Polartag/-nacht, Speicher-, Standort-, Offline- und Fehlermeldungen;
- lokale Sprachpersistenz unter `milosapps.daylight.language` und DE-Fallback
  für beschädigte oder nicht unterstützte Werte;
- sprachgetrennte Geocoding-Caches und `Accept-Language` für neue Suchen;
- semantischer kompakter Footer mit Attribution, Impressum, Datenschutz und
  MilosApps.

Der fokussierte Chromium-Lauf bestand nach der ersten Korrektur mit 7/7
Shell-Fällen. Die visuelle Prüfung bei 1440 × 900 und 390 × 844 bestätigte
Überlauffreiheit, 44-Pixel-Ziele und sichtbaren Fokus. Das erste SVG wirkte in
kleiner Darstellung eher wie eine Person; es wurde zu einer eindeutigeren
Sonnenaufgang-Geometrie geändert.

## Runde 4: Cross-Browser, Fokus und Wiederholung

Die vollständige Matrix erweiterte sich auf 99 E2E-Fälle. Ein
nondeterministischer Teststart konnte die erste Tab-Position vom vorherigen
Browserfokus abhängig machen. Der Regressionstest setzt den Ausgangsfokus nun
explizit zurück und bestand anschließend dreimal parallel sowie in der
vollständigen Matrix.

Der Abschlusslauf bestätigt 24/24 Unit-Tests, den Build sowie 84 ausgeführte
E2E-Fälle bei 15 dokumentierten Projektskips. Die englische Ergebnisansicht
wurde zusätzlich mit einer echten Berlin-Suche geprüft: Nominatim antwortete
englisch, vier Ereigniskarten waren sichtbar, die URL blieb frei von
Koordinaten und die Seite ohne horizontalen Überlauf.

## Runde 5: Externe Service-Worker- und Netzgrenze

Der erste externe 0.2-Kandidat bestand Health, Direktaufruf, echte
Berlin-Suche und Offline-Wiederöffnung. Beim Versuch einer neuen Suche im
offline wiedereröffneten Chromium-Kontext blieb `navigator.onLine` jedoch
unerwartet wahr. Die App zeigte dadurch die zu allgemeine Meldung
„Ortssuche fehlgeschlagen“.

Die Geocoding-Schicht liefert für Fetch-Netzfehler nun einen eigenen
sprachneutralen Zustand. DE und EN erklären ausdrücklich, dass eine neue
Ortssuche eine erreichbare Netzwerkverbindung braucht, während der
gespeicherte Ort weiter funktioniert. Ein automatisierter externer
Desktop-/390-Pixel-Smoke reproduziert diese Grenze künftig gegen die echte
HTTPS-DEV-URL.

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
| DE / EN und Persistenz | gesamte sichtbare UI, Reload und dynamische Zustände bestanden |
| Header / Footer / Umgebungslinks | semantisch, absolut, DEV-/Production-getrennt und überlauffrei |

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
`e31603a9f0fb532bf0accaa2a97b62f398785a2f` erzeugte Pages-Revision
`269faf8611fc17777af997eea846fc20cbaf4238` direkt unter
`https://drmilos33.github.io/MilosApps-NochHell-DEV/` geprüft.

| Prüfung | Ergebnis |
| --- | --- |
| Startseite und `/health.json` | HTTP 200 über HTTPS |
| Health-Inhalt | exakt `status=ready`, `appKey=daylight`, `version=0.2.0`, `environment=dev`, `database=false` |
| Frischer Desktop-Chromium-Kontext | 1440 × 900, echte Live-Suche „Berlin“, Auswahl und vier Ereigniskarten bestanden |
| Frischer Smartphone-Kontext | 390 × 844, kein horizontaler Überlauf |
| Sprache | vollständige Umschaltung DE/EN und Persistenz nach Reload bestanden |
| Offline-Grenze | gespeicherter Ort öffnet offline; neue Suche erklärt die fehlende Netz-Erreichbarkeit |
| Authentifizierung | Kontext ohne `storageState`, kein Redirect und keine Login- oder Kontooberfläche |
| Datenschutz | keine Koordinaten oder Suchparameter in der App-URL |
| Konsole | keine unerwarteten Fehler; der absichtlich provozierte Browser-Netzfehler wird separat erkannt |

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
| Shell-Revalidierung | unveränderte Route nach 0.2-Deploy erneut read-only bei 1440 × 900 und 390 × 844 ohne Überlauf geprüft |
| Production-Grenze | Karte nicht sichtbar; Production unverändert |
| Repository-Grenze | Portal-Task änderte das App-Repository nicht |

Der zugehörige GitHub-Actions-Lauf startete wegen eines
Billing-/Spending-Limits keinen einzigen Step. Die Portalprüfung stützte sich
deshalb auf den aktiven Railway-Stand und grüne lokale Portaltests. Dieser
externe CI-Infrastrukturfehler ändert weder App-Readiness noch den bestätigten
Portal-DEV-Redirect.
