/* Hello, Flower: keeps the site working with a weak signal.
   - code (html/js/css): network first, so updates still arrive; falls back to the saved copy offline
   - pictures: saved the first time they load, then served from the phone
   - music is left to the browser (big files, and audio uses range requests) */
const V = 'hf-v1';
const CORE = ['./', 'index.html', 'style.css', 'bouquets.js', 'flowers.js', 'script.js', 'touchbloom.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => {
  const list = (e.data && e.data.cache) || [];
  e.waitUntil(caches.open(V).then((c) => Promise.all(list.map((u) => c.match(u).then((hit) => hit || c.add(u).catch(() => {}))))));
});
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/music/') || req.headers.has('range')) return;
  const isCode = req.mode === 'navigate' || /\.(html|js|css)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isCode) {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(V).then((c) => c.put(req, copy)); return r; }).catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(V).then((c) => c.put(req, copy)); } return r; })));
  }
});
