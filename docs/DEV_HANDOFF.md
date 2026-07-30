# DEV- und Portalübergabe

Stand: 30. Juli 2026.

## Metadaten

| Feld | Wert |
| --- | --- |
| App-Key | `daylight` |
| Titel | Noch hell? |
| Kurzbeschreibung | Zeigt für einen gewählten Ort, wie lange es noch hell ist, wann die bürgerliche Dämmerung endet und wann morgen die Sonne aufgeht. |
| Sprache | `de-DE` |
| Konto | keines; vollständig öffentlich |
| Status | unabhängiges öffentliches HTTPS-DEV bereit |
| Externe DEV-URL | `https://drmilos33.github.io/MilosApps-NochHell-DEV/` |
| Lokale DEV-URL | `http://127.0.0.1:4319/` |
| Gewünschte Portalroute | `/apps/daylight` |
| App-Datenbank | keine |
| Production | nicht freigegeben |
| GitHub-Repository | `https://github.com/DrMilos33/MilosApps-NochHell-DEV` |
| Deployte Quellrevision | `f4ee359367f9b89766976a627bc6b9a82719f89f` |
| Pages-Artefaktrevision | `2735413d04d1a300fc67424f3e2e50f3ea0d93e0` |

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
  "version": "0.1.0",
  "environment": "dev",
  "database": false
}
```

Portal und E2E dürfen den Dienst nur akzeptieren, wenn mindestens
`status=ready` und `appKey=daylight` übereinstimmen. Der Start bricht bei einer
Portkollision ab und beendet keinen bestehenden Prozess.

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

Die spätere stabile Portalroute `/apps/daylight` soll ausschließlich auf die
oben genannte unabhängige HTTPS-DEV-URL weiterleiten. Die App bleibt ohne
Portal-Login nutzbar. Portal-Ausfall beeinflusst Direktaufruf und
App-Readiness nicht.

Der app-eigene Rollback erfolgt durch Zurücksetzen des `gh-pages`-Branches auf
die letzte gesunde Artefaktrevision. Aktuell ist dies
`2735413d04d1a300fc67424f3e2e50f3ea0d93e0`. Die Quellrevision bleibt davon
unberührt. Ein Portal-Rollback gehört ausschließlich dem Portal-Task.

## Verbleibende Blocker und Grenzen

1. Die Portalroute bleibt bis zur Validierung durch Portal & Identity
   unverändert.
2. Dieses Eigentümer-Task läuft vorübergehend aus dem Workspace-Projekt. Das
   Repository muss als eigenes lokales Codex-Projekt registriert und die
   Fortsetzung dorthin übergeben werden.
3. GitHub Pages besitzt keine eigene App-Datenbank oder Secrets; neue
   Ortssuchen bleiben von der Erreichbarkeit des konfigurierten
   Nominatim-Dienstes abhängig.

OpenAI Sites, MilosApps-Production und das Portal-Repository wurden nicht
verändert.
