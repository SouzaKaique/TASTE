// Service worker do TASTE: só cuida das notificações no celular.
// De propósito, não guarda o site em cache (assim nunca fica preso numa versão antiga).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

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
