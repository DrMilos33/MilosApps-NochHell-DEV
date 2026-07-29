# QA-Plan: Noch hell?

## Automatisierbare Logik

- Sonnenaufgang, Sonnenuntergang und bürgerliche Dämmerung mit Referenzfällen;
- Zeitzonen, Sommerzeit, Mitternachtswechsel und Datumssprung;
- Äquator, hohe Breiten, Polartag und Polarnacht;
- Countdown vor, genau bei und nach Sonnenuntergang;
- Rundung ohne widersprüchliche Restzeiten;
- Teilansicht ohne genaue Koordinaten.

## Simulierte Nutzung

- Standort erlaubt, verweigert, abgebrochen und technisch nicht verfügbar;
- manueller Ort, unbekannter Ort und mehrere gleichnamige Orte;
- Smartphone, Desktop, Tastatur, Screenreader und 200 Prozent Zoom;
- langsames Netz bei Geocoding sowie vollständig lokale Wiederöffnung;
- Hintergrund/Resume über Sonnenuntergang oder Mitternacht.

## Verbesserungsrunden

1. Berechnung, Standortalternativen und alle Tageslichtzustände.
2. Fehler-, Datenschutz-, Barrierefreiheits-, Datumswechsel- und
   Rushed-user-Test; Probleme beheben und volle Matrix erneut ausführen.
