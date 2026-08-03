# QA-Bericht: Noch hell?

Stand: 1. August 2026
Branch: `codex/daylight-dev`  
Implementierungsmeilenstein: `2b5ffe7`  
Erweiterte QA-Matrix: `a259a5f`
DEV-Vertrag und Übergabe: `8071fe2`
Shared-Vertrag: `public-app-shell/v2.0.3` aus Shared-Commit
`ed898412306e22c6ae1b10ee8953df29f8acd627`

## Ergebnis

Der lokale DEV-Stand erfüllt den freigegebenen Produktumfang. Zwei
Miteinander-Product-QA-Runden wurden nach dem ersten lauffähigen Stand
durchgeführt, gefundene Fehler wurden behoben und durch Regressionstests
abgesichert. Production und fremde Repositories blieben unverändert.

## Automatisierte Abschlussmatrix

| Prüfung | Ergebnis | Abdeckung |
| --- | --- | --- |
| `pnpm verify:shell` | bestanden | Manifest, v2.0.3-Pin, fünf vendorte Artefakte, Hashes, Lock, HTML-Slots und Locale-Modul |
| `pnpm test` | 22 bestanden | Astronomie, Tageslichtlogik, Zeitzonen, Geocoding, Speicherung und DE/EN-Fachtexte |
| `pnpm build` | bestanden | TypeScript und Produktionsbundle |
| `pnpm test:e2e` | 85 bestanden, 23 übersprungen | Chromium Desktop, Firefox Desktop, Pixel-7-Profil; 108 Fälle gesamt |
| `pnpm verify:dev` | bestanden | App-Key-Readiness und strikter Portkollisionsabbruch |
| axe-core | keine automatisiert erkennbaren Verstöße | Start- und Ergebnisfluss |
| Ressourcenbudget | bestanden | unter 180 DOM-Elementen und 300 kB Transfer im geprüften Startzustand |

Das Bundle nach der kompakten 0.3.1-Überarbeitung umfasst 117,97 kB JavaScript
(45,93 kB gzip), 11,41 kB App-CSS (3,47 kB gzip), 5,47 kB externe
Shell-CSS (1,55 kB gzip) und 0,40 kB externe Theme-CSS (0,20 kB gzip).

Die dreiundzwanzig übersprungenen Fälle sind bewusst auf passende Projekte
begrenzte Browser-Simulationen: Geolocation-Berechtigungen, lokales Löschen/Suchcache,
langsamer Request-Abbruch, Service-Worker-Offlinebetrieb und künstliche
Uhr-/Resume-Wechsel sowie die einmalige explizite
Desktop-Fokus-/Viewport- und Dichtegeometrie. Die fachlichen Chromium-Fälle liefen jeweils
in Desktop- und Mobil-Chromium. Kernfluss, astronomische Oberfläche, Tastatur, Reflow,
Farbschemata, Konsolenfreiheit, Ressourcenbudget und axe liefen zusätzlich in
Firefox. Fünf zusätzliche Shell-Geometrie-/Reduced-Motion-/CSP-Fälle laufen
absichtlich nur einmal in Desktop-Chromium.

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

## Runde 6: vendorte `public-app-shell/v2.0.2`

Die v1-Doppelimplementierung von Header, Footer, Sprachspeicher und
Umgebungslinks wurde durch den exakt gepinnten, app-eigen vendorten v2-Block
ersetzt. `milos-app.json`, generierter Bootstrap, Web Component, portabler
Verifier und `shell-lock.json` bilden eine reproduzierbare Einheit ohne
Shared-Runtimeimport.

Der erste fokussierte Chromium-Lauf fand zwei Abweichungen:

1. Der normale Daylight-Akzent erreichte am kleinen DEV-Badge auf dem hellen
   Shell-Hintergrund nur 3,57:1. Die Shell verwendet nun den bereits
   vorhandenen dunkleren App-Akzent; beide DE-/EN-Axe-Läufe sind grün.
2. Chromium serialisierte die verlangten `0.01ms` für Reduced Motion als
   `1e-05s`. Der Test prüft jetzt den numerischen Grenzwert statt ein einzelnes
   Darstellungsformat.

Anschließend bestanden der portable Verifier, 22/22 Units, Build sowie 83
ausgeführte E2E-Fälle in der vollständigen Drei-Browser-Matrix. Die zusätzliche
visuelle Browserprüfung bestätigte Desktop und 390 × 844 ohne Überlauf,
mindestens 44 Pixel große Shellziele, bündigen Footer, leere Warn-/Fehlerkonsole
und DE/EN-Persistenz. Der separate Chromium-Regressionsfall bestätigte
360 × 800 bei 200 Prozent Textskalierung ohne horizontalen Überlauf.

## Runde 7: strikte CSP mit `public-app-shell/v2.0.3`

Ein echter Response-CSP-Test mit `default-src 'self'; script-src 'self';
style-src 'self'` belegte, dass v2.0.2 die Shell- und Theme-Styles noch inline
einbrachte. Ohne CSP-Lockerung fiel die Web Component deshalb auf
Browser-Defaults zurück. Der zentral veröffentlichte v2.0.3-Patch liefert
Shadow- und Theme-CSS als app-eigene Same-Origin-Dateien.

Vite wollte die kleinen CSS-Dateien zunächst als `data:`-URLs einbetten, die
von `style-src 'self'` ebenfalls korrekt abgelehnt werden. Der App-Build setzt
deshalb `assetsInlineLimit: 0` und bewahrt die externen Styles auch im Bundle.
Der gezielte Chromium-Fall bestätigt Host-Grid, Marken-Flexlayout,
Daylight-Themefarbe, 44-Pixel-Steuerung und eine leere CSP-Fehlerkonsole. Die
abschließende Vollmatrix bestätigte 22/22 Unit-Tests, den Build sowie 84
ausgeführte E2E-Fälle bei 21 dokumentierten Projektskips. `pnpm verify:dev`
bestätigte zusätzlich App-Key-Readiness und den strikten Portabbruch. Der
anschließende externe DEV-Nachweis bestätigte denselben CSP-Vertrag mit den
wirklich veröffentlichten, app-eigenen CSS-URLs und leerer Fehlerkonsole.

## Runde 8: schlankere Informationshierarchie

Die visuelle Baseline bestätigte den Nutzerbefund: Bei 1440 × 900 belegte das
Intro 606 Pixel Höhe, die Überschrift allein 309 Pixel und die Ortswahl begann
erst bei 675 Pixel. Die gesamte gespeicherte Berlin-Ansicht war 2662 Pixel
hoch. Nudelrechner, Himmel und Welcher Müll wurden read-only als
Dichtereferenz geprüft; ihre Arbeitsüberschriften und oberen Abstände sind
deutlich zurückhaltender.

Die erste Verbesserungsrunde reduzierte die maximale Einstiegsüberschrift von
6,7 auf 3,45 rem, die Introabstände, die 31-rem-Antwortfläche und die
11-rem-Ereigniskarten. Suche und Geräteortung liegen nicht länger in zwei
zusätzlichen verschachtelten Karten. Der fokussierte Chromium-Lauf bestand
anschließend mit 36/36 Fällen.

Die zweite Runde senkte die Überschrift weiter auf maximal 3,15 rem und auf
390 Pixel Breite auf 2,05 rem. Suchfeld und kompakter Suchknopf bleiben dort
in einer Zeile; unter 23 rem brechen sie weiterhin sicher um. Das mobile Intro
misst nun 216 Pixel, die vollständige Ortswahl 369 Pixel und die Seite mit
gespeichertem Berlin 2169 statt zuvor deutlich über 2300 Pixel. Desktop und
Mobile bleiben ohne horizontalen Überlauf; die Bedienziele bleiben mindestens
44 Pixel groß.

Ein neuer Geometrie-Regressionsfall begrenzt Intro, Schriftgröße,
Ortswahlposition, Antwortfläche und Ereigniskarten bewusst. Die abschließende
Drei-Browser-Matrix bestätigt zusätzlich DE/EN mit Reload-Persistenz,
Tastatur/Fokus, 360 × 800 bei 200 Prozent, Reduced Motion, strikte CSP,
Offline-/Netzgrenzen sowie sämtliche astronomischen und Standortzustände.

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
cookie-losen GET-/HEAD-Redirect und Health am 1. August 2026 auf dem aktiven
Portal-Stagingstand final validiert. Production bleibt gesperrt.

## Externe DEV-Verifikation

Am 1. August 2026 wurde die aus
`97efdc563e70c01ea4ae31f0d097df111e99e645` erzeugte Pages-Revision
`53acdf37d08fdb0a21881119d35b6d7bfe390394` direkt unter
`https://drmilos33.github.io/MilosApps-NochHell-DEV/` geprüft.

| Prüfung | Ergebnis |
| --- | --- |
| Startseite und `/health.json` | HTTP 200 über HTTPS |
| Health-Inhalt | exakt `status=ready`, `appKey=daylight`, `version=0.3.0`, `environment=dev`, `database=false` |
| Frischer Desktop-Chromium-Kontext | 1440 × 900, echte Live-Suche „Berlin“, Auswahl und vier Ereigniskarten bestanden |
| Frischer Smartphone-Kontext | 390 × 844, kein horizontaler Überlauf |
| Strikte CSP-Runtime | `default-src 'self'; script-src 'self'; style-src 'self'`; beide CSS-URLs Same-Origin, Host-Grid, 44 px, Themefarbe, null Fehler |
| 200-Prozent-Reflow | 360 × 800, externe Shell vollständig gestaltet, kein horizontaler Überlauf |
| Sprache | vollständige Umschaltung DE/EN und Persistenz nach Reload bestanden |
| Offline-Grenze | gespeicherter Ort öffnet offline; neue Suche erklärt die fehlende Netz-Erreichbarkeit |
| Authentifizierung | Kontext ohne `storageState`, kein Redirect und keine Login- oder Kontooberfläche |
| Datenschutz | keine Koordinaten oder Suchparameter in der App-URL |
| Konsole | keine unerwarteten Fehler; der absichtlich provozierte Browser-Netzfehler wird separat erkannt |

Der direkte Aufruf benötigt weder Portal-Cookie noch Milos-Login. Die
Online-Ortssuche bleibt bewusst eine externe Netzfunktion; lokale Berechnung
und gespeicherter Ort sind davon getrennt.

Der kompakte 0.3.1-Stand aus
`6d48e47ad6189cc98a22ca0424da1360c92bf1d6` wurde als Pages-Artefakt
`2fb055e6b7f4a038142a82309d65a362b2e9ab6f` erneut extern verifiziert.
GitHub Pages meldete den Build terminal als `built`. Der automatisierte frische
Kontext bestätigte Health `ready/daylight/0.3.1/dev`, Direktaufruf ohne
Authentifizierungszustand, Desktop, 390 × 844, DE/EN-Persistenz,
Offline-Wiederöffnung, Netzgrenze, strikte CSP und 360 × 800 bei 200 Prozent.
Die sichtbare Browserprüfung maß auf Desktop 255 Pixel Introhöhe, 102 Pixel
Überschriftenhöhe, Ortswahlbeginn bei 324 Pixel und 1627 Pixel Seitenhöhe; auf
390 Pixel blieben Intro und Ortswahl bei 194 beziehungsweise 352 Pixel ohne
Überlauf. Ein erster Verifierlauf verwendete noch den alten englischen
Knopfnamen `Search place`; der reine Testvertrag wurde auf den sichtbaren
0.3.1-Namen `Search` korrigiert und lief anschließend vollständig grün.

## Portal-DEV-Finalabnahme

Portal & Identity bestätigte nach dem 0.3-Deploy am 1. August 2026:

| Prüfung | Ergebnis |
| --- | --- |
| Portalübersicht `/apps` | Karte „Noch hell?“ sichtbar |
| Route `/apps/daylight` | cookie-lose GET- und HEAD-Aufrufe liefern HTTP 302 auf exakt die unabhängige HTTPS-DEV-URL |
| Portal-DEV-Revision | `9643129b5688e4bd925b3ac198619ac260a61071`; Railway-Deployment `f82ad853-1134-48cb-a67d-bb05bf754b99` aktiv |
| Portal-CI | Run `30703116695` / Job `91377476515` vollständig erfolgreich |
| Portal-Smoke | App und Health HTTP 200; Health exakt `ready/daylight/0.3.0/dev`; kein Portal-Cookie nötig |
| Shell-Revalidierung | App-Eigentümer visuell bei 1440 × 900 und 390 × 844 ohne Überlauf; Portalroute separat cookie-los validiert |
| Production-Grenze | Karte nicht sichtbar; Production unverändert |
| Repository-Grenze | Portal-Task änderte das App-Repository nicht |

Die ältere Portalabnahme vom 30. Juli stützte sich wegen des damaligen
Billing-/Spending-Limits auf den aktiven Railway-Stand und lokale Tests. Die
aktuelle Revalidierung besitzt nun zusätzlich einen vollständig grünen
GitHub-CI-Lauf und ein erfolgreiches aktives Railway-Staging-Deployment.

Nach dem 0.3.1-App-Publish wurden cookie-lose GET- und HEAD-Aufrufe der
unveränderten Route erneut read-only geprüft; beide liefern weiterhin HTTP 302
auf exakt die App-DEV-URL. App und Health antworten HTTP 200 mit
`ready/daylight/0.3.1/dev`. Portal und Production blieben unverändert.

Portal & Identity wiederholte diese Prüfung unabhängig auf dem aktiven
Portal-DEV-Stand `ca84446a263d4fc0d38c177da606ae5ae3cde34c` / Railway
`59ebcbec-fedc-4cc0-8d17-e59e353278b6`: cookie-lose GET und HEAD jeweils
exakt 302, App und Health 200 sowie die vollständige 0.3.1-Health-Identität.

## QA-Runden für `public-app-essentials/v1.0.0` und Version 0.4.0

Stand: 2. August 2026. Gepinnte Quelle:
`b09e09008ff05fe87f05bc647a7c4964ff13e6f6`, Tag
`public-app-essentials-v1.0.0`.

### Runde 1: Integration und fokussierte Regression

Die erste Runde überführte Daylight auf den gemeinsamen kleinen Loader,
No-Cookies-Hinweis, Share-Control und das explizite Combobox-/Listbox-Muster.
Gefundene und behobene Punkte:

1. Der Loader-Titel war zunächst ein zweites H1. Er ist jetzt ein Paragraph;
   nach Readiness enthält das Dokument exakt ein H1.
2. Vite zog die Essentials-CSS-Dateien zunächst in das allgemeine Bundle ein.
   `vite-ignore`, ein app-eigenes Emit-Plugin und der Post-Build-Hashprüfer
   erhalten die beiden CSS- und zwei JS-Artefakte extern unter dem
   Vendorpfad.
3. Die alten E2E-Selektoren behandelten Suchergebnisse als Buttons. Der neue
   zugängliche Vertrag nutzt Combobox, Listbox, Option, Pfeiltaste und Enter;
   Regressionen prüfen jetzt diese Semantik direkt.
4. Die mobile Share-Anordnung belegte unnötig eine eigene Zeile. Die kompakte
   flexible Reihe bringt die Ortswahl bei 390 Pixel wieder deutlich früher in
   den ersten Arbeitsweg, ohne 44-Pixel-Ziele zu verkleinern.

Nach den Korrekturen waren in Chromium alle 42 Fälle grün: 12 Kernfluss,
6 Essentials, 9 Shell/CSP/Reflow und 15 Astro-/Standort-/Offlinefälle.

### Runde 2: vollständige Browser- und Reflowmatrix

| Gate | Ergebnis |
| --- | --- |
| Shared Shell-Verifier | PASS, `public-app-shell/v2.0.3` |
| Shared Essentials-Verifier | PASS, `public-app-essentials/v1.0.0` |
| Post-Build Essentials-Verifier | PASS, externe CSS/JS und SHA-256-Lock |
| Unit/Fachtests | 23/23 PASS in 6 Dateien |
| Chromium | 42/42 PASS |
| Firefox | 25 PASS, 17 gezielte Chromium-only-Fälle übersprungen |
| Mobile Chromium | 36 PASS, 6 Desktop-/Chromium-only-Fälle übersprungen |
| Gesamte Browsermatrix | 103 PASS, 23 bewusst projektgebundene Skips |
| Build | TypeScript und Vite PASS; keine `data:`-Essentials-Artefakte |
| JSON / Diff | Manifeste parsebar; `git diff --check` sauber |

Die Matrix umfasst DE/EN samt Reload-Persistenz; frischen und verzögerten
Start; Datenschutzhinweis, Link und Schließpersistenz; natives Teilen,
Clipboard-Fallback und Abbruch; Stadt, Region, gleichnamige und unbekannte
Orte; explizites Enter/Suchen ohne Autocomplete; Nominatim-Takt, Cache,
langsames Netz, Abbruch und ehrliche Netzfehler; Geräteortung erlaubt,
verweigert, abgebrochen, nicht verfügbar und Timeout; Offline-Wiederöffnung;
Resume über Sonnenuntergang, Dämmerungsende und Mitternacht; Äquator, hohe
Breiten, Polartag, Polarnacht, DST und Datumssprung; Tastatur, Fokus,
Screenreaderbaum, axe-core, 44 Pixel, Reduced Motion und strikte CSP.

Die finale sichtbare Browsermessung ergab:

| Ansicht | Intro | H1 | Beginn Ortswahl | Überlauf |
| --- | ---: | ---: | ---: | ---: |
| Desktop 1440 × 900 | 214,6 px | 39,2 px | 283,6 px | 0 px |
| Smartphone 390 × 844 | 246,1 px | 31,2 px | 357,4 px | 0 px |

Mobil waren alle Essentials-Ziele mindestens 44 Pixel hoch; der Footerabstand
lag bei 0,3 Pixel Rundungsdifferenz. Der bestehende 360 × 800-Fall bei
200 Prozent blieb ohne horizontalen Überlauf. Beide gebauten Essentials-CSS-
Links waren im finalen DOM als externe relative Vendor-URLs vorhanden.

### Externe DEV-Verifikation

Der koordinierte Publish baute ausschließlich Source
`105d80c9028389b7e4029f18c48fb6e25f7af56c` und veröffentlichte das
app-eigene Pages-Artefakt
`b7c9a5511d52b64a6438393acc7d6a399df8129f`. GitHub Pages meldete den Build
terminal als `built`; Health antwortete HTTP 200 und exakt mit
`ready/daylight/0.4.0/dev` sowie `database=false`.

Der frische externe Playwright-Lauf bestätigte Desktop 1440 × 900,
Smartphone 390 × 844 und 360 × 800 bei 200 Prozent, Direktaufruf ohne
Authentifizierungszustand, DE/EN samt Reload-Persistenz, echte Berlin-Suche,
Offline-Wiederöffnung und die ehrliche Netzgrenze. Der strikte CSP-Lauf
bestätigte Shell-Host `grid`, Brand `flex`, 44-Pixel-Essentials-Ziele, beide
externen Essentials-Stylesheets, 0 Pixel Überlauf und keine Konsolenfehler.

Ein erster externer Prüflauf zählte Suchoptionen unmittelbar nach dem Klick,
während die echte Netzsuche noch sichtbar lief. Der Verifier wartet nun auf
die semantische Option `Berlin Germany` und klickt erst danach; die App wurde
nicht mit einer künstlichen Verzögerung verändert.

Production blieb während Implementierung, QA und Veröffentlichung gesperrt.

### Portal-DEV-Revalidierung für 0.4.0

Portal & Identity bestätigte auf Portalrevision
`be0e17591bcc58df4317875c36f3a0e1e47f90d0`, CI-Lauf `30746592136` und
aktivem Railway-Staging-Deployment
`7181c8f8-a30a-450f-a42c-556b74e8859c`: Cookie-lose GET- und HEAD-Aufrufe
von `/apps/daylight` liefern jeweils HTTP 302 exakt auf die unabhängige
Daylight-DEV-URL. App und Health liefern HTTP 200; Health stimmt vollständig
mit `ready/daylight/0.4.0/dev` und `database=false` überein. Die
Productionroute bleibt HTTP 404. Runtime-Source `105d80c…`, Pages-Artefakt
`b7c9a55…` und Evidenz-/LF-Tipp `35769e1…` blieben unverändert; der Portal-
Task nahm keine Daylight-Repositorymutation vor.

## UX-Verfeinerung und kompakter Tageslichtfluss für Version 0.5.0

Stand: 3. August 2026. Die Produktarbeit folgt der Kampagne
`public-app-ux-refinement-2026-08`. Der unveränderliche Shared-Pin ist
`public-app-essentials/v1.1.2` am Commit
`b14aac6107b75f03ff49e74160af7e7e30c29e59`. Der koordiniert veröffentlichte
und extern verifizierte 0.5.0-Stand ist am Ende dieses Abschnitts dokumentiert;
0.4.0 bleibt sein unmittelbarer Rollback.

### Baseline

Im gesunden 0.4.0-DEV begann die Ortswahl bei 1440 × 900 nach 283,6 Pixeln und
bei 390 × 844 nach 357,4 Pixeln. Das Intro war 214,6 beziehungsweise 246,1
Pixel hoch. Nach einer bereits gewählten Ortsangabe blieb die komplette
Ortswahl weiterhin vor der eigentlichen Tageslichtantwort sichtbar.

### Verbesserungsrunde 1: Einstieg, Ort und Datenschutz

Die redundante Überüberschrift „Tageslicht, auf einen Blick“ entfällt. H1,
Erklärung, Ortskarte und Sonnenzeitkarten sind kleiner. Der lange
„Privat by design“-Block ist eine dauerhaft sichtbare kurze Zeile mit exaktem
Datenschutzlink und einer aufklappbaren lokalen Datenverwaltung. Da keine
Cookies, kein Tracking und keine optionale Speicherung stattfinden, gibt es
kein Schein-Einwilligungsbanner.

Die gemeinsame Ortssuche zeigt normalisierte Ergebnisse als
`Name · Region · Land`. Öffentliches Nominatim bleibt strikt submit-only;
lokale letzte Ergebnisse und ein erst nach freiwilliger Geräteortung
gespeicherter, vorher gerundeter eigener Ort erscheinen ohne Netzaufruf als
Vorschläge. Eine Standortberechtigung wird nie automatisch angefragt.

Messung nach Runde 1:

| Ansicht | Intro | Beginn Ortswahl | Privacy | Dokumenthöhe | Horizontaler Überlauf |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1440 × 900 | 113,0 px | 182,0 px | 102,1 px | 900 px | 0 px |
| 390 × 844 | 145,5 px | 256,9 px | 132,8 px | 844 px | 0 px |

### Verbesserungsrunde 2: Ergebnis sofort zeigen

Eine vorhandene oder neu gewählte Ortsangabe klappt den Suchbereich nun ein.
Die Tageslichtantwort steht dadurch beim Wiederöffnen und nach einer Auswahl
direkt nach dem Intro. „Ort ändern“ öffnet die vollständige gleichwertige
manuelle Suche und freiwillige Geräteortung wieder, scrollt zum Bereich und
setzt den Fokus. Das Löschen lokaler Ortsdaten öffnet denselben Einstieg.

Bei 390 × 844 wanderte die Antwortoberkante von zuvor 606,6 auf 272,9 Pixel;
die Seite schrumpfte im ausgewählten Zustand von 1844 auf 1418,9 Pixel. Auf
Desktop beginnt die Antwort nach 210 Pixeln. Die Antwortkarte ist 272 bis 276
Pixel hoch, behält aber Resthelligkeit, Ort, Aktualisierungszeit und den
direkten Änderungsweg.

### Lokale Regression nach dem finalen Shared-Sync

| Gate | Ergebnis |
| --- | --- |
| Unit/Fachtests | 26/26 PASS in 6 Dateien |
| Shared Shell | PASS, `public-app-shell/v2.0.3` |
| Shared Essentials | PASS, `public-app-essentials/v1.1.2`; sechs Verbraucherartefakte, Manifest und Hashes gelockt |
| Build/Artefaktgate | PASS; beide CSS- und beide JS-Dateien extern und SHA-256-gelockt; Loader-SVG stabil, MIME-geprüft und bytegleich zur Source |
| Chromium | 43/43 PASS |
| Gesamte Browsermatrix | 105 PASS, 24 bewusst profilgebundene Skips, 0 Fehler |
| Browser | Chromium, Firefox und Mobile Chromium |
| Diff | `git diff --check` sauber |

Die Matrix deckt Astro-/Zeitzonen-/DST-/Datumsgrenzen, Äquator, hohe Breiten,
Polartag und Polarnacht ebenso ab wie freiwillige Ortung erlaubt, verweigert,
abgebrochen, nicht verfügbar und Timeout. Zusätzlich geprüft sind lokale
Vorschläge ohne Netz, gleichnamige und unbekannte Orte, langsames Geocoding,
abgebrochene und veraltete Providerantworten, Offline-Wiederöffnung, Resume
über Sonnenuntergang/Dämmerungsende/Mitternacht, vollständiges DE/EN samt
Reload, Share-Erfolg/Abbruch/Fallback ohne Layoutsprung, Tastatur, Fokus,
axe-core, 44-Pixel-Ziele, Reduced Motion, strikte CSP sowie 360 × 800 bei
200 Prozent.

### Externe DEV-Regression

Der Source-Stand `0ef76e08df2533949fd215b7b5564d4098f73ade` wurde exakt
gebaut und als Pages-Artefakt
`4445064d440f0140b2c5c232e4d10f1196fd7d5d` veröffentlicht. GitHub Pages
meldete den Build terminal als `built`, Fehler `null`. Der erste externe Lauf
legte ausschließlich eine veraltete Prüferannahme offen: Nach einem Reload
ist die Ortssuche bei gespeichertem Ort absichtlich eingeklappt. Der Prüfer
nutzt nun wie ein Nutzer zuerst „Change place“; die App-Runtime blieb
unverändert.

Der vollständige Wiederholungslauf gegen die öffentliche HTTPS-DEV-URL
bestand anschließend:

- Health HTTP 200, exakt `ready/daylight/0.5.0/dev`, `database=false`;
- Direktaufruf ohne Cookie, Authentifizierungszustand oder Portal;
- Desktop 1440 × 900 mit echter Berlin-Suche und Offline-Wiederöffnung;
- 390 × 844 unter strikter `default-src 'self'; script-src 'self';
  style-src 'self'`-CSP, keine Konsolenfehler, externe Shell-/Essentials-CSS,
  44-Pixel-Ziele und null horizontaler Überlauf;
- 390 × 844 sowie 360 × 800 bei 200 Prozent mit vollständiger DE/EN-
  Umschaltung und Reload-Persistenz;
- Loader-Icon HTTP 200, `image/svg+xml`, SHA-256
  `fe3be26d339687cfcc22809b4c9eeac055166ba512977faa709fa959a1cad645`
  und damit bytegleich zu `public/daylight-icon.svg`.

### Portal-DEV-Revalidierung für 0.5.0

Portal & Identity bestätigte die bestehende Route read-only auf Portal-DEV
`bad3ba236096f5643e99ef56ab509b13611e3df2`, dem erfolgreichen CI-Lauf
`30783381444` und dem aktiven Railway-Staging-Deployment
`753d9c63-b3bb-400f-a910-f53f9f45131c`. Cookie-lose GET- und HEAD-Aufrufe von
`/apps/daylight` liefern jeweils HTTP 302 exakt auf die unabhängige
Daylight-DEV-URL. App und Health antworten HTTP 200; der Health-MIME-Typ ist
`application/json; charset=utf-8`, der Inhalt exakt
`ready/daylight/0.5.0/dev` und `database=false`. Die Productionroute bleibt
HTTP 404. Weder App-Repository noch Pages wurden dafür verändert.
