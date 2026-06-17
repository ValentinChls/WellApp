import webpush from 'web-push'

const PUBLIC = process.env.VAPID_PUBLIC_KEY ?? ''
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:contact@wellpharma.fr'

let configured = false
function ensure(): boolean {
  if (configured) return true
  if (!PUBLIC || !PRIVATE) return false
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE)
  configured = true
  return true
}

export const isPushConfigured = (): boolean => Boolean(PUBLIC && PRIVATE)

export interface PushTarget {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

/**
 * Envoie une notification Web Push. `expired` => l'abonnement est mort (404/410)
 * et doit être supprimé. Le payload reste GÉNÉRIQUE (aucune donnée de santé).
 */
export async function sendPush(
  target: PushTarget,
  payload: PushPayload,
): Promise<{ ok: boolean; expired?: boolean }> {
  if (!ensure()) return { ok: false }
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
    )
    return { ok: true }
  } catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode
    const expired = status === 404 || status === 410
    if (!expired) {
      console.error('[webpush] échec envoi', { status, endpoint: target.endpoint.slice(0, 48) })
    }
    return { ok: false, expired }
  }
}
