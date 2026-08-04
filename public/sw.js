const CACHE_NAME = "milosapps.daylight.production-offline-shell.v1";
const CORE_URLS = ["./", "./index.html", "./runtime-config.json", "./app.webmanifest"];

async function installShell() {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch("./index.html", { cache: "reload" });
  if (!response.ok) {
    throw new Error("App-Shell konnte nicht geladen werden.");
  }
  const html = await response.clone().text();
  await cache.put("./index.html", response.clone());
  await cache.put("./", response);
  const discovered = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url && !url.startsWith("http") && !url.startsWith("#"));
  await cache.addAll([...new Set([...CORE_URLS.slice(2), ...discovered])]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(installShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("./index.html"));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Readiness must always describe the currently deployed artifact and must
  // never be satisfied by an offline or stale service-worker response.
  if (url.pathname.endsWith("/health.json")) {
    return;
  }

  if (event.request.mode === "navigate" || url.pathname.endsWith("/runtime-config.json")) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});
