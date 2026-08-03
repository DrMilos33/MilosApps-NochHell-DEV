import { initMilosAppEssentials } from "./milos-app-essentials.js";

document.body?.setAttribute("data-milos-essentials-app", "daylight");
export const milosAppEssentials = initMilosAppEssentials({
  "appKey": "daylight",
  "environment": "dev",
  "productionApproved": false,
  "loading": {
    "appName": "Noch hell?",
    "iconPath": "public/daylight-icon.svg",
    "iconRuntimePath": "./daylight-icon.svg",
    "message": {
      "de": "App wird geöffnet …",
      "en": "Opening app …"
    }
  },
  "privacy": {
    "mode": "no-cookies",
    "usesLocalStorage": true,
    "storagePurposes": [
      {
        "key": "milosapps.daylight.language",
        "purpose": "Vom Nutzer gewählte Sprache für die vollständige DE/EN-Oberfläche beibehalten",
        "lifetime": "until-user-clears",
        "strictlyNecessary": true
      },
      {
        "key": "milosapps.daylight.location.v1",
        "purpose": "Bewusst gewählten oder gerundeten Ort für lokale Berechnung und Offline-Wiederöffnung beibehalten",
        "lifetime": "until-user-clears",
        "strictlyNecessary": true
      },
      {
        "key": "milosapps.daylight.geocoding-cache.v1",
        "purpose": "Bereits abgesendete Ortsantworten höchstens 30 Tage provider- und rate-limit-schonend wiederverwenden",
        "lifetime": "bounded",
        "strictlyNecessary": true
      },
      {
        "key": "milosapps.daylight.device-suggestion.v1",
        "purpose": "Den ausschließlich freiwillig abgefragten und vorab gerundeten Gerätestandort als lokalen eigenen Ort erneut anbieten",
        "lifetime": "until-user-clears",
        "strictlyNecessary": true
      },
      {
        "key": "milosapps.daylight.offline-shell.v1",
        "purpose": "App-Shell nach der ersten erfolgreichen Ladung für die ausdrücklich angebotene Offline-Wiederöffnung bereitstellen",
        "lifetime": "bounded",
        "strictlyNecessary": true
      },
      {
        "key": "milosapps.daylight.storage-probe",
        "purpose": "Verfügbarkeit lokaler Speicherung einmalig prüfen und den Prüfwert unmittelbar wieder entfernen",
        "lifetime": "session",
        "strictlyNecessary": true
      }
    ],
    "optionalTracking": false,
    "privacyUrl": "https://dev.milos-apps.de/datenschutz"
  },
  "features": {
    "startup": true,
    "privacyNotice": false,
    "share": true,
    "datePicker": false,
    "placeSearch": true,
    "placeSuggestions": {
      "enabled": false,
      "minChars": 3,
      "debounceMs": 350,
      "providerCapability": "submit-only",
      "evidenceFile": null
    }
  }
});
globalThis.milosAppEssentials = milosAppEssentials;
