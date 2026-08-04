import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const dist = path.join(appRoot, "dist");
const expectedCsp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self' https://geocoding-api.open-meteo.com; manifest-src 'self'; worker-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";

const [html, health, runtime, serviceWorker, headers, privacy] = await Promise.all([
  readFile(path.join(dist, "index.html"), "utf8"),
  readFile(path.join(dist, "health.json"), "utf8").then(JSON.parse),
  readFile(path.join(dist, "runtime-config.json"), "utf8").then(JSON.parse),
  readFile(path.join(dist, "sw.js"), "utf8"),
  readFile(path.join(dist, "_headers"), "utf8"),
  readFile(path.join(dist, "datenschutz.html"), "utf8"),
]);

assert.match(html, /data-environment="production"/);
assert.match(html, /https:\/\/sinddielampenan\.de\//);
assert.doesNotMatch(html, /data-environment="dev"/);
assert.deepEqual(
  {
    status: health.status,
    appKey: health.appKey,
    version: health.version,
    environment: health.environment,
    database: health.database,
    productionApproved: health.productionApproved,
  },
  {
    status: "ready",
    appKey: "daylight",
    version: "1.0.0",
    environment: "production",
    database: false,
    productionApproved: true,
  },
);
assert.match(health.sourceCommit, /^[0-9a-f]{40}$/);
assert.deepEqual(runtime, {
  environment: "production",
  geocodingEndpoint: "https://geocoding-api.open-meteo.com/v1/search",
  suggestionsEndpoint: "https://geocoding-api.open-meteo.com/v1/search",
});
assert.match(serviceWorker, /milosapps\.daylight\.production-offline-shell\.v1/);
assert.doesNotMatch(serviceWorker, /CORE_URLS[^;]*health\.json/s);
assert.match(serviceWorker, /pathname\.endsWith\("\/health\.json"\)/);
assert.match(headers, new RegExp(`Content-Security-Policy: ${expectedCsp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
assert.match(headers, /\/health\.json\s+Cache-Control: no-store/);
assert.doesNotMatch(headers, /nominatim|unsafe-inline|unsafe-eval/i);
assert.match(privacy, /Open[‑-]Meteo/);
assert.doesNotMatch(privacy, /dev\.milos-apps\.de/);
await stat(path.join(dist, "daylight-icon.svg"));
await stat(path.join(dist, "privacy.css"));

console.log(
  `Production artifact: PASS (production identity, source ${health.sourceCommit}, CSP, network-only health)`,
);
