const CACHE_NAME = 'game-tracker-v1';
const urlsToCache = [
    '/fedetheang-tracker/', // La radice del tuo sito GitHub Pages (ADATTA QUESTO PERCORSO)
    '/fedetheang-tracker/index.html', // (ADATTA QUESTO PERCORSO)
    '/fedetheang-tracker/style.css', // (ADATTA QUESTO PERCORSO)
    '/fedetheang-tracker/script.js', // (ADATTA QUESTO PERCORSO)
    '/fedetheang-tracker/manifest.json', // (ADATTA QUESTO PERCORSO)
    '/fedetheang-tracker/placeholder.png', // L'immagine placeholder (ADATTA QUESTO PERCORSO)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    // Aggiungi qui altre risorse statiche che vuoi che l'app salvi per l'offline
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to cache:', error);
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Gestione delle richieste API RAWG (network-first con fallback alla cache se disponibile)
    if (event.request.url.includes('api.rawg.io')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(JSON.stringify({ error: 'Network error or RAWG API unavailable' }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
        );
        return; // Termina la gestione per le API RAWG
    }

    // Per tutte le altre richieste (i tuoi asset PWA), usa cache-first con fallback alla rete
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // Risorsa trovata nella cache
                }
                // Se non è nella cache, prova a recuperarla dalla rete
                return fetch(event.request).then((networkResponse) => {
                    // Controlla se la risposta è valida prima di aggiungerla alla cache
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    // Clona la risposta perché una risposta stream può essere consumata solo una volta
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    return networkResponse;
                });
            })
            .catch(() => {
                // Se sia la cache che la rete falliscono, potresti restituire una pagina offline personalizzata
                return new Response('<h1>Offline</h1><p>Sembra che tu sia offline e questa risorsa non sia disponibile nella cache.</p>', {
                    headers: { 'Content-Type': 'text/html' }
                });
            })
    );
});

self.addEventListener('activate', (event) => {
    // Elimina le vecchie cache
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
