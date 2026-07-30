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
- DEV-/Production-Linkabbildung, DEV-Badge, semantische
  Header-/Nav-/Main-/Footer-Struktur und genau ein Haupt-H1;
- 44-Pixel-Shellziele, Fokusreihenfolge, Reduced Motion sowie Header und Footer
  bei Desktop, 390 × 844 und 200-Prozent-Reflow.

## Wiederholung vor einer DEV-Veröffentlichung

```powershell
pnpm test:all
pnpm verify:dev
```

`pnpm readiness` kann zusätzlich gegen einen separat gestarteten DEV-Dienst
laufen. Eine externe DEV-Veröffentlichung benötigt außerdem einen direkten
HTTPS-Aufruf, einen identischen Healthcheck und Portaltests für Mobil,
Desktop, Direktaufruf sowie Portal-Ausfall.
