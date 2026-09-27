/**
 * Service Worker — damit Sober October vom Homescreen aufgeht, auch ohne Netz.
 * Nach lifetracker/public/sw.js, ohne dessen /api/-Regel: hier gibt es keinen
 * Server, alle Daten liegen im localStorage und nie in diesem Vorrat.
 *
 *   Statik kommt zuerst aus dem Netz und fällt nur auf den Vorrat zurück,
 *   wenn keins da ist — sonst käme eine neue Fassung erst beim übernächsten
 *   Öffnen an. Die Symbole ändern sich praktisch nie: die kommen direkt aus
 *   dem Vorrat.
 *
 * VORRAT hochzählen, wenn sich die Liste ändert — dann wird alles Alte beim
 * nächsten Start weggeräumt. test/pwa.test.js prüft, dass SCHALE vollständig ist.
 */
const VORRAT = "sober-october-4";

const SCHALE = [
  "/",
  "/index.html",
  "/app.css",
  "/manifest.webmanifest",
  "/app/haupt.js",
  "/app/logik.js",
  "/app/speicher.js",
  "/app/ebenen.js",
  "/app/ansichten/blatt.js",
  "/app/ansichten/faden.js",
  "/app/ansichten/knopf.js",
  "/app/ansichten/teile.js",
  "/app/bausteine/index.js",
  "/app/bausteine/oben.js",
  "/app/bausteine/monat.js",
  "/app/bausteine/unten.js",
  "/app/bausteine/heatmap.js",
  "/kern/datum.js",
  "/kern/sonne.js",
  "/kern/uhr.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(VORRAT)
      // addAll bricht ab, sobald eine Datei fehlt — dann käme der Worker nie
      // hoch. Lieber einzeln und das Fehlende auslassen.
      .then((c) => Promise.all(SCHALE.map((p) => c.add(p).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== VORRAT).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function netzUndMerken(anfrage) {
  return fetch(anfrage).then((r) => {
    if (r && r.ok) {
      const kopie = r.clone();
      caches.open(VORRAT).then((c) => c.put(anfrage, kopie)).catch(() => {});
    }
    return r;
  });
}

self.addEventListener("fetch", (ev) => {
  const anfrage = ev.request;
  if (anfrage.method !== "GET") return;
  const url = new URL(anfrage.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/icons/")) {
    ev.respondWith(caches.match(anfrage).then((t) => t || netzUndMerken(anfrage)));
    return;
  }
  ev.respondWith(
    netzUndMerken(anfrage).catch(() =>
      caches.match(anfrage)
        .then((t) => t || caches.match("/index.html"))
        .then((t) => t || caches.match("/"))
    )
  );
});
