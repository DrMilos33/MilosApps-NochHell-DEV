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
- DEV-Linkabbildung, `productionApproved=false`, DEV-Badge, semantische
  Header-/Nav-/Main-/Footer-Struktur und genau ein Haupt-H1;
- 44-Pixel-Shellziele, Fokusreihenfolge, Reduced Motion sowie Header und Footer
  bei Desktop, 390 × 844 und 200-Prozent-Reflow.
- app-eigene Inline-Links für Datenschutz und OpenStreetMap-Attribution als
  echte mindestens 44 × 44 Pixel große Ziele in DE und EN;
- CSS-first Loader bei langsamem Start mit höchstens 56 Pixel Desktop und
  48 Pixel mobil sowie genau einer Dokumentüberschrift;
- vollständiges Cookie-/LocalStorage-/CacheStorage-Inventar; bei ausschließlich
  notwendigen Zugriffen eine dauerhaft erreichbare kurze Information in DE/EN
  ohne Banner, Einwilligungsattrappe oder Dismiss-Key;
- Migration der alten Orts-/Cache-Keys in den app-namensräumigen Bestand sowie
  vollständiges Löschen von Ort, Suchcache und gerundetem Gerätevorschlag;
- Teilen nativ mit stillem Erfolg und Abbruch, geometrisch stabilem
  Clipboard-/Fehler-Toast sowie kanonischer, ortsneutraler URL;
- explizite gemeinsame Combobox-/Listbox-Ortssuche für Stadt und Region, ohne
  Netz-Autocomplete, mit Abbruch, Cache, Netzfehlern und Locate-Provider;
- während der Eingabe passend gefilterte lokale Vorschläge aus letzten
  abgesendeten Ergebnissen sowie aus dem erst nach freiwilliger Freigabe
  gerundeten Gerätestandort, ohne neuen Netzaufruf und ohne automatische
  Permission-Abfrage; geschlossene Liste bei leerer oder unpassender Eingabe;
- kompakte Ortskarte auf Desktop, 44 × 44 Pixel große Icon-Aktion für den
  Gerätestandort und vollständige zugängliche Beschriftung trotz reduziertem
  visuellen Platzbedarf;
- Abort-, Escape- und verspätete Providerantworten dürfen weder alte
  Ergebnislisten noch falsche Busy-Zustände wiederherstellen;
- sechsteiliger Essentials-Verbraucher-Lock einschließlich Schema, externe
  Same-Origin-CSS-/JS-Dateien,
  korrekte MIME-Typen und strikte `style-src 'self'`-/`script-src 'self'`-CSP.

## Wiederholung vor einer DEV-Veröffentlichung

```powershell
pnpm verify:shell
pnpm test:all
pnpm verify:dev
```

`pnpm readiness` kann zusätzlich gegen einen separat gestarteten DEV-Dienst
laufen. Eine externe DEV-Veröffentlichung benötigt außerdem einen direkten
HTTPS-Aufruf, einen identischen Healthcheck und Portaltests für Mobil,
Desktop, Direktaufruf sowie Portal-Ausfall.
