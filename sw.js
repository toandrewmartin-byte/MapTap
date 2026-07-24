// ---- MapTap Ledger service worker ----
//
// Strategy: network-first. On every request, try the network first and cache
// whatever comes back. If the network fails (offline, no signal), fall back
// to the most recently cached version so the app still opens.
//
// HOW TO BUMP:
// Every time you deploy a change to the HTML/CSS/JS, increment the string
// below (v1 -> v2 -> v3...). That's the entire "bump" process — one line.
//
// What bumping actually does: it changes the cache's name, so on the next
// load the old cache gets deleted (see the 'activate' handler) and a clean
// one starts. You do NOT need to bump this for the app to get fresh content —
// network-first already fetches the latest file on every load whenever
// there's a connection. Bumping just keeps the cache from accumulating old,
// unused entries and guarantees a clean slate. Good habit, not a strict
// requirement.

const CACHE_VERSION = 'maptap-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate this new worker immediately, don't wait for old tabs to close
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION) // delete any cache from a previous version
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // take control of open tabs right away
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests (POST/PUT to Firebase should always go straight to network)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
