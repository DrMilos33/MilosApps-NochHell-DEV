# Noch hell?

`Noch hell?` ist ein öffentlicher, fokussierter Tageslichthelfer mit dem
MilosApps-App-Key `daylight`. Nach manueller Ortssuche oder optionaler
Geräteortung zeigt die Web-App:

- ob und wie lange es noch hell ist;
- Sonnenaufgang, Sonnenuntergang und Ende der bürgerlichen Dämmerung;
- den morgigen Sonnenaufgang;
- ehrliche Zustände für Polartag, Polarnacht, Zeitumstellung und Datumssprung.

Die App benötigt weder Konto noch App-Datenbank. Sie enthält keine Sternkarte
und keinen Wetterbericht.

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
ausdrücklich nicht freigegeben. Die Portalroute `/apps/daylight` bleibt bis
zur Validierung und Einbindung durch den Portal-Task unverändert.

Details:

- [Produktbrief](docs/PRODUCT_BRIEF.md)
- [Quellen und Lizenzen](docs/SOURCES_AND_LICENSES.md)
- [QA-Bericht](docs/QA_REPORT.md)
- [DEV-Deployment](docs/DEV_DEPLOYMENT.md)
- [DEV- und Portalübergabe](docs/DEV_HANDOFF.md)
- [Erkenntnisse](docs/LEARNINGS.md)
