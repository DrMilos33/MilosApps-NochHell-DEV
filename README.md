# Noch hell?

`Noch hell?` ist ein öffentlicher, fokussierter Tageslichthelfer mit dem
MilosApps-App-Key `daylight`. Nach manueller Ortssuche oder optionaler
Geräteortung zeigt die Web-App:

- ob und wie lange es noch hell ist;
- Sonnenaufgang, Sonnenuntergang und Ende der bürgerlichen Dämmerung;
- den morgigen Sonnenaufgang;
- ehrliche Zustände für Polartag, Polarnacht, Zeitumstellung und Datumssprung.

Die App benötigt weder Konto noch App-Datenbank. Sie enthält keine Sternkarte
und keinen Wetterbericht. Die gesamte sichtbare Oberfläche ist auf Deutsch und
Englisch verfügbar; die lokale Sprachwahl bleibt nach dem Neuladen erhalten.

## Lokal starten

Voraussetzungen sind Node.js 24 oder neuer und pnpm.

```powershell
pnpm install
pnpm dev
```

Der lokale DEV-Dienst läuft ausschließlich auf
`http://127.0.0.1:4319/`. Der Start verwendet `--strictPort` und bricht bei
einer Portkollision ab; ein bereits laufender fremder Dienst wird nicht
übernommen oder beendet.

Die Readiness wird inhaltlich geprüft:

```powershell
pnpm readiness
```

`/health.json` muss sowohl `status: "ready"` als auch
`appKey: "daylight"` liefern. Ein beliebiger HTTP-200-Response genügt nicht.

## Entwicklung und Tests

```powershell
pnpm test
pnpm build
pnpm test:e2e
pnpm test:all
pnpm verify:dev
pnpm preview:capture
```

- `test` prüft Astronomie, Zeitzonen, Speicherung und Geocoding.
- `test:e2e` führt die Produktmatrix in Chromium, Firefox und einem mobilen
  Chromium-Profil aus.
- `verify:dev` prüft Readiness-Identität und den strikten Abbruch bei
  Portkollision.
- `verify:external-dev` prüft die echte HTTPS-DEV-URL in frischen
  Desktop- und Smartphone-Kontexten einschließlich Sprache, Ortssuche und
  Offline-Netzgrenze sowie die CSP-sicheren externen Shell-Styles.
- `preview:capture` erzeugt das reproduzierbare Portal-Vorschaubild aus der
  eigenen App-Oberfläche.

## Public App Shell

Die App vendort `public-app-shell/v2.0.3` aus dem exakt gepinnten
Shared-Commit `ed898412306e22c6ae1b10ee8953df29f8acd627`. Manifest, Bootstrap,
Web Component, externe Same-Origin-Styles und SHA-256-Lock liegen app-eigen im
Repository; es gibt keinen CDN- oder Runtime-Import aus `MilosApps-Shared`.
Der Vite-Build hält CSS-Assets extern, damit die Shell auch unter
`style-src 'self'` ohne `unsafe-inline`, Nonce oder Hash vollständig gestaltet
bleibt.

Im DEV-Build führen alle Shell-Links absolut zu `https://dev.milos-apps.de`.
DEV-Badge, Linkbasis, Kurzbeschreibung und `productionApproved=false` stammen
gemeinsam aus `milos-app.json`. Die Shell besitzt Header, Footer,
Sprachpersistenz und Locale-Event; Daylight übersetzt weiterhin die gesamte
sichtbare Fachoberfläche. Production bleibt nicht freigegeben.

## Public App Essentials

Loader, Datenschutzinformation, Teilen und Ortssuche stammen app-eigen vendort
aus `public-app-essentials/v1.1.4` am festen Shared-Commit
`b22c94cc6d648fd3052f7d32c9bd80f703094f8d`. Daylight aktiviert keinen
Date-Picker. Die Ortssuche bleibt app-eigene Providerlogik: Open-Meteo liefert
nach einer kurzen Eingabepause dynamische Vorschläge ab drei Zeichen,
Nominatim bleibt die genauere, ausdrücklich per Enter oder „Suchen“ gestartete
Suche mit Takt, Cache, Attribution und austauschbarem Endpunkt. Beide Antworten
werden auf das minimierte Daylight-Ortsschema samt IANA-Zeitzone normalisiert.
Bereits bekannte lokale Orte und der erst nach freiwilliger Freigabe gerundete
eigene Ort werden in dieselbe gemeinsame, kompakte Combobox-/Listbox-Struktur
einsortiert.

`pnpm verify:essentials` prüft Manifest und sechsteiligen Verbraucher-Lock.
Essentials startet vor allen Verbraucher-Modulen; erst nach fachlicher
Bereitschaft beendet `globalThis.milosAppEssentials.ready()` den Loader. Jeder
Build prüft zusätzlich fail-closed, dass CSS, Bootstrap und Runtime als
externe Same-Origin-Dateien unter dem Vendorpfad erhalten und bytegenau zum
Lock geblieben sind. Der Share-Payload verwendet ausschließlich die
kanonische App-URL ohne Suchparameter, Fragment, Ortsname oder Koordinaten.

## Datenschutz und Datenfluss

- Standortzugriff erfolgt nur nach einem bewussten Klick.
- Gerätekoordinaten werden vor der weiteren Verwendung und Speicherung auf
  zwei Nachkommastellen gerundet.
- Der gewählte Ort und ein kleiner Suchcache liegen ausschließlich im lokalen
  Browser-Speicher und lassen sich in der App vollständig löschen.
- Es gibt kein Einwilligungsbanner, weil kein Tracking und keine optionale
  Speicherung stattfinden. Eine kurze dauerhafte Zeile erklärt die belegten
  notwendigen Zugriffe und führt zur Datenschutzseite sowie zur lokalen
  Datenverwaltung.
- Koordinaten erscheinen weder in der Seiten-URL noch in Teil-URLs.
- Ab drei Zeichen wird nur der eingegebene Suchtext für dynamische Vorschläge
  an den konfigurierten Open-Meteo-Endpunkt gesendet. Die genauere manuelle
  Suche fragt Nominatim erst beim Absenden. Es gibt kein serverseitiges
  App-Profil und keine Gerätekoordinaten in diesen Requests.
- Ein gespeicherter Ort öffnet nach einer erfolgreichen Erstladung auch
  offline; eine neue Ortssuche benötigt eine Netzverbindung.

Das vollständige technische Inventar steht unter
[Datenschutz- und Endgerätezugriffe](docs/PRIVACY_INVENTORY.md).

## DEV- und Portalstatus

Der verifizierte App-Stand `d5f2d72b66a094b5d96b6029a8e63ec58168037c`
läuft unabhängig vom Portal als öffentliche HTTPS-DEV-Version:

- DEV: <https://drmilos33.github.io/MilosApps-NochHell-DEV/>
- Health: <https://drmilos33.github.io/MilosApps-NochHell-DEV/health.json>
- GitHub: <https://github.com/DrMilos33/MilosApps-NochHell-DEV>

Das Hosting erfolgt app-eigen über den `gh-pages`-Branch. Production ist
ausdrücklich nicht freigegeben. Portal & Identity hat die DEV-Integration am
30. Juli 2026 final abgenommen: Die Portalroute `/apps/daylight` leitet im
aktiven Portal-DEV ohne Login auf die unabhängige App-URL weiter. Der
Direktaufruf und der App-Lifecycle bleiben vom Portal unabhängig.

Details:

- [Produktbrief](docs/PRODUCT_BRIEF.md)
- [Quellen und Lizenzen](docs/SOURCES_AND_LICENSES.md)
- [QA-Bericht](docs/QA_REPORT.md)
- [DEV-Deployment](docs/DEV_DEPLOYMENT.md)
- [DEV- und Portalübergabe](docs/DEV_HANDOFF.md)
- [Gepinnte Shared-Verträge](docs/SHARED_CONTRACTS.md)
- [Datenschutz- und Endgerätezugriffe](docs/PRIVACY_INVENTORY.md)
- [Erkenntnisse](docs/LEARNINGS.md)
