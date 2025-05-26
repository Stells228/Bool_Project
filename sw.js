const CACHE_NAME = 'bgh-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/main.html',
  '/main.css',
  '/main.js',
  '/welcome.css',
  '/welcome.js',
  '/try.html',
  '/try.css',
  '/try.js',
  '/settings.css',
  '/settings.js',
  '/rating.css',
  '/rating.js',
  '/map.html',
  '/map.css',
  '/map.js',
  '/gmap.html',
  '/gmap.css',
  '/gmap.js',
  '/gmain.html',
  '/gmain.css',
  '/gmain.js',
  '/calculator.css',
  '/calculator.js',
  '/offline.html',
  '/favicon/favicon.ico',
  '/favicon/site.webmanifest',
  '/favicon/apple-touch-icon.png',
  '/favicon/favicon-96x96.png',
  '/favicon/web-app-manifest-192x192.png',
  '/favicon/web-app-manifest-512x512.png',
  '/Photos/moon.png',
  '/Photos/stars1.png',
  '/Photos/stars2.png',
  '/Photos/cloudmoon1.png',
  '/Photos/cloudmoon2.png',
  '/Photos/cloudmoon3.png',
  '/Photos/cloudmoon4.png',
  '/Photos/cloudmoon5.png',
  '/Photos/home.png',
  '/Photos/calculator.png',
  '/Photos/gear.png',
  '/Photos/cup.png',
  '/Photos/table.png',
  '/Photos/right.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация - удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия "Cache first, then network" с обновлением кэша
self.addEventListener('fetch', event => {
  // Игнор chrome-extension запросы и другие не-HTTP запросы
  if (!event.request.url.startsWith('http') || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  if (event.request.method !== 'GET') return;
  
  // Игнорируем запросы от расширений chrome и другие неподдерживаемые схемы
  if (!event.request.url.startsWith('http')) {
    console.log('Skipping non-http request:', event.request.url);
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Всегда делаем сетевой запрос для обновления кэша
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Проверяем валидность ответа
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Клонируем ответ, так как он может быть использован только один раз
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('Caching new response for:', event.request.url);
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.error('Failed to cache response:', err);
              });
            return networkResponse;
          })
          .catch(() => {
            // В случае ошибки сети возвращаем закэшированный ответ
            if (cachedResponse) {
              console.log('Using cached response for:', event.request.url);
              return cachedResponse;
            }
            // Если нет кэша, возвращаем оффлайн-страницу
            console.log('Showing offline page');
            return caches.match('/offline.html');
          });
        
        // Возвращаем кэшированный ответ сразу, если он есть
        return cachedResponse || fetchPromise;
      })
  );
});