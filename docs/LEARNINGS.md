# Noch-hell-Erkenntnisse

Die Einträge enthalten keine Nutzerdaten. Allgemein relevante Punkte werden
zusätzlich per Task-Nachricht an Struktur & Architektur sowie Ideen & Portfolio
gemeldet; das Workspace-Dokument `docs/PORTFOLIO_LEARNINGS.md` wird von diesem
App-Task nicht verändert.

## 2026-07-30: Ein lokaler Kalendertag ist keine feste UTC-Spanne

- **Evidenz:** Berlin hat am 29. März 2026 einen 23-Stunden-Tag und am
  25. Oktober 2026 einen 25-Stunden-Tag. In `Pacific/Kiritimati` ist
  1. Januar 2026 bereits ab `2025-12-31T10:00:00Z`.
- **Folge:** Ereignisse werden zwischen den tatsächlichen UTC-Grenzen des
  lokalen Datums gesucht. „Morgen“ wird als lokaler Kalendertag addiert, nicht
  als `+24 Stunden`.
- **Regression:** `tests/unit/timezone.test.ts` und die Oberflächentests für
  beide Berliner Zeitumstellungen sowie den Datumssprung.
- **Commit:** `2b5ffe7`, erweitert in `a259a5f`.
- **Gültigkeitsgrenze:** Die Laufzeitdaten stammen aus `Intl`/der IANA-Zeitzone
  des Browsers; sehr alte oder zukünftige Regeländerungen hängen von dessen
  Aktualität ab.

## 2026-07-30: Standortdatenschutz beginnt vor der Speicherung

- **Evidenz:** Browser-Geolocation liefert genaue Koordinaten. Eine reine
  lokale Speicherung verhindert nicht, dass später versehentlich Präzision in
  UI, Logs oder URLs gelangt.
- **Folge:** Gerätekoordinaten werden sofort auf zwei Nachkommastellen gerundet.
  Der gerundete Datensatz bleibt lokal, wird nicht rückwärts geocodiert und
  gelangt nicht in die Seiten-URL. Manuelle Ortssuche bleibt gleichwertig.
- **Regression:** E2E-Fälle für erlaubt, verweigert/abgebrochen, technisch nicht
  verfügbar, Timeout, lokales Löschen und URL-Prüfung.
- **Commit:** `2b5ffe7`.
- **Gültigkeitsgrenze:** Eine manuelle Suchanfrage übermittelt den eingegebenen
  Ortsnamen bewusst an den konfigurierten Geocoder; die Oberfläche erklärt
  diesen Datenfluss.

## 2026-07-30: Fehlende Sonnenereignisse sind fachliche Zustände

- **Evidenz:** USNO-Referenzen bestätigen für Tromsø am 21. Juni Polartag, am
  21. Dezember Polarnacht mit bürgerlicher Dämmerung sowie für Longyearbyen am
  21. Dezember auch das Ausbleiben bürgerlicher Dämmerung.
- **Folge:** Die App erfindet keine Uhrzeit. Sie unterscheidet durchgehend über
  dem Horizont, durchgehend darunter, Dämmerungs-Crossings und kein Crossing am
  lokalen Datum.
- **Regression:** `tests/unit/astronomy.test.ts` und die Grenzfallansichten in
  `tests/e2e/daylight.spec.ts`.
- **Commit:** `2b5ffe7`, Oberflächenmatrix erweitert in `a259a5f`.
- **Gültigkeitsgrenze:** Berechnete Zeiten sind Näherungen; Refraktion,
  Geländehorizont und Wetter können die beobachtete Helligkeit verschieben.

## 2026-07-30: Service-Worker-Registrierung darf das `load`-Ereignis nicht verpassen

- **Evidenz:** Im ersten Offline-Test wurde der App-Code nach dem
  `load`-Ereignis ausgeführt; ein ausschließlich dort registrierter Listener
  lief nicht mehr und der Offline-Cache blieb leer.
- **Folge:** Bei `document.readyState === "complete"` wird sofort registriert,
  sonst einmalig beim `load`-Ereignis.
- **Regression:** E2E-Wiederöffnung des gespeicherten Orts im Offline-Modus.
- **Commit:** `2b5ffe7`.
- **Gültigkeitsgrenze:** Die Erstladung und eine neue Ortssuche benötigen
  weiterhin Netz; nur der App-Shell und lokale Ortsdaten sind offline nutzbar.

## 2026-07-30: Readiness muss die App-Identität beweisen

- **Evidenz:** Ein früher Testlauf akzeptierte auf Port 4173 eine fremde App,
  weil ein generischer HTTP-200 als bereit galt.
- **Folge:** `daylight` verwendet exklusiv Port 4319 mit `strictPort`.
  Readiness verlangt `status=ready` und `appKey=daylight`;
  `reuseExistingServer` ist deaktiviert. Fremde Prozesse werden nicht beendet.
- **Regression:** Healthcheck-E2E-Test sowie
  `scripts/check-readiness.mjs` und `scripts/e2e-server.mjs`.
- **Commit:** `2b5ffe7`; normaler DEV-Start, Kollisionsnachweis und Übergabe in
  `8071fe2`.
- **Gültigkeitsgrenze:** Die Identitätsprüfung schützt die lokale
  Prozessauswahl; sie ersetzt keine Authentifizierung eines späteren
  Deployment-Systems.

## 2026-07-30: Vollständige Lokalisierung braucht Fachzustände statt fertiger Sätze

- **Evidenz:** Die frühere Tageslichtlogik gab deutsche Antwortsätze zurück.
  Eine bloße Shell-Übersetzung hätte dadurch Resthelligkeit, Polartag,
  Polarnacht und Resume-Zustände teilweise deutsch belassen.
- **Folge:** Die Berechnung liefert sprachneutrale Zustandskennungen und
  Zeitziele. Erst die UI formatiert daraus DE oder EN. Statische und dynamische
  Texte, Dokumenttitel, zugängliche Namen sowie Datums-/Zeitformate wechseln
  gemeinsam.
- **Regression:** `tests/unit/i18n.test.ts` sowie die Shell-E2E-Fälle für
  Sprache, Reload, Suche, Sonnenzeiten, Fehler und axe.
- **Gültigkeitsgrenze:** Eigennamen und gespeicherte Ortskontexte werden nicht
  ohne Netz rückübersetzt. Neue Suchen fragen Nominatim mit der aktuell
  gewählten Sprache an.

## 2026-07-30: Sprachabhängige Netzdaten brauchen getrennte Cache-Schlüssel

- **Evidenz:** Ein nur nach Suchtext indizierter Geocoding-Cache hätte nach
  einem Sprachwechsel weiterhin deutsche Ländernamen in der englischen
  Ergebnisliste gezeigt.
- **Folge:** Der Cache-Schlüssel enthält Sprache und normalisierten Suchtext.
  `accept-language` und `Accept-Language` verwenden dieselbe aktuelle Sprache.
- **Regression:** Browsertest mit englischer Suche, Ergebnistypen und
  Persistenz; die bestehende Cache-Wiederverwendung bleibt für dieselbe Sprache
  grün.
- **Gültigkeitsgrenze:** Orts-Eigennamen folgen der Antwort des Geocoders und
  sind nicht für jede Region vollständig lokalisierbar.

## 2026-07-30: DEV-Badge und Portal-Linkbasis teilen eine Umgebungsquelle

- **Evidenz:** Ein festes DEV-Badge neben separat hartcodierten Links könnte
  später zu einem widersprüchlichen Build führen, der sich als DEV ausgibt,
  aber Production verlinkt.
- **Folge:** Seit `public-app-shell/v2` ist `milos-app.json` die kanonische
  Shell-Quelle für `environment=dev`, Badge, absolute Links und
  `productionApproved=false`. `public/runtime-config.json` bleibt nur für die
  app-eigene Laufzeit-/Geocoding-Konfiguration bestehen.
- **Regression:** Portabler Shell-Verifier, Lockprüfung und E2E-Test für
  DEV-Badge, absolute Links und die gesperrte Production-Grenze.
- **Gültigkeitsgrenze:** Die geprüfte Production-Abbildung ist keine fachliche
  Production-Freigabe.

## 2026-07-30: `navigator.onLine` beweist keine erreichbare Ortssuche

- **Evidenz:** Im externen Chromium-Smoke blieb die gespeicherte App nach
  Offline-Wiederöffnung vollständig nutzbar. Der Browser sperrte neue
  Netzwerkzugriffe, meldete `navigator.onLine` in dieser
  Service-Worker-Konstellation aber weiterhin als wahr. Die neue Ortssuche
  fiel deshalb zunächst auf eine zu allgemeine Fehlermeldung zurück.
- **Folge:** Die Geocoding-Schicht unterscheidet abgebrochene Anfragen,
  HTTP-Antworten und echte Fetch-Netzfehler. Ein Netzfehler erklärt jetzt
  unabhängig vom Browser-Hinweis, dass nur eine neue Suche Netz benötigt und
  ein gespeicherter Ort weiter funktioniert.
- **Regression:** Englischer Shell-E2E-Fall mit absichtlich abgebrochener
  Netzroute sowie `scripts/verify-external-dev.mjs` mit echter
  Offline-Wiederöffnung.
- **Gültigkeitsgrenze:** Die Meldung unterscheidet bewusst nicht zwischen
  fehlender Geräteverbindung, DNS-, CORS- oder Endpunktfehler. Ohne
  Serverantwort ist nur die fehlende Erreichbarkeit sicher bekannt.

## 2026-08-01: Eine vendorte Shell braucht ein eindeutiges Locale-Eigentum

- **Evidenz:** In v1 verwaltete Daylight Sprache, Speicherung und Shelltexte
  selbst. Eine zusätzliche vendorte Persistenz hätte zwei konkurrierende
  Zustände und doppelte Portal-Linklogik erzeugt.
- **Folge:** Die v2-Shell besitzt nur ihre Texte, Persistenz und Links. Das
  Daylight-Locale-Modul initialisiert aus `document.documentElement.lang`, hört
  `milosapps:localechange` und übersetzt alle Fachzustände einschließlich
  Fehler, Sonnenereignisse und zugängliche Namen.
- **Regression:** Portabler Verifier sowie DE-/EN-E2E mit Live-Suche,
  Fehlerzuständen und Reload-Persistenz.
- **Gültigkeitsgrenze:** Gespeicherte Ortsnamen werden offline nicht nachträglich
  übersetzt; neue Geocoding-Antworten verwenden die aktuelle Sprache.

## 2026-08-01: Reflowgrenzen gehören zentral und app-eigen geprüft

- **Evidenz:** Der gemeinsame v2.0.1-Body-Floor und die Markenreihe konnten bei
  360 × 800 und 200 Prozent überlaufen. Zusätzlich hätte Daylights historischer
  eigener `min-width: 280px` denselben Fehler nach einem Shared-Patch wieder
  einführen können.
- **Folge:** Shared v2.0.2 behebt Shell-Body, Brand und Navigation zentral;
  Daylight entfernt nur seine eigene unnötige Mindestbreite und veröffentlicht
  keinen Shell-Workaround.
- **Regression:** Shared-Hash/Lock plus app-eigener 360 × 800/200-Prozent-Fall,
  390 × 844 und Desktopmessung einschließlich bündigem Footer.
- **Gültigkeitsgrenze:** Der Shared-Patch garantiert nur die Shell; jede App
  bleibt für Reflow ihres Fachinhalts verantwortlich.

## 2026-08-01: App-Themetokens müssen im Verbraucher auf Kontrast geprüft werden

- **Evidenz:** Der normale Daylight-Akzent war für große Buttons ausreichend,
  erreichte am kleinen DEV-Badge der Shell aber nur 3,57:1.
- **Folge:** Die Shell nutzt den vorhandenen dunkleren Akzent, während der
  Fachinhalt sein bewährtes Farbsystem behält.
- **Regression:** axe-core in DE und EN sowie sichtbare Fokus- und
  44-Pixel-Zielprüfung.
- **Gültigkeitsgrenze:** Ein zentral getestetes Shell-Defaulttheme beweist nicht
  den Kontrast beliebiger app-eigener Theme-Tokens.

## 2026-08-01: CSP-sichere Quelldateien müssen auch extern gebaut bleiben

- **Evidenz:** `public-app-shell/v2.0.3` liefert Shadow- und Theme-CSS korrekt
  als Same-Origin-Dateien. Vite bettete die kleinen Dateien standardmäßig als
  `data:`-URLs in das JavaScript-Bundle ein; `style-src 'self'` blockierte sie
  weiterhin und die Komponente wurde nicht registriert.
- **Folge:** Der Daylight-Build setzt `assetsInlineLimit: 0`. So bleiben beide
  Stylesheets externe app-eigene Assets; weder `unsafe-inline` noch `data:`,
  Nonces, Hashlisten oder Portal-Ausnahmen sind nötig.
- **Regression:** Echter Response-CSP-Fall mit Host-Grid, Markenlayout,
  Themefarbe, 44-Pixel-Ziel und leerer CSP-Konsole sowie anschließender
  360 × 800/200-Prozent- und Vollmatrixlauf.
- **Gültigkeitsgrenze:** Der Shared-Quellvertrag allein beweist nicht, dass ein
  Verbraucher-Bundler externe Assets unverändert extern ausliefert; diese
  Eigenschaft muss im erzeugten App-Build geprüft werden.

## 2026-08-01: Ein fokussierter Helfer braucht ein überprüfbares Dichtebudget

- **Evidenz:** Die fachlich vollständige Startansicht war technisch responsiv,
  belegte auf Desktop aber 606 Pixel allein für das Intro; die Überschrift war
  309 Pixel hoch und die eigentliche Ortswahl begann erst bei 675 Pixel. Auf
  Mobilgeräten verlängerten verschachtelte Karten und ein unnötig gestapelter
  Suchknopf den ersten Arbeitsweg zusätzlich.
- **Folge:** Überschriften, vertikale Abstände, Ergebnisfläche und Ereigniskarten
  besitzen nun bewusst kleinere Obergrenzen. Suche und Geräteortung bleiben
  gleichwertig, werden aber ohne zusätzliche Kartenebenen und bei 390 Pixel
  mit Suchfeld und Knopf in einer Zeile dargestellt. 44-Pixel-Ziele werden
  nicht zugunsten bloß kleinerer Bedienelemente geopfert.
- **Regression:** Ein Chromium-Geometrietest begrenzt Introhöhe,
  Überschriftgröße, Position der Ortswahl sowie Höhe von Antwort- und
  Ereigniskarten. Die bestehende Matrix prüft zusätzlich 390 × 844,
  360 × 800 bei 200 Prozent, DE/EN, Fokus, Touchziele und Überlauffreiheit.
- **Gültigkeitsgrenze:** Die Grenzwerte gelten für diesen fokussierten
  Tageslichthelfer. Datenreiche Werkzeuge dürfen andere Dichteziele benötigen;
  entscheidend bleibt, dass die Hauptaufgabe früh sichtbar wird und Reflow
  sowie Bedienbarkeit erhalten bleiben.

## 2026-08-02: Ein CSS-first Loader darf die Dokumentgliederung nicht duplizieren

- **Evidenz:** Der frühe Loader ist schon vor der Fach-App sichtbar. Ein
  zusätzliches `h1` im Loader blieb nach dem Ausblenden im Dokumentbaum und
  erzeugte damit zwei Hauptüberschriften.
- **Folge:** `data-milos-loading-title` verwendet ein tag-agnostisches
  Paragraph-Element. Der sichtbare App-Inhalt besitzt weiterhin genau ein H1.
- **Regression:** Langsamer Start prüft Sichtbarkeit, maximal 56 Pixel
  Iconbreite, Tag `P`, explizites Ready-Signal und anschließend exakt ein H1.
- **Gültigkeitsgrenze:** Visuelles Ausblenden allein repariert keine
  semantische Gliederung; jedes Start-Overlay muss im endgültigen DOM geprüft
  werden.

## 2026-08-02: Vendoring und Browserartefakt sind zwei getrennte Beweise

- **Evidenz:** Der Quell-Validator bestätigte fünf korrekt gelockte
  Essentials-Dateien, während Vite die beiden CSS-Links zunächst in das
  allgemeine App-CSS einzog. Damit fehlte die vertraglich geforderte externe
  Vendorgrenze im gebauten HTML trotz korrekter Quelldateien.
- **Folge:** Die Links sind explizit vom HTML-Bundling ausgenommen; ein
  app-eigenes Build-Plugin emittiert vier Browserartefakte unter dem
  Vendorpfad. Der Post-Build-Verifier hasht jedes gebaute Artefakt erneut und
  verwirft Inlining oder fehlende Links.
- **Regression:** Source-Verifier, Post-Build-SHA-Prüfung, MIME-Test und echte
  strikte Response-CSP einschließlich Theme, 44-Pixel-Zielen und leerer
  CSP-Konsole.
- **Gültigkeitsgrenze:** Ein Shared-Lock beweist die Herkunft im Repository,
  nicht automatisch die Form nach einem Verbraucher-Build.

## 2026-08-02: Eine gemeinsame Ortssuche braucht ein gemeinsames Ergebnis, nicht einen gemeinsamen Provider

- **Evidenz:** Daylight muss astronomische Zeitzonen, lokale Speicherung,
  Nominatim-Takt und gerundete Gerätekoordinaten bewahren. Diese Fachgrenzen
  unterscheiden sich von anderen Apps, obwohl Beschriftung, Ergebnisstruktur
  und Tastaturführung gleich aussehen sollen.
- **Folge:** Der Shared-Baustein besitzt nur explizite Combobox-/Listbox-UI und
  normalisierte Felder. Daylight liefert Search- und Locate-Provider, löst die
  IANA-Zeitzone app-eigen auf und speichert nur sein minimiertes Ortsschema.
- **Regression:** Stadt, Region, gleichnamige Orte, kein Autocomplete,
  Pfeiltaste/Enter, langsame Suche/Abbruch, Cache, Netzfehler sowie erlaubte
  und verweigerte Geräteortung.
- **Gültigkeitsgrenze:** Einheitliches UI legitimiert weder einen gemeinsamen
  Geocoding-Account noch gemeinsame Datenhaltung oder das Weitergeben genauer
  Koordinaten in Teil-URLs.

## 2026-08-02: Bytegenaue Vendor-Locks brauchen eine lokale Zeilenendenregel

- **Evidenz:** SHA-256-Locks prüfen veröffentlichte Bytes. Ein Windows-
  Recheckout kann Textdateien durch `core.autocrlf` verändern, obwohl Commit
  und fachlicher Inhalt identisch erscheinen.
- **Folge:** Das vendorte Essentials-Verzeichnis enthält eine enge
  `.gitattributes` mit `* text eol=lf`. Ein frischer Windows-Checkout muss den
  unveränderten Lock erneut bestehen.
- **Regression:** Essentials-Verifier und Recheckout-Prüfung der aktuell sechs
  gelockten Verbraucherdateien einschließlich Schema.
- **Gültigkeitsgrenze:** Die Regel gilt nur für diesen Vendorordner; sie
  verändert weder globale Git-Einstellungen noch andere App-Dateien.

## 2026-08-02: Externe UI-Prüfer warten auf Zustände, nicht auf Netz-Timing

- **Evidenz:** Die echte Berlin-Suche war erfolgreich, aber ein Prüfer zählte
  Optionen direkt nach dem Absenden, noch während „Orte werden gesucht …“
  sichtbar war.
- **Folge:** Der externe Verifier wartet auf die zugängliche Ergebnisoption
  und interagiert erst danach. Es gibt keine feste Schlafzeit und keinen
  app-eigenen künstlichen Delay.
- **Regression:** `scripts/verify-external-dev.mjs` gegen die öffentliche
  HTTPS-DEV-URL mit echter Nominatim-Antwort.
- **Gültigkeitsgrenze:** Auch zustandsbasiertes Warten kann einen externen
  Ausfall nicht heilen; der Test bleibt mit einem endlichen Timeout
  fail-closed.

## 2026-08-03: Notwendige lokale Speicherung braucht Information, keine Schein-Einwilligung

- **Evidenz:** Daylight verwendet weder Cookies noch Tracking. Sprache,
  gewählter Ort, gerundeter Gerätevorschlag, begrenzter Geocoding-Cache und
  Offline-Shell erfüllen jeweils eine konkrete vom Nutzer angeforderte
  Funktion. Der bisherige wegklickbare No-Cookies-Hinweis erzeugte trotzdem
  das Muster eines Consent-Banners und zusätzlichen Dismiss-Zustand.
- **Folge:** Alle Endgerätezugriffe sind zweck-, laufzeit- und löschwegbezogen
  inventarisiert. Es gibt kein Banner und keinen Consent-/Dismiss-Key, sondern
  eine kurze dauerhaft erreichbare Zeile mit Datenschutzlink und progressiver
  lokaler Datenverwaltung. Optionale Zwecke bleiben deaktiviert.
- **Regression:** Manifest- und Lock-Verifier, DE-/EN-E2E ohne
  Privacy-Notice, Entfernung des alten Notice-Keys und
  `docs/PRIVACY_INVENTORY.md`.
- **Gültigkeitsgrenze:** Die technische Einstufung dokumentiert den
  Produktstand und ist keine Rechtsberatung. Neue Analyse-, Werbe- oder andere
  optionale Zwecke benötigen einen eigenen Consent-Vertrag.

## 2026-08-03: Lokale Ortsvorschläge sind nicht dasselbe wie Netzwerk-Autocomplete

- **Evidenz:** Der öffentliche Nominatim-Endpunkt soll nur nach explizitem
  Absenden angesprochen werden. Trotzdem braucht der fokussierte Helfer einen
  schnellen Weg zurück zu bereits verwendeten Orten und zum freiwillig
  ermittelten eigenen Ort.
- **Folge:** Die App leitet Vorschläge ausschließlich aus frischen,
  sprachgebundenen Cacheantworten sowie aus der vorab auf etwa einen Kilometer
  gerundeten Geräteposition ab. Tippen löst keinen Netzaufruf und keine
  Standortberechtigung aus. Name und Kontext werden einheitlich als
  Name sowie Region · Land dargestellt.
- **Regression:** Unit-Filter für Sprache, Alter, Manipulation und Deduplizierung;
  Browserfälle für null Requests vor Enter, lokale Wiederwahl ohne Netz und
  null Geolocation-Aufrufe vor dem bewussten Button.
- **Gültigkeitsgrenze:** Echte automatische Netzvorschläge bleiben ohne
  nachgewiesenen app-eigenen Proxy/Provider deaktiviert. Lokale Ergebnisse
  können nur Orte anbieten, die der Browser bereits erhalten hat.

## 2026-08-03: Abort muss bis hinter die letzte asynchrone Providergrenze geprüft werden

- **Evidenz:** Nach der Essentials-Migration verwies der app-eigene
  Abbruchknopf noch auf ein früheres internes Controllerfeld. Zusätzlich kann
  ein Testprovider einen Abort ignorieren und seine Antwort später erfüllen.
  Ohne zweite Prüfung erschien nach dem Abbruch wieder ein altes Ergebnis.
- **Folge:** Daylight nutzt die öffentliche `cancelSearch()`-Methode und prüft
  nach dem letzten `await` sowohl das Signal als auch die aktive Anfrage,
  bevor Ergebnisse an die gemeinsame Komponente zurückgegeben werden.
- **Regression:** Verzögerte Suche, sichtbarer Abbruch, leere Ergebnisliste und
  wieder aktivierter Submit-Button; der Provider darf die verspätete Antwort
  absichtlich noch liefern.
- **Gültigkeitsgrenze:** Die Shared-Komponente schützt ihren eigenen
  Lebenszyklus. Jeder asynchrone App-Provider bleibt zusätzlich dafür
  verantwortlich, Abort an seine I/O-Grenzen weiterzugeben und vor dem
  Zurückgeben erneut zu prüfen.

## 2026-08-03: Kompaktheit wird an der ersten Aufgabe gemessen, nicht an kleinen Touchzielen

- **Evidenz:** Vor der Überarbeitung belegte das Intro 214,6 Pixel auf Desktop
  und 213,9 Pixel auf 390 Pixel Breite; die Ortswahl begann bei 283,6
  beziehungsweise 325,3 Pixel. Der große Privacy-Block belegte mobil weitere
  266,6 Pixel.
- **Folge:** Die redundante Überzeile entfällt, H1 und Einleitung sind kürzer,
  die Ortskarte enthält nur noch notwendige Hinweise und die Privacy-Aussage
  fließt als kompakte Zeile. In der finalen lokalen Messung beginnt die
  Ortswahl bei 182,0 Pixel auf Desktop und 256,9 Pixel mobil; Intro und
  Privacy messen mobil 145,5 und 132,8 Pixel. Alle Interaktionsziele bleiben
  mindestens 44 Pixel hoch. Bei einem gespeicherten Ort ist die redundante
  Suche eingeklappt und über „Ort ändern“ sofort erreichbar: Mobil rückt die
  Antwort dadurch von 606,6 auf 272,9 Pixel, die Seite schrumpft von 1844,0
  auf 1418,9 Pixel.
- **Regression:** Engere Dichtebudgets für 1440 × 900 und 390 × 844 sowie die
  bestehende 360 × 800/200-Prozent-, Fokus-, Touch- und Overflowmatrix.
- **Gültigkeitsgrenze:** Diese Werte gelten für die leere Startansicht. Nach
  einer Auswahl darf die fachlich notwendige Sonnenzeitenansicht länger sein,
  muss aber weiterhin ohne horizontalen Überlauf und mit früher sichtbarer
  Antwort funktionieren.

## 2026-08-03: Loader-Quelldatei und öffentliche URL sind getrennte Verträge

- **Evidenz:** Eine statische App kann dieselbe relative Schreibweise für
  Repositorydatei und Browser-URL verwenden; Frameworks mit getrenntem
  Public-Root können das nicht. Eine einzige Pfadangabe beweist deshalb weder
  den vorhandenen Quellbestand noch die tatsächlich ausgelieferte Ressource.
- **Folge:** Daylight pinnt mit Essentials v1.1.2 den physischen Pfad
  `public/daylight-icon.svg` getrennt von der öffentlichen Same-Origin-URL
  `./daylight-icon.svg`. Es existiert kein doppeltes Schattenasset.
- **Regression:** Shared-Verifier und Lock prüfen beide Pfade exakt. Der
  app-eigene Post-Build- und Browsertest verlangt stabile HTML-URL, HTTP 200,
  `image/svg+xml` und einen zur Source identischen SHA-256-Hash.
- **Gültigkeitsgrenze:** Ein Quell-Lock beweist nicht den MIME-Typ des
  Hostings; der HTTP-Nachweis bleibt Teil jedes App-DEV-Lifecycles.

## 2026-08-03: Komponentenweise Touchzieltests dürfen Textlinks nicht übersehen

- **Evidenz:** Shell- und Essentials-Steuerelemente waren mindestens 44 Pixel
  groß, aber die app-eigenen Links `Privacy` und `OpenStreetMap contributors`
  maßen mobil nur ungefähr 43,31 × 17 und 149,03 × 15 Pixel. Der bestehende
  Test selektierte nur Shell-Komponenten und konnte die Aussage „alle Ziele“
  deshalb nicht tragen.
- **Folge:** Beide app-eigenen Links erhalten echte 44 × 44 Pixel große
  Inline-Flex-Hitboxen. Der QA-Nachweis unterscheidet Komponenten-, Shell- und
  App-Ziele ausdrücklich.
- **Regression:** Ein eigener 390 × 844-EN-Test misst beide Links vollständig,
  prüft null horizontalen Überlauf und lief vor der CSS-Korrektur nachweislich
  rot.
- **Gültigkeitsgrenze:** Normative Accessibility-Standards können Ausnahmen für
  Inline-Text vorsehen; der hier gepinnte MilosApps-Layoutvertrag fordert für
  sichtbare Interaktionsziele jedoch 44 × 44 Pixel und nennt für diese beiden
  App-Links keine Ausnahme.

## 2026-08-03: Eingabevorschläge und Provideranfragen sind zwei getrennte Funktionen

- **Evidenz:** Die dauerhaft sichtbaren lokalen Ortschips vergrößerten den
  Einstieg, halfen aber nicht gezielt zur aktuellen Eingabe. Gleichzeitig
  verbietet die Richtlinie der öffentlichen Nominatim-Instanz clientseitiges
  Netz-Autocomplete.
- **Folge:** Daylight zeigt gespeicherte Cachetreffer und den freiwillig
  gerundeten Geräteort erst passend zur aktuellen Eingabe als kompakte Liste.
  Auswahl, Pfeiltasten und Enter bleiben vollständig lokal; nur die separate
  Enter-/„Suchen“-Aktion darf einen unbekannten Ortsnamen an Nominatim senden.
- **Regression:** Der Browserfall sucht Berlin einmal ausdrücklich, öffnet die
  Ortswahl erneut, filtert `Ham` auf leer und `Ber` auf Berlin, wählt den Treffer
  per Pfeiltaste/Enter und belegt weiterhin genau eine Provideranfrage.
- **Gültigkeitsgrenze:** Eine frische weltweite Vorschlagsliste beim ersten
  Tippen benötigt einen nachgewiesenen, dafür geeigneten Proxy oder Provider.
  Ohne diesen Vertrag bleiben ausschließlich lokale bekannte Orte verfügbar.

## 2026-08-03: Dynamische Vorschläge brauchen einen eigenen Providervertrag, aber kein zweites UI

- **Evidenz:** Die öffentliche Nominatim-Richtlinie verbietet clientseitiges
  Autocomplete. Open-Meteo dokumentiert dagegen partielle und unscharfe
  Ortssuche ab drei Zeichen, liefert die benötigte IANA-Zeitzone und erlaubt
  credential-freie Browseraufrufe. Das WAI-ARIA-APG beschreibt eine einzige
  Combobox mit kontrollierter Listbox, nicht getrennte lokale und entfernte
  Ergebnisflächen.
- **Folge:** Daylight nutzt Open-Meteo ausschließlich für dynamische
  Vorschläge und Nominatim weiterhin nur nach Enter/Suchen. Lokale letzte Orte,
  der freiwillig gerundete Geräteort und neue Providerergebnisse werden
  app-eigen dedupliziert und durch genau dieselbe Shared-Listbox dargestellt.
  Escape, Auswahl und Pointerinteraktion außerhalb schließen diese Liste.
- **Regression:** Provideraufruf erst ab drei Zeichen, Debounce, Abort und
  verspätete Antwort; genau eine sichtbare Listbox; Tastatur/ARIA; Außenklick;
  lokale Offline-Treffer; DE/EN; 390 × 844 und 360 × 800 bei 200 Prozent.
- **Gültigkeitsgrenze:** Der öffentliche Open-Meteo-Dienst besitzt
  Nutzungsgrenzen und keine Verfügbarkeitsgarantie. Endpoint und Providerlogik
  bleiben austauschbar; vor Production werden Bedingungen, Kapazität und
  Datenschutz erneut bewertet. Bei Ausfall bleiben lokale Orte und die
  ausdrückliche Nominatim-Suche getrennt nutzbar.

## 2026-08-03: Ein nützlicher Standardort ist keine gespeicherte Nutzerwahl

- **Evidenz:** Ein leerer Erststart verlangte eine Ortsaktion, bevor die
  Kernantwort sichtbar wurde. Wird ein Fallback dagegen wie eine bewusste
  Auswahl beschriftet oder gespeichert, ist die Herkunft für Nutzer unklar.
- **Folge:** Köln liefert sofort eine lokale Tageslichtantwort, trägt aber den
  eigenen Status `Standardort` und wird nicht in `localStorage` geschrieben.
  Nur Suche oder freiwillige Geräteortung erzeugen eine persistierte Wahl.
- **Regression:** Frischer Kontext, Datenlöschung, DE/EN und externer
  No-Login-Lauf prüfen Köln, Status und fehlenden Orts-Speichereintrag. Die
  Antwort steht mobil vor 270 Pixeln; „Ort ändern“ hält die Suche erreichbar.
- **Gültigkeitsgrenze:** Der Fallback ist eine Produkthilfe für eine
  standortbezogene öffentliche App. Er darf weder eine automatische
  Standortberechtigung auslösen noch als tatsächlicher Nutzerort ausgegeben
  werden.

## 2026-08-03: Ereignisdichte entsteht durch Hierarchie, nicht durch kleinere Klickziele

- **Evidenz:** Vier eigenständige Karten wiederholten `Ortszeit`, Rahmen,
  Abstand und Dekoration. Dadurch wirkte eine kleine Datenmenge wie ein langer
  Textstapel; die Aktualisierungszeit verlor zugleich Kontrast auf dem Himmel.
- **Folge:** Eine verbundene Ereignisfläche nutzt feine Trennlinien,
  Farbpunkte und rechts ausgerichtete Zeiten. `Ortszeit` steht einmal an der
  Datumszeile; nur der fachlich abweichende morgige Kalendertag behält einen
  Hinweis. Die Aktualisierung erhält eine eigene kontrastreiche Fläche.
- **Regression:** Vier semantische `dt`/`dd`-Paare bleiben erhalten, jede
  mobile Zeile misst 72 Pixel, 390 × 844 und 360 × 800@200 % bleiben ohne
  Überlauf, Axe und Tastaturfluss bleiben grün.
- **Gültigkeitsgrenze:** Fachliche Polar-/Kein-Ereignis-Zustände dürfen
  weiterhin längere Texte benötigen; Dichtebudgets dürfen diese Aussagen
  nicht abschneiden oder durch erfundene Uhrzeiten ersetzen.

## 2026-08-03: Sichtbare Redundanz und zugänglicher Kontext sind getrennte Ebenen

- **Evidenz:** In der Hauptkachel konkurrierten Herkunftslabel,
  Länder-/Zeitzonentext und „Noch hell?“ mit der bereits eindeutigen großen
  Tageslichtantwort. Die korrekten Informationen ließen den Hauptwert dadurch
  trotzdem wie einen Teil eines Textstapels wirken.
- **Folge:** Nur der bei einem Fallback oder einer Geräteortung fachlich
  hilfreiche Herkunftsstatus bleibt sichtbar. Regionskontext und semantische
  Antwortbezeichnung bleiben im Dokumentbaum, werden aber visuell verborgen.
  Hauptwert, Sonne und Ortswechsel bilden die sichtbare Primärhierarchie.
- **Regression:** Kartenhöhe, vertikale Titelmitte und 1-×-1-Pixel-Geometrie
  der redundanten Texte werden auf Desktop und Mobil geprüft; Axe,
  Tastaturfluss, DE/EN und Screenreaderbeschriftung bleiben Teil der Gates.
- **Gültigkeitsgrenze:** Visuelles Verbergen ist nur zulässig, wenn der
  verbleibende sichtbare Kontext eindeutig ist. Fachlich notwendige Warnungen,
  Polarzustände und Fehler dürfen nicht aus Platzgründen verborgen werden.
