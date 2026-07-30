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
| Verifizierter App-Quellstand | `e31603a9f0fb532bf0accaa2a97b62f398785a2f` |
| Gebautes und extern verifiziertes Pages-Artefakt | `269faf8611fc17777af997eea846fc20cbaf4238` |
| Vorherige gesunde Quellrevision | `f4ee359367f9b89766976a627bc6b9a82719f89f` |
| Vorherige gesunde Pages-Revision | `2735413d04d1a300fc67424f3e2e50f3ea0d93e0` |

Das Pages-Artefakt wurde ausschließlich mit `pnpm build` aus der
Quellrevision `e31603a9f0fb532bf0accaa2a97b62f398785a2f` erzeugt. Der
anschließende Dokumentationscommit wird nicht als anderer App-Build
veröffentlicht.

Das Zwischenartefakt `e49c6b2242aa4ca73007493fff9f06d149f1360c`
wurde durch die externe Netzgrenzen-QA verworfen und nie als gesunde Revision
dokumentiert.

## Readiness

Die absolute Health-URL antwortet aktuell mit:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.2.0",
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

Die aktuelle gesunde DEV-Artefaktrevision ist
`269faf8611fc17777af997eea846fc20cbaf4238`. Der unmittelbare Rückfallstand ist
die vorherige gesunde Revision
`2735413d04d1a300fc67424f3e2e50f3ea0d93e0`, gebaut aus
`f4ee359367f9b89766976a627bc6b9a82719f89f`.

Ein Rollback veröffentlicht den Inhalt der vorherigen gesunden
Artefaktrevision erneut als neuen, vorwärts gerichteten `gh-pages`-Commit und
prüft anschließend Pages-Buildstatus, Health-Inhalt und Direktaufruf. Ein
Force-Push ist dafür nicht erforderlich. Der Quellbranch bleibt unverändert.
Portal-Redirects werden ausschließlich durch Portal & Identity zurückgerollt.

## Netzgrenze

Astronomische Berechnung, gewählter Ort und grobe Gerätekoordinaten bleiben
lokal. Eine neue manuelle Ortssuche sendet den eingegebenen Ortsnamen bewusst
an den konfigurierten Nominatim-Endpunkt. Ist das Gerät sicher offline, zeigt
die App ausdrücklich:

> Du bist offline. Ein gespeicherter Ort funktioniert weiterhin.

Scheitert der Fetch, obwohl der Browser seinen Online-Status nicht korrekt
aktualisiert, lautet die sichere Aussage:

> Eine neue Ortssuche braucht eine erreichbare Netzwerkverbindung. Ein
> gespeicherter Ort funktioniert weiterhin.

Damit ist Offline-Wiederöffnung vom netzabhängigen Ermitteln eines neuen Orts
getrennt.

## Nicht verändert

- keine MilosApps-Production-Domain;
- kein OpenAI-Sites-Deployment;
- keine Portaldatei oder Portalroute;
- keine Shared-Abhängigkeit;
- keine Datenbank und keine Secrets.
