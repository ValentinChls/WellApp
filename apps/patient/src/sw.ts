/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

// Précache de l'app shell (manifest injecté au build par vite-plugin-pwa) →
// fonctionnement hors-ligne + installabilité.
precacheAndRoute(self.__WB_MANIFEST)

// Activation IMMÉDIATE du nouveau SW (API brute, sans dépendance) — sinon il
// attend la fermeture de tous les onglets → l'utilisateur reste une version en
// retard à chaque déploiement.
self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Web Push : afficher la notification. JAMAIS de donnée santé en clair ici —
// les notifications sont des alertes + lien sécurisé authentifié.
self.addEventListener('push', (event) => {
  let payload: { title?: string; body?: string; url?: string; data?: Record<string, unknown> } = {}
  try {
    payload = event.data ? (event.data.json() as typeof payload) : {}
  } catch {
    payload = { title: 'Wellpharma', body: event.data?.text() }
  }
  // Le serveur envoie l'URL (lien sécurisé) à la racine du payload : on la
  // normalise dans `data.url` que `notificationclick` sait lire.
  const data = {
    ...(payload.data ?? {}),
    url: payload.url ?? (payload.data as { url?: string } | undefined)?.url ?? '/',
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Wellpharma', {
      body: payload.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data as { url?: string } | undefined)?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetUrl = new URL(target, self.location.origin).href
      for (const client of clientList) {
        if ('focus' in client) {
          const windowClient = client as WindowClient
          return windowClient
            .focus()
            .then(() => (windowClient.url === targetUrl ? undefined : windowClient.navigate(targetUrl)))
            .then(() => undefined)
        }
      }
      return self.clients.openWindow(target).then(() => undefined)
    }),
  )
})
