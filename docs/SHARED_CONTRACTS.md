# Gepinnte Shared-Verträge

Stand: 30. Juli 2026.

## `public-app-shell/v1`

| Feld | Wert |
| --- | --- |
| Contract-ID | `public-app-shell/v1` |
| Version | `1.0.0` |
| Shared-Commit | `f49b2c2b5bf1071f2f1ffb3e24b877251fffd2b4` |
| Shared-Tag | `public-app-shell-v1.0.0` |
| Quelle | `MilosApps-Shared/contracts/public-app-shell/v1/` |
| Runtime-Abhängigkeit | keine |
| Production-Freigabe | `false` |

Die Übernahme ist vollständig app-eigen. Dieses Repository importiert zur
Laufzeit keine Datei aus `MilosApps-Shared`.

Umgesetzt sind:

- normal fließender semantischer Header mit eigenem Sonnenaufgang-SVG,
  `MilosApps`, DEV-Badge, DE/EN und `Alle Apps`/`All apps`;
- vollständige sichtbare DE-/EN-Oberfläche einschließlich dynamischer
  Sonnenzustände, Suche, Standort-, Speicher-, Offline- und Fehlermeldungen;
- Persistenz unter `milosapps.daylight.language` mit sicherem DE-Fallback;
- absolute Portal-, App-Verzeichnis-, Impressums- und Datenschutzlinks aus
  derselben expliziten DEV-/Production-Umgebung wie das DEV-Badge;
- kompakter Footer mit App-Text, Attribution und den drei Pflichtlinks;
- 44-Pixel-Ziele, sichtbarer Fokus, Reduced Motion, 390-Pixel-Reflow und
  200-Prozent-Zoomabdeckung.

Die explizite Umgebung steht in `public/runtime-config.json`. Der veröffentlichte
DEV-Build verwendet `environment=dev`; die vorhandene Production-Abbildung ist
nur getestet und nicht veröffentlicht.

## Rollback

Ein Rollback setzt den app-eigenen Quell- und Pages-Stand auf die letzte
gesunde Daylight-DEV-Revision zurück. Shared selbst wird nicht verändert und
erzwingt kein Deployment.
