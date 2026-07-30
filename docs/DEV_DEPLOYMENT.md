# Unabhängiges DEV-Deployment

Stand: 30. Juli 2026.

## Öffentlicher Vertrag

- App-Key: `daylight`
- Umgebung: `DEV`
- Production-Freigabe: `false`
- Login: keiner
- URL: `https://drmilos33.github.io/MilosApps-NochHell-DEV/`
- Health:
  `https://drmilos33.github.io/MilosApps-NochHell-DEV/health.json`
- Repository:
  `https://github.com/DrMilos33/MilosApps-NochHell-DEV`
- Git-Remote:
  `https://github.com/DrMilos33/MilosApps-NochHell-DEV.git`

Die App läuft statisch über GitHub Pages. Pages erzwingt HTTPS und liest den
Root des Branches `gh-pages`. Es gibt keine Shared-Runtime-Abhängigkeit,
App-Datenbank, Portal-Session oder Production-Domain.

## Revisionen und Herkunft

| Rolle | Vollständiger SHA |
| --- | --- |
| Verifizierter App-Quellstand | `f4ee359367f9b89766976a627bc6b9a82719f89f` |
| Gebautes Pages-Artefakt | `2735413d04d1a300fc67424f3e2e50f3ea0d93e0` |

Das Pages-Artefakt wurde ausschließlich mit `pnpm build` aus der
Quellrevision `f4ee359367f9b89766976a627bc6b9a82719f89f` erzeugt. Der
anschließende Dokumentationscommit wird nicht als anderer App-Build
veröffentlicht.

## Readiness

Die absolute Health-URL antwortet aktuell mit:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.1.0",
  "environment": "dev",
  "database": false
}
```

Ein HTTP-200 allein genügt nicht. Verbraucher müssen mindestens
`status=ready`, `appKey=daylight` und `environment=dev` prüfen.

## App-eigener Lifecycle

Ein DEV-Update beginnt immer mit einer ausdrücklich freigegebenen und
vollständig geprüften Quellrevision. Danach:

1. Quellrevision und sauberen Arbeitsbaum bestätigen.
2. `pnpm test:all` und `pnpm build` ausführen.
3. ausschließlich `dist/` in einen neuen `gh-pages`-Artefaktcommit übernehmen;
4. `gh-pages` pushen und den GitHub-Pages-Buildstatus prüfen;
5. Healthcheck sowie frische Smartphone-/Desktop-Smokes gegen HTTPS ausführen;
6. erst danach die neue gesunde Artefaktrevision dokumentieren und an Portal
   sowie Struktur melden.

Quellbranch und `gh-pages` sind bewusst getrennt. GitHub Pages ist der eigene
DEV-Hostingdienst; das Portal ist weder Build- noch Laufzeitvoraussetzung.

## Rollback

Die letzte gesunde DEV-Artefaktrevision ist
`2735413d04d1a300fc67424f3e2e50f3ea0d93e0`.

Ein Rollback setzt ausschließlich den Remote-Branch `gh-pages` auf die letzte
gesunde Artefaktrevision zurück und prüft anschließend Pages-Buildstatus,
Health-Inhalt und Direktaufruf erneut. Der Quellbranch bleibt unverändert.
Portal-Redirects werden ausschließlich durch Portal & Identity zurückgerollt.

## Netzgrenze

Astronomische Berechnung, gewählter Ort und grobe Gerätekoordinaten bleiben
lokal. Eine neue manuelle Ortssuche sendet den eingegebenen Ortsnamen bewusst
an den konfigurierten Nominatim-Endpunkt. Ist das Netz nicht erreichbar, zeigt
die App ausdrücklich:

> Du bist offline. Ein gespeicherter Ort funktioniert weiterhin.

Damit ist Offline-Wiederöffnung vom netzabhängigen Ermitteln eines neuen Orts
getrennt.

## Nicht verändert

- keine MilosApps-Production-Domain;
- kein OpenAI-Sites-Deployment;
- keine Portaldatei oder Portalroute;
- keine Shared-Abhängigkeit;
- keine Datenbank und keine Secrets.
