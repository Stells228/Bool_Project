const CACHE_NAME = 'bgh-offline-v1';
const OFFLINE_PAGE = '/offline.html';
const ASSETS = [
  '/',
  OFFLINE_PAGE,
  '/offline.css',
  '/offline.js',
  
  // Основные ресурсы
  '/index.html',
  '/welcome.css',
  '/welcome.js',
  '/main.html',
  '/main.css',
  '/main.js',
  '/calculator.css',
  '/calculator.js',
  '/cons.css',
  '/cons.js',
  '/settings.css',
  '/settings.js',
  '/map.html',
  '/map.css',
  '/map.js',
  '/gmain.html',
  '/gmain.css',
  '/gmain.js',
  '/gmap.html',
  '/gmap.css',
  '/gmap.js',
  '/try.html',
  '/try.css',
  '/try.js',

  '/glevel/glevel1.html',
  '/glevel/glevel2.html',
  '/glevel/glevel3.html',
  '/glevel/glevel4.html',
  '/glevel/glevel5.html',
  '/glevel/glevel6.html',
  '/glevel/glvl1.css',
  '/glevel/glvl1.js',
  '/glevel/glvl2.css',
  '/glevel/glvl2.js',
  '/glevel/glvl3.css',
  '/glevel/glvl3.js',
  '/glevel/glvl4.css',
  '/glevel/glvl4.js',
  '/glevel/glvl5.css',
  '/glevel/glvl5.js',
  '/glevel/glvl6.css',
  '/glevel/glvl6.js',
  '/level/level1.html',
  '/level/level2.html',
  '/level/level3.html',
  '/level/level4.html',
  '/level/level5.html',
  '/level/level6.html',
  '/level/lvl1.css',
  '/level/lvl1.js',
  '/level/lvl2.css',
  '/level/lvl2.js',
  '/level/lvl3.css',
  '/level/lvl3.js',
  '/level/lvl4.css',
  '/level/lvl4.js',
  '/level/lvl5.css',
  '/level/lvl5.js',
  '/level/lvl6.css',
  '/level/lvl6.js',

  // Лекции по булевым функциям
  '/bool/lec1.html', '/bool/lec1.js',
  '/bool/lec2.html', '/bool/lec2.js',
  '/bool/lec3.html', '/bool/lec3.js',
  '/bool/lec4.html', '/bool/lec4.js',
  '/bool/lec5.html', '/bool/lec5.js',
  '/bool/lec6.html', '/bool/lec6.js',
  '/bool/lec7.html', '/bool/lec7.js',
  '/bool/lec8.html', '/bool/lec8.js',
  '/bool/lec9.html', '/bool/lec9.js', '/bool/lec.css',
  
  // Лекции по теории графов
  '/graph/glec1.html', '/graph/glec1.js',
  '/graph/glec2.html', '/graph/glec2.js',
  '/graph/glec3.html', '/graph/glec3.js',
  '/graph/glec4.html', '/graph/glec4.js',
  '/graph/glec5.html', '/graph/glec5.js',
  '/graph/glec6.html', '/graph/glec6.js',
  '/graph/glec7.html', '/graph/glec7.js',
  '/graph/glec8.html', '/graph/glec8.js',
  '/graph/glec9.html', '/graph/glec9.js',
  '/graph/glec10.html', '/graph/glec10.js',
  '/graph/glec11.html', '/graph/glec11.js',
  '/graph/glec12.html', '/graph/glec12.js',
  '/graph/glec13.html', '/graph/glec13.js',
  
  // Общие ресурсы
  '/Photos/moon.png',
  '/Photos/stars1.png',
  '/Photos/stars2.png',
  '/Photos/cloudmoon1.png',
  '/Photos/cloudmoon2.png',
  '/Photos/cloudmoon3.png',
  '/Photos/cloudmoon4.png',
  '/Photos/cloudmoon5.png',
  '/favicon/favicon.ico',
  '/favicon/site.webmanifest',
  '/favicon/apple-touch-icon.png',
  '/favicon/favicon-96x96.png',
  '/favicon/web-app-manifest-192x192.png',
  '/favicon/web-app-manifest-512x512.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache for offline assets');
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

// Стратегия "Cache first, then network" для оффлайн-режима
self.addEventListener('fetch', event => {
  // Пропускаем не-HTTP запросы
  if (!event.request.url.startsWith('http')) {
    return;
  }

  if (event.request.method !== 'GET') return;

  // Для навигационных запросов используем offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_PAGE))
    );
    return;
  }

  // Для остальных запросов используем кэш
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
      .catch(() => {
        // Для страниц лекций возвращаем offline.html
        if (event.request.headers.get('Accept').includes('text/html')) {
          return caches.match(OFFLINE_PAGE);
        }
      })
  );
});

