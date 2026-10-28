// Service worker do TASTE: notificações no celular e abrir o app sem internet.
//
// Para nunca ficar preso numa versão antiga:
// - a página (index.html) vem SEMPRE da internet; a cópia guardada só é usada offline;
// - só arquivos com nome único por versão (chunk-XXXX.js, styles-XXXX.css...) vêm do guardado.
// Dados da API não passam por aqui (o app guarda os dele) e outros sites são ignorados.

const STATIC_CACHE = 'taste-static-v1';
const MAX_STATIC_ENTRIES = 150;
const VERSIONED_FILE = /-[A-Z0-9]{8,}\.(js|css)$|\.(woff2?|png|svg|ico|webmanifest)$/i;

self.addEventListener('install', (event) => {
  // Já guarda a página, para o primeiro uso offline funcionar
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.add('/').catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('taste-static-') && n !== STATIC_CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;

  // Página: internet primeiro (versão nova); sem internet, a última guardada
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(() => caches.match('/').then((cached) => cached || Response.error())),
    );
    return;
  }

  // Arquivos com nome único por versão: guardado primeiro (não mudam nunca)
  if (VERSIONED_FILE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Arquivo de versão antiga que já não existe: o Vercel devolve a página no lugar; isso não se guarda
            const isHtml = (response.headers.get('content-type') || '').includes('text/html');
            if (response.ok && response.type === 'basic' && !isHtml) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy).then(() => trim(cache)));
            }
            return response;
          }),
      ),
    );
  }
});

/** Mantém o guardado pequeno: apaga os arquivos mais antigos (de versões passadas). */
function trim(cache) {
  return cache.keys().then((keys) => {
    const extra = keys.length - MAX_STATIC_ENTRIES;
    return extra > 0 ? Promise.all(keys.slice(1, 1 + extra).map((k) => cache.delete(k))) : undefined;
  });
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'TASTE', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'TASTE', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge.png',
      lang: 'pt-BR',
      // Mesmo assunto (ex.: curtidas no mesmo prato) substitui o aviso anterior em vez de empilhar
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || '/app/notificacoes' },
    }),
  );
});

// Tocar no aviso abre o app na tela certa (ou foca a aba que já está aberta)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/app/notificacoes', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.navigate(target).then((c) => (c || client).focus());
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
