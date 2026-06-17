/**
 * Abonnement Web Push (PWA) — socle notifications.
 *
 * Souscrit via PushManager (clé publique VAPID `VITE_VAPID_PUBLIC_KEY`) puis
 * enregistre l'abonnement côté serveur (tRPC) en mode réel, ou en localStorage
 * en mode démo. La permission n'est demandée qu'au geste utilisateur (et après
 * consentement notifications dans le parcours réel).
 */
import { isDemoEnabled } from './demo'
import { trpc } from './trpcVanilla'

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i)
  return buffer
}

export function isWebPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/**
 * Affiche immédiatement une notification locale via le service worker.
 * Sert de TEST visible (le serveur enverra les vraies notifications de la même
 * façon, via l'événement `push` du SW). Retourne false si non supporté/refusé.
 */
export async function showLocalNotification(title: string, body: string): Promise<boolean> {
  if (!isWebPushSupported()) return false
  if (Notification.permission !== 'granted') return false
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ])
  if (!registration) return false
  await registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/favicon-48.png',
    tag: 'wp-test',
  })
  return true
}

/** Souscrit au Web Push et enregistre l'abonnement. Retourne l'abonnement ou null. */
export async function registerWebPush(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn('VITE_VAPID_PUBLIC_KEY manquant — Web Push désactivé.')
    return null
  }

  // On vérifie d'abord la dispo du service worker (en dev sans SW, `ready` ne se
  // résout jamais : on borne) — évite de demander la permission pour rien.
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ])
  if (!registration) {
    console.warn('Service worker indisponible (build PWA requis pour le push).')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
  })

  const json = subscription.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (endpoint && p256dh && auth) {
    if (isDemoEnabled()) {
      localStorage.setItem('wp-demo-push', JSON.stringify({ endpoint }))
    } else {
      await trpc.notifications.subscribe.mutate({
        endpoint,
        keys: { p256dh, auth },
        userAgent: navigator.userAgent,
      })
    }
  }

  return subscription
}
