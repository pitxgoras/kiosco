// ========== SERVICE WORKER PARA KIOSCO PWA ==========
const CACHE_NAME = 'kiosco-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Recursos estáticos para cachear
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/client-orders.html',
  '/login-admin.html',
  '/admin.html',
  '/offline.html',
  '/css/style.css',
  '/css/client-orders.css',
  '/css/login-admin.css',
  '/css/admin.css',
  '/js/client.js',
  '/js/client-orders.js',
  '/js/admin.js',
  '/js/database.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Recursos dinámicos (imágenes, etc.)
const DYNAMIC_CACHE_URLS = [
  '/assets/images/',
  '/assets/icons/'
];

// ========== INSTALACIÓN ==========
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Cacheando recursos estáticos');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[ServiceWorker] Instalación completada');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Error en instalación:', error);
      })
  );
});

// ========== ACTIVACIÓN ==========
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activación completada');
      return self.clients.claim();
    })
  );
});

// ========== ESTRATEGIA DE CACHÉ ==========
// Stale-While-Revalidate para recursos estáticos
// Network First para API
// Cache First para imágenes

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // ========== API REQUESTS ==========
  // No cachear llamadas a localStorage (no aplica a SW)
  
  // ========== ARCHIVOS ESTÁTICOS ==========
  if (STATIC_CACHE_URLS.some(staticUrl => event.request.url.includes(staticUrl) || 
      event.request.url.match(/\.(css|js|html)$/))) {
    
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Actualizar cache en segundo plano
            fetch(event.request)
              .then(freshResponse => {
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, freshResponse));
              })
              .catch(() => {});
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(freshResponse => {
              return caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, freshResponse.clone());
                  return freshResponse;
                });
            })
            .catch(() => {
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              return new Response('Offline content not available', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }
  
  // ========== IMÁGENES Y ASSETS ==========
  if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then(response => {
              return caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, response.clone());
                  return response;
                });
            })
            .catch(() => {
              // Imagen por defecto offline
              return caches.match('/assets/images/placeholder.png');
            });
        })
    );
    return;
  }
  
  // ========== FUENTES GOOGLE ==========
  if (event.request.url.includes('fonts.googleapis.com') || 
      event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          return fetch(event.request)
            .then(response => {
              return caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, response.clone());
                  return response;
                });
            });
        })
    );
    return;
  }
  
  // ========== OTROS RECURSOS ==========
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachear recursos exitosos
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Fallback para navegación
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// ========== SINCROZACIÓN EN BACKGROUND ==========
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    // Obtener pedidos pendientes de sincronización desde IndexedDB
    console.log('[ServiceWorker] Sincronizando pedidos pendientes...');
    // Implementar lógica de sincronización si es necesario
  } catch (error) {
    console.error('[ServiceWorker] Error sincronizando:', error);
  }
}

// ========== NOTIFICACIONES PUSH ==========
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push notification received');
  
  let title = 'Kiosco';
  let body = '¡Novedades en tu tienda favorita!';
  let icon = '/assets/icons/icon-192x192.png';
  
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      icon = data.icon || icon;
    } catch (e) {
      body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: icon,
      badge: '/assets/icons/icon-96x96.png',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Cerrar' }
      ]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        for (let client of windowClients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});