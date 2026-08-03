# Unabhängiges DEV-Deployment

Stand: 3. August 2026.

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
| Verifizierter App-Quellstand | `d5f2d72b66a094b5d96b6029a8e63ec58168037c` |
| Gebautes und extern verifiziertes Pages-Artefakt | `98265792f5c8ff4fc5ab8e5ac4d63faddfabe55a` |
| Vorherige gesunde Quellrevision | `e0e1dc95f31fba7dc390d1e4c4cb57663d85193e` |
| Vorherige gesunde Pages-Revision | `f3bae04b8b9e64f8fa3790c0d020504e0c22d2db` |

Das Pages-Artefakt wurde ausschließlich mit `pnpm build` aus der
Quellrevision `d5f2d72b66a094b5d96b6029a8e63ec58168037c` erzeugt. Der
anschließende Dokumentationscommit wird nicht als anderer App-Build
veröffentlicht.

GitHub Pages veröffentlichte die Artefaktrevision über den erfolgreichen
Workflow-Run `30804537717` (Build-Job `91656693505`, Deploy-Job
`91656720225`). Die frische
externe Prüfung umfasste direkte cookie-lose Desktop- und Smartphone-Aufrufe,
echte dynamische Open-Meteo-Vorschläge ohne Enter, Außenklick, Escape,
Pfeiltasten, eine einzige Listbox im normalen Seitenfluss,
Offline-Wiederöffnung, DE/EN-Persistenz und 360 × 800 bei 200 Prozent. Unter
einer echten Response-CSP mit `style-src 'self'` blieben
Shell- und Essentials-CSS extern; es gab weder Inline-Ausnahmen noch
CSP-Fehler. Das Loader-Icon antwortete mit HTTP 200 und `image/svg+xml`; sein
SHA-256 `fe3be26d339687cfcc22809b4c9eeac055166ba512977faa709fa959a1cad645`
stimmte bytegenau mit `public/daylight-icon.svg` überein. Die beiden
app-eigenen Inline-Links maßen in Desktop, 390 × 844 und 360 × 800 bei
200 Prozent mindestens 49,69 × 44 beziehungsweise 152,25 × 44 Pixel.

Das Zwischenartefakt `e49c6b2242aa4ca73007493fff9f06d149f1360c`
wurde durch die externe Netzgrenzen-QA verworfen und nie als gesunde Revision
dokumentiert.

## Readiness

Die absolute Health-URL antwortet aktuell mit:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.7.0",
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
`98265792f5c8ff4fc5ab8e5ac4d63faddfabe55a`. Der unmittelbare Rückfallstand ist
die vorherige gesunde Revision
`f3bae04b8b9e64f8fa3790c0d020504e0c22d2db`, gebaut aus
`e0e1dc95f31fba7dc390d1e4c4cb57663d85193e`.

Ein Rollback veröffentlicht den Inhalt der vorherigen gesunden
Artefaktrevision erneut als neuen, vorwärts gerichteten `gh-pages`-Commit und
prüft anschließend Pages-Buildstatus, Health-Inhalt und Direktaufruf. Ein
Force-Push ist dafür nicht erforderlich. Der Quellbranch bleibt unverändert.
Portal-Redirects werden ausschließlich durch Portal & Identity zurückgerollt.

## Netzgrenze

Astronomische Berechnung, gewählter Ort und grobe Gerätekoordinaten bleiben
lokal. Ab drei Zeichen sendet die App den eingegebenen Suchtext bewusst an den
konfigurierten Open-Meteo-Vorschlagsendpunkt. Die genauere manuelle Suche
sendet ihn erst nach Enter oder „Suchen“ an den konfigurierten Nominatim-
Endpunkt. Ist das Gerät sicher offline, zeigt die App ausdrücklich:

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
- keine Shared-Runtime-Abhängigkeit;
- keine Datenbank und keine Secrets.
