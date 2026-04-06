const CACHE_NAME = 'kiemlam-chatbot-v1';
const urlsToCache = [
  '/Chatbot/',
  '/Chatbot/index.html',
  '/Chatbot/public/style.css',
  '/Chatbot/routes/chatbot.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});