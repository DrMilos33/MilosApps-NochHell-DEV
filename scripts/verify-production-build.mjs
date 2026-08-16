import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const dist = path.join(appRoot, "dist");
const expectedCsp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self' https://geocoding-api.open-meteo.com; manifest-src 'self'; worker-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";

const [html, health, runtime, serviceWorker, headers, privacy, notFound, robots, sitemap, adsTxt] = await Promise.all([
  readFile(path.join(dist, "index.html"), "utf8"),
  readFile(path.join(dist, "health.json"), "utf8").then(JSON.parse),
  readFile(path.join(dist, "runtime-config.json"), "utf8").then(JSON.parse),
  readFile(path.join(dist, "sw.js"), "utf8"),
  readFile(path.join(dist, "_headers"), "utf8"),
  readFile(path.join(dist, "datenschutz.html"), "utf8"),
  readFile(path.join(dist, "404.html"), "utf8"),
  readFile(path.join(dist, "robots.txt"), "utf8"),
  readFile(path.join(dist, "sitemap.xml"), "utf8"),
  readFile(path.join(dist, "ads.txt"), "utf8"),
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
    adsEnabled: health.adsEnabled,
  },
  {
    status: "ready",
    appKey: "daylight",
    version: "1.0.1",
    environment: "production",
    database: false,
    productionApproved: true,
    adsEnabled: false,
  },
);
assert.match(health.sourceCommit, /^[0-9a-f]{40}$/);
assert.deepEqual(runtime, {
  environment: "production",
  geocodingEndpoint: "https://geocoding-api.open-meteo.com/v1/search",
  suggestionsEndpoint: "https://geocoding-api.open-meteo.com/v1/search",
  adsEnabled: false,
});
assert.match(serviceWorker, /milosapps\.daylight\.production-offline-shell\.v2/);
assert.doesNotMatch(serviceWorker, /CORE_URLS[^;]*health\.json/s);
assert.match(serviceWorker, /pathname\.endsWith\("\/health\.json"\)/);
assert.match(headers, new RegExp(`Content-Security-Policy: ${expectedCsp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
assert.match(headers, /\/health\.json\s+Cache-Control: no-store/);
assert.doesNotMatch(headers, /nominatim|unsafe-inline|unsafe-eval/i);
assert.doesNotMatch(headers, /doubleclick|googlesyndication|googleadservices|google-analytics/i);
assert.match(html, /<link rel="canonical" href="https:\/\/sinddielampenan\.de\/"/);
assert.match(html, /Standardort Köln/);
assert.match(html, /data-ads-enabled="false"/);
assert.doesNotMatch(html, /adsbygoogle|google-adsense-account|googlesyndication/i);
assert.match(privacy, /Open[‑-]Meteo/);
assert.doesNotMatch(privacy, /dev\.milos-apps\.de/);
assert.match(privacy, /<link rel="canonical" href="https:\/\/sinddielampenan\.de\/datenschutz"/);
assert.match(privacy, /keine Werbung/i);
assert.match(robots, /^User-agent: \*\r?\nAllow: \/\r?\n\r?\nSitemap: https:\/\/sinddielampenan\.de\/sitemap\.xml\s*$/);
assert.match(sitemap, /<loc>https:\/\/sinddielampenan\.de\/<\/loc>/);
assert.match(sitemap, /<loc>https:\/\/sinddielampenan\.de\/datenschutz<\/loc>/);
assert.equal(adsTxt.trim(), "google.com, pub-6713794414913834, DIRECT, f08c47fec0942fa0");
assert.match(notFound, /href="\/"/);
assert.match(notFound, /href="\/privacy\.css"/);
assert.doesNotMatch(notFound, /<script\b/i);
await stat(path.join(dist, "daylight-icon.svg"));
await stat(path.join(dist, "privacy.css"));

console.log(
  `Production artifact: PASS (production identity, source ${health.sourceCommit}, CSP, network-only health)`,
);
