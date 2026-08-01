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
| Deployte Quellrevision | `6d48e47ad6189cc98a22ca0424da1360c92bf1d6` |
| Pages-Artefaktrevision | `2fb055e6b7f4a038142a82309d65a362b2e9ab6f` |
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
  "version": "0.3.1",
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
App-QA erfolgte ohne Portal-Cookie oder Loginzustand.

Portal & Identity bestätigte anschließend den aktiven Gate-Stand
`9643129b5688e4bd925b3ac198619ac260a61071` und das erfolgreiche
Railway-Staging-Deployment `f82ad853-1134-48cb-a67d-bb05bf754b99`.
Cookie-lose GET- und HEAD-Aufrufe von `/apps/daylight` liefern jeweils HTTP 302
mit exakt der unabhängigen Daylight-DEV-URL als Ziel. App und Health liefern
HTTP 200; die Health-Antwort stimmt mit `ready/daylight/0.3.0/dev` überein.
Portal-CI Run `30703116695` / Job `91377476515` war vollständig erfolgreich.

Aktuell gesund ist `2fb055e6b7f4a038142a82309d65a362b2e9ab6f`. Der
app-eigene Rollback veröffentlicht den Inhalt der vorherigen gesunden
Artefaktrevision `53acdf37d08fdb0a21881119d35b6d7bfe390394` als neuen
vorwärts gerichteten `gh-pages`-Commit. Die Quellrevision bleibt davon
unberührt. Ein Portal-Rollback gehört ausschließlich dem Portal-Task.

## Verbleibende Blocker und Grenzen

1. Dieses Eigentümer-Task läuft vorübergehend aus dem Workspace-Projekt. Das
   Repository muss als eigenes lokales Codex-Projekt registriert und die
   Fortsetzung dorthin übergeben werden.
2. GitHub Pages besitzt keine eigene App-Datenbank oder Secrets; neue
   Ortssuchen bleiben von der Erreichbarkeit des konfigurierten
   Nominatim-Dienstes abhängig.

Die Portal-DEV-Validierung und -route sind abgeschlossen. Der historische
Actions-Lauf vom 30. Juli startete wegen des damaligen Billing-/Spending-Limits
keinen Step; die aktuelle Gate-Revision besitzt dagegen den oben genannten
vollständig erfolgreichen CI- und Railway-Nachweis. Dies ist kein Blocker für
die aktive `daylight`-DEV-Route.

Nach dem kompakten App-DEV-Update auf 0.3.1 wurde die unveränderte Portalroute
erneut read-only ohne Cookies geprüft. GET und HEAD liefern weiterhin HTTP 302
auf exakt die unabhängige Daylight-DEV-URL; App und Health antworten HTTP 200,
die aktuelle Health-Identität ist `ready/daylight/0.3.1/dev`. Weder Portalcode
noch Portal-Deployment wurden dafür verändert.

Portal & Identity bestätigte diese Revalidierung anschließend auf dem aktiven
Portal-DEV-Stand `ca84446a263d4fc0d38c177da606ae5ae3cde34c` und dem
Railway-Deployment `59ebcbec-fedc-4cc0-8d17-e59e353278b6`: cookie-lose GET-
und HEAD-Aufrufe liefern exakt denselben Redirect, App und Health HTTP 200 und
die vollständige Health-Antwort für 0.3.1. Daylight verursachte keine
Portalmutation; Production blieb unverändert.

OpenAI Sites, MilosApps-Production und das Portal-Repository wurden nicht
verändert.
