// Offline helper (service worker). On the first visit it saves every file of the games on the device;
// after that the games open from the device, with or without internet, and quietly pick up updates.
// Same-site files only: it never fetches or stores anything from another website.

const VERSION = '__VERSION__'; // CI replaces this with the commit id on each deploy, so devices get updates
const CACHE = `under-the-c-${VERSION}`;

// Every file the site needs. tests/unit/offline.test.js fails if a file in site/ is missing here.
const FILES = [
  './',
  'index.html',
  'home.css',
  'home.js',
  'favicon.svg',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'kit/characters.js',
  'kit/kit.css',
  'kit/listen.js',
  'kit/logic.js',
  'kit/notes.js',
  'kit/offline.js',
  'kit/sound.js',
  'kit/staff.js',
  'kit/ui.js',
  'under-the-sea/',
  'under-the-sea/index.html',
  'under-the-sea/main.js',
  'under-the-sea/style.css',
  'who-lives-here/',
  'who-lives-here/index.html',
  'who-lives-here/main.js',
  'who-lives-here/style.css',
  'note-flash/',
  'note-flash/index.html',
  'note-flash/main.js',
  'note-flash/style.css',
  'practice-buddy/',
  'practice-buddy/index.html',
  'practice-buddy/main.js',
  'practice-buddy/style.css',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('under-the-c-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(request, { ignoreSearch: true });
    // Serve the saved copy right away; refresh it in the background when online.
    const fresh = fetch(request)
      .then(response => { if (response.ok) cache.put(request, response.clone()); return response; })
      .catch(() => undefined);
    if (saved) { event.waitUntil(fresh); return saved; }
    return (await fresh) || (await cache.match('./')) || Response.error();
  })());
});
