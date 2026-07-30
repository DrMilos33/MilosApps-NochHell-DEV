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
- `preview:capture` erzeugt das reproduzierbare Portal-Vorschaubild aus der
  eigenen App-Oberfläche.

## Public App Shell

Die App adaptiert `public-app-shell/v1` aus dem exakt gepinnten
Shared-Commit `f49b2c2b5bf1071f2f1ffb3e24b877251fffd2b4` beziehungsweise Tag
`public-app-shell-v1.0.0`. Header, Sprache, Umgebungslinks und Footer sind
app-eigener Code; es gibt keinen Runtime-Import aus `MilosApps-Shared`.

Im DEV-Build führen alle Shell-Links absolut zu `https://dev.milos-apps.de`.
Das DEV-Badge und diese Linkbasis stammen aus derselben expliziten
Runtime-Umgebung. Production bleibt nicht freigegeben.

## Datenschutz und Datenfluss

- Standortzugriff erfolgt nur nach einem bewussten Klick.
- Gerätekoordinaten werden vor der weiteren Verwendung und Speicherung auf
  zwei Nachkommastellen gerundet.
- Der gewählte Ort und ein kleiner Suchcache liegen ausschließlich im lokalen
  Browser-Speicher und lassen sich in der App vollständig löschen.
- Koordinaten erscheinen weder in der Seiten-URL noch in Teil-URLs.
- Manuelle Suchen werden erst beim Absenden an den konfigurierten
  Nominatim-Endpunkt geschickt. Es gibt kein serverseitiges Profil und kein
  Autocomplete.
- Ein gespeicherter Ort öffnet nach einer erfolgreichen Erstladung auch
  offline; eine neue Ortssuche benötigt eine Netzverbindung.

## DEV- und Portalstatus

Der verifizierte App-Stand `f4ee359367f9b89766976a627bc6b9a82719f89f`
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
- [Erkenntnisse](docs/LEARNINGS.md)
