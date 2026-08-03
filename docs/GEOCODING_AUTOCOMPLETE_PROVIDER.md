# Dynamische Ortssuche: Providernachweis

Stand: 3. August 2026. Dieser Nachweis gilt ausschließlich für das öffentliche
DEV von `Noch hell?` (`appKey=daylight`).

## Gewählter Vorschlagsprovider

- Standardendpunkt:
  `https://geocoding-api.open-meteo.com/v1/search`
- Offizielle API-Dokumentation:
  https://open-meteo.com/en/docs/geocoding-api
- Nutzungsbedingungen und Grenzen:
  https://open-meteo.com/en/terms
- Lizenzinformation:
  https://open-meteo.com/en/licence
- Datenquelle und Lizenz: GeoNames, CC BY 4.0
- Laufzeitkonfiguration: `suggestionsEndpoint` in
  `public/runtime-config.json`; nur credential-freies HTTPS wird akzeptiert.

Die API dokumentiert partielle und unscharfe Treffer ab drei Zeichen und
liefert die für Daylight erforderliche IANA-Zeitzone direkt mit. Ein
credential-freier Browseraufruf mit der DEV-Origin wurde am 3. August 2026
erfolgreich mit `Access-Control-Allow-Origin: *` geprüft. Die öffentlichen
Open-Meteo-Grenzen für nichtkommerzielle Nutzung liegen zum Prüfzeitpunkt bei
10.000 Aufrufen pro Tag, 5.000 pro Stunde und 600 pro Minute. Diese Werte sind
keine Verfügbarkeitsgarantie und werden vor einer späteren Productionfreigabe
neu bewertet.

## Abgrenzung zu Nominatim

Die Richtlinie der öffentlichen Nominatim-Instanz verbietet clientseitiges
Autocomplete ausdrücklich:
https://operations.osmfoundation.org/policies/nominatim/

Deshalb verwendet die App Nominatim weiterhin ausschließlich nach Enter oder
„Suchen“, mit mindestens 1,1 Sekunden Abstand, persistentem 30-Tage-Cache,
Attribution und austauschbarem Endpoint. Der neue Vorschlagsprovider ist davon
getrennt und ersetzt die genauere explizite Suche nicht.

## Laufzeit- und UI-Grenzen

- Beginn ab drei Zeichen nach dem im Shared-Vertrag festgelegten Debounce;
- höchstens sechs Providerergebnisse;
- AbortController und Request-Identität verhindern veraltete Treffer;
- flüchtiger Cache: höchstens 20 Suchtexte, höchstens sechs Stunden, keine neue
  dauerhafte Speicherung;
- lokale letzte Orte und der freiwillig gerundete Geräteort erscheinen in
  derselben ARIA-Listbox wie Netztreffer;
- genau eine Combobox/Listbox, Pfeiltasten, Enter, Escape und Schließen bei
  Pointerinteraktion außerhalb;
- keine automatische Standortberechtigung und keine Gerätekoordinaten im
  Providerrequest oder in Teil-URLs;
- Providerfehler lassen lokale Vorschläge und die explizite Nominatim-Suche
  nutzbar.

Der Interaktionsvertrag folgt dem WAI-ARIA-APG-Combobox-Muster:
https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

Die Providerfähigkeit und der Außenklick-Lifecycle werden nicht als
App-Sonderlösung implementiert. Sie sind über
`public-app-essentials/v1.1.4` am unveränderlichen Shared-Commit
`b22c94cc6d648fd3052f7d32c9bd80f703094f8d` atomar vendort und mit dem
app-eigenen Sechs-Artefakt-Lock verifiziert. Production bleibt gesperrt.
