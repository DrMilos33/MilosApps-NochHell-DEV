# QA-Plan: Noch hell?

Der geplante Miteinander-Product-QA-Zyklus wurde am 30. Juli 2026 mit zwei
vollständigen Verbesserungsrunden abgeschlossen. Ergebnisse, Defekte,
Regressionen, Browserabdeckung und bekannte Grenzen stehen im
[QA-Bericht](QA_REPORT.md).

## Verbindliche Abdeckung

- Sonnenaufgang, Sonnenuntergang und bürgerliche Dämmerung gegen
  USNO-Referenzen;
- Zeitzonen, Sommerzeit, Mitternachtswechsel und Datumssprung;
- Äquator, hohe Breiten, Polartag und verschiedene Polarnacht-Zustände;
- Resthelligkeit vor und nach Sonnenuntergang;
- Standort erlaubt, verweigert/abgebrochen, Timeout und nicht verfügbar;
- manueller, unbekannter und mehrere gleichnamige Orte;
- Smartphone, Desktop, Tastatur, Semantik/Screenreader-Baum,
  200-Prozent-Reflow und helle/dunkle Darstellung;
- langsames Geocoding, Abbruch, Suchcache, Offline-Wiederöffnung und
  App-Resume über Sonnenuntergang, Dämmerungsende und lokale Mitternacht;
- App-spezifische Readiness auf dem strikt reservierten Port 4319.
- vollständige DE-/EN-Umschaltung von Shell, Suche, Ergebnisansicht,
  Sonnenzeiten und Fehlerzuständen mit Persistenz nach Reload;
- Production-Linkabbildung, `productionApproved=true`, verborgenes DEV-Badge,
  semantische Header-/Nav-/Main-/Footer-Struktur und genau ein Haupt-H1;
- 44-Pixel-Shellziele, Fokusreihenfolge, Reduced Motion sowie Header und Footer
  bei Desktop, 390 × 844 und 200-Prozent-Reflow.
- app-eigene Inline-Links für Datenschutz und Open‑Meteo-/GeoNames-Attribution als
  echte mindestens 44 × 44 Pixel große Ziele in DE und EN;
- CSS-first Loader bei langsamem Start mit exakt 32 × 32 Pixel großem Icon in
  Quellmarkup, Desktop, Mobil und 200-Prozent-Reflow sowie genau einer
  Dokumentüberschrift;
- vollständiges Cookie-/LocalStorage-/CacheStorage-Inventar; bei ausschließlich
  notwendigen Zugriffen eine dauerhaft erreichbare kurze Information in DE/EN
  ohne Banner, Einwilligungsattrappe oder Dismiss-Key;
- Migration der alten Orts-/Cache-Keys in den app-namensräumigen Bestand sowie
  vollständiges Löschen von Ort, Suchcache und gerundetem Gerätevorschlag;
- Teilen nativ mit stillem Erfolg und Abbruch, geometrisch stabilem
  Clipboard-/Fehler-Toast sowie kanonischer, ortsneutraler URL;
- gemeinsame Combobox-/Listbox-Ortssuche für Stadt und Region mit dynamischen
  Open‑Meteo-Vorschlägen ab drei Zeichen und demselben geprüften Provider für
  ausdrücklich abgesendete Enter-/Suchen-Aktionen;
- lokale letzte Orte, freiwillig gerundeter Geräteort und dynamische
  Providerergebnisse in genau einer Liste, ohne automatische Permission;
  geschlossene Liste bei leerer/unpassender Eingabe, Escape, Auswahl und
  Pointerinteraktion außerhalb;
- 3-Zeichen-Grenze, Debounce, flüchtiger begrenzter Vorschlagscache,
  Providerfehler, Offline-Fallback, Abort sowie veraltete/verspätete Antworten;
- kompakte Ortskarte auf Desktop, 44 × 44 Pixel große Icon-Aktion für den
  Gerätestandort und vollständige zugängliche Beschriftung trotz reduziertem
  visuellen Platzbedarf;
- Abort-, Escape- und verspätete Providerantworten dürfen weder alte
  Ergebnislisten noch falsche Busy-Zustände wiederherstellen;
- sechsteiliger Essentials-Verbraucher-Lock einschließlich Schema, externe
  Same-Origin-CSS-/JS-Dateien,
  korrekte MIME-Typen und strikte `style-src 'self'`-/`script-src 'self'`-CSP.

## Wiederholung vor der Production-Veröffentlichung

```powershell
pnpm verify:shell
pnpm test:all
pnpm verify:production
```

`pnpm readiness` kann zusätzlich gegen einen separat gestarteten
Production-Preview laufen. Nach einem Cloudflare-Deploy prüft
`verify:external-production` die echte HTTPS-URL, No-Login, Source-Health,
Provider, Offlinegrenze, CSP, Desktop, Smartphone und Reflow. Die Portalroute
wird erst nach gesundem App-Production-Stand im Portal-Lifecycle aktiviert.
