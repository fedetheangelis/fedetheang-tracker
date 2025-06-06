const CACHE_NAME = 'game-tracker-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icon.png', 
    '/icon-512x512.png',
    '/placeholder.png' // Aggiungi se crei questa immagine
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Intercetta tutte le richieste
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se la risorsa è nella cache, la restituisce
                if (response) {
                    return response;
                }
                // Altrimenti, la richiede dalla rete
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Metti in cache le risorse statiche e le immagini.
                        // NON mettere in cache l'endpoint di Apps Script, perché vogliamo sempre i dati aggiornati.
                        const requestUrl = new URL(event.request.url);
                        if (event.request.url.startsWith('http') && !requestUrl.hostname.includes('script.google.com')) {
                             return caches.open(CACHE_NAME).then(cache => {
                                 cache.put(event.request, networkResponse.clone());
                                 return networkResponse;
                             });
                        }
                        return networkResponse;
                    });
            })
            .catch(() => {
                // Questo catch gestisce gli errori di rete quando la risorsa non è in cache
                // Potresti restituire una pagina offline personalizzata qui o un messaggio di errore.
                console.log('Fetch failed, serving offline content for:', event.request.url);
                // Esempio: se l'immagine della copertina non è disponibile offline, mostra un placeholder
                if (event.request.url.includes('.png') || event.request.url.includes('.jpg')) {
                    return caches.match('/placeholder.png'); // Restituisce il placeholder
                }
                // Altrimenti, puoi mostrare una pagina di errore generica offline
                // return caches.match('/offline.html'); 
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // Elimina vecchie cache
                    }
                })
            );
        })
    );
});