self.addEventListener('push', function (event) {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'مركز نوف';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      data: data.data || {},
      tag: data.tag || 'noof-notification',
      requireInteraction: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    const title = 'مركز نوف';
    const options = {
      body: event.data ? event.data.text() : '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/patient';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url && 'focus' in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
