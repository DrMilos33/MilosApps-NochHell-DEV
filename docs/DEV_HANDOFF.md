# DEV- und Portalübergabe

Stand: 1. August 2026.

## Metadaten

| Feld | Wert |
| --- | --- |
| App-Key | `daylight` |
| Titel | Noch hell? |
| Kurzbeschreibung | Zeigt für einen gewählten Ort, wie lange es noch hell ist, wann die bürgerliche Dämmerung endet und wann morgen die Sonne aufgeht. |
| Sprachen | `de-DE`, `en-GB`; vollständige Umschaltung mit lokaler Persistenz |
| Konto | keines; vollständig öffentlich |
| Status | unabhängiges öffentliches HTTPS-DEV bereit |
| Externe DEV-URL | `https://drmilos33.github.io/MilosApps-NochHell-DEV/` |
| Lokale DEV-URL | `http://127.0.0.1:4319/` |
| Aktive Portal-DEV-Route | `/apps/daylight` |
| App-Datenbank | keine |
| Production | nicht freigegeben |
| GitHub-Repository | `https://github.com/DrMilos33/MilosApps-NochHell-DEV` |
| Deployte Quellrevision | `97efdc563e70c01ea4ae31f0d097df111e99e645` |
| Pages-Artefaktrevision | `53acdf37d08fdb0a21881119d35b6d7bfe390394` |
| Gepinnter Shell-Vertrag | `public-app-shell-v2.0.3` aus Shared `ed898412306e22c6ae1b10ee8953df29f8acd627` |

## Readiness

```text
GET http://127.0.0.1:4319/health.json
```

Extern:

```text
GET https://drmilos33.github.io/MilosApps-NochHell-DEV/health.json
```

Erforderlicher Inhalt:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.3.0",
  "environment": "dev",
  "database": false
}
```

Portal und E2E dürfen den Dienst nur akzeptieren, wenn mindestens
`status=ready`, `appKey=daylight` und `environment=dev` übereinstimmen. Der
Start bricht bei einer Portkollision ab und beendet keinen bestehenden
Prozess.

## Vorschaubild

- Datei: `public/portal-preview.png`
- Erzeugung: `pnpm preview:capture`
- Rechte: ausschließlich Screenshot der eigenen `Noch hell?`-Oberfläche;
  keine fremden Bildassets oder Kartenkacheln.
- OpenStreetMap-Attribution betrifft nur Suchdaten und ist in der laufenden App
  sichtbar; sie ist nicht Bestandteil des Vorschaubildmotivs.

## Portalvertrag und Rollback

Bekannter Portalvertrag:

- Portal-Branch `codex/portal-dev-integration-contract`
- Portal-Commit `708669c`
- Datei `DEV_APP_INTEGRATION_CONTRACT.md`

Portal & Identity hat die DEV-Integration am 30. Juli 2026 final abgenommen.
Der Portal-Integrationscommit `eab551a` ist direkter Vorgänger des dabei
aktiven Railway-Stands `e74bc712`. Die Route `/apps/daylight` leitet im
Portal-DEV auf die oben genannte unabhängige HTTPS-DEV-URL weiter. `/apps`
zeigt die Karte „Noch hell?“.

Die Portalprüfung umfasste Direktaufruf, Desktop und 390 Pixel Breite ohne
Login, Browserfehler oder horizontalen Überlauf. Production zeigt die Karte
nicht und blieb unverändert. Der App-Direktaufruf und die App-Readiness bleiben
auch bei einem Portal-Ausfall unabhängig verfügbar.

Nach dem v2.0.3-Shell-Update wurde die unveränderte Portal-DEV-Route erneut
read-only aufgerufen. `https://dev.milos-apps.de/apps/daylight` leitete auf die
exakte unabhängige App-URL weiter. Der Zielstand wies
`appKey=daylight`, `environment=dev`, das DEV-Badge, die vollständige
Sprachumschaltung und den absoluten DEV-Link zu „Alle Apps“ aus. Bei
390 × 844 und 1440 × 900 trat kein horizontaler Überlauf auf. Die frische
App-QA erfolgte ohne Portal-Cookie oder Loginzustand; Portal & Identity erhält
den finalen Stand anschließend zur separaten read-only Revalidierung.

Aktuell gesund ist `53acdf37d08fdb0a21881119d35b6d7bfe390394`. Der
app-eigene Rollback veröffentlicht den Inhalt der vorherigen gesunden
Artefaktrevision `269faf8611fc17777af997eea846fc20cbaf4238` als neuen
vorwärts gerichteten `gh-pages`-Commit. Die Quellrevision bleibt davon
unberührt. Ein Portal-Rollback gehört ausschließlich dem Portal-Task.

## Verbleibende Blocker und Grenzen

1. Dieses Eigentümer-Task läuft vorübergehend aus dem Workspace-Projekt. Das
   Repository muss als eigenes lokales Codex-Projekt registriert und die
   Fortsetzung dorthin übergeben werden.
2. GitHub Pages besitzt keine eigene App-Datenbank oder Secrets; neue
   Ortssuchen bleiben von der Erreichbarkeit des konfigurierten
   Nominatim-Dienstes abhängig.

Die Portal-DEV-Validierung und -route sind abgeschlossen. Der zugehörige
GitHub-Actions-Lauf scheiterte laut Portal-Task vor dem ersten Step
ausschließlich am Billing-/Spending-Limit; die aktive Railway-Integration
wurde separat live sowie mit lokalen Portaltests validiert. Dies ist kein
Blocker für die aktive `daylight`-DEV-Route.

OpenAI Sites, MilosApps-Production und das Portal-Repository wurden nicht
verändert.
