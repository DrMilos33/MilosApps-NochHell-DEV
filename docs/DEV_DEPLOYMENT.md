# Unabhängiges DEV-Deployment

Stand: 4. August 2026.

## Öffentlicher Vertrag

- App-Key: `daylight`
- Umgebung: `DEV`
- Production-Freigabe: `false`
- Login: keiner
- URL: `https://drmilos33.github.io/MilosApps-NochHell-DEV/`
- Reversibler DEV-Alias: `https://sinddielampenan.de/`
- Reversibler WWW-Alias: `https://www.sinddielampenan.de/`
- Health:
  `https://drmilos33.github.io/MilosApps-NochHell-DEV/health.json`
- Repository:
  `https://github.com/DrMilos33/MilosApps-NochHell-DEV`
- Git-Remote:
  `https://github.com/DrMilos33/MilosApps-NochHell-DEV.git`

Die App läuft statisch über GitHub Pages. Pages erzwingt HTTPS und liest den
Root des Branches `gh-pages`. Es gibt keine Shared-Runtime-Abhängigkeit,
App-Datenbank, Portal-Session oder Production-Domain.

## Porkbun-Weiterleitung

Porkbun leitet den Apex `sinddielampenan.de` und durch aktiviertes Wildcard-
Forwarding auch `www.sinddielampenan.de` temporär mit HTTP 302 auf die
kanonische GitHub-Pages-DEV-URL weiter. `Include Path` ist deaktiviert: Auch
ein Aufruf mit zusätzlichem Pfad landet bewusst an der App-Wurzel. HTTP und
HTTPS liefern für Apex und WWW jeweils exakt diese `Location`:

```text
https://drmilos33.github.io/MilosApps-NochHell-DEV/
```

Die automatisch bereitgestellte TLS-Verbindung ist aktiv. Der Alias verändert
weder App-Artefakt noch Portalroute, Shared-Verträge oder Production. Der
Rollback besteht ausschließlich darin, den URL-Forward bei Porkbun zu
entfernen; GitHub Pages und `/apps/daylight` bleiben dabei unverändert.

## Revisionen und Herkunft

| Rolle | Vollständiger SHA |
| --- | --- |
| Verifizierter App-Quellstand | `8401b8d34d9eed57f6ca840da3c6e34be6b2bc8a` |
| Gebautes und extern verifiziertes Pages-Artefakt | `25a34d537feef2c5af544a4e87737aad071ea9fd` |
| Vorherige gesunde Quellrevision | `eb0af83ef0f9234819107ceab19a729895850021` |
| Vorherige gesunde Pages-Revision | `d13eb3c842978a8e556b79a58e2ab82417e9cab1` |

Das Pages-Artefakt wurde ausschließlich mit `pnpm build` aus der
Quellrevision `8401b8d34d9eed57f6ca840da3c6e34be6b2bc8a` erzeugt. Der
anschließende Dokumentationscommit wird nicht als anderer App-Build
veröffentlicht.

GitHub Pages veröffentlichte die Artefaktrevision über den erfolgreichen
Workflow-Run `30824548875` (Build-Job `91722685464`, Status-Job
`91722751562`, Deploy-Job `91722751576`). Die Antwortfläche priorisiert nun
Ort, verbleibende Helligkeit und Aktualisierungszeit als drei ruhige Ebenen.
Redundante sichtbare Überzeilen und der technische Zeitzonentext sind aus der
Kachel entfernt; ihr notwendiger Kontext bleibt für assistive Technik
erhalten. Die Antwort misst 244 Pixel auf Desktop und 252 Pixel bei 390 Pixel
Breite, während der Hauptwert in beiden Profilen vertikal in der Kartenmitte
bleibt. 30 Unit-/Fachtests, 52 Chromium-Fälle, zehn fokussierte
Mobile-Chromium- und drei fokussierte Firefox-Fälle bestanden. Die frische
externe Matrix bestätigte No-Login, DE/EN-Persistenz, echte Ortssuche,
Offline-Wiederöffnung, strikte CSP, 1440 × 900, 390 × 844 sowie 360 × 800 bei
200 Prozent ohne horizontalen Überlauf und ohne Browserfehler.

Das Zwischenartefakt `e49c6b2242aa4ca73007493fff9f06d149f1360c`
wurde durch die externe Netzgrenzen-QA verworfen und nie als gesunde Revision
dokumentiert.

## Readiness

Die absolute Health-URL antwortet aktuell mit:

```json
{
  "status": "ready",
  "appKey": "daylight",
  "version": "0.8.1",
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
`25a34d537feef2c5af544a4e87737aad071ea9fd`. Der unmittelbare Rückfallstand ist
die vorherige gesunde Revision
`d13eb3c842978a8e556b79a58e2ab82417e9cab1`, gebaut aus
`eb0af83ef0f9234819107ceab19a729895850021`.

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
- keine eigenständige Production-Bereitstellung unter `sinddielampenan.de`;
- kein OpenAI-Sites-Deployment;
- keine Portaldatei oder Portalroute;
- keine Shared-Runtime-Abhängigkeit;
- keine Datenbank und keine Secrets.
