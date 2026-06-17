import { engagementDb, hasConsent } from '@wellpharma/db'
import { createSecureLink, type SecureLinkPayload } from './secureLink'
import { sendPush } from './webpush'
import { sendEmail } from './email'

export interface NotifyInput {
  userId: string
  kind: string
  /** Titre GÉNÉRIQUE (jamais de donnée de santé). */
  title: string
  /** Corps GÉNÉRIQUE (jamais de donnée de santé). */
  body: string
  /** Ressource santé pointée par le lien sécurisé (identifiants opaques). */
  secureResource?: Pick<SecureLinkPayload, 'resourceType' | 'resourceId'>
  email?: string | null
}

function log(input: NotifyInput, channel: 'PUSH' | 'EMAIL', status: 'SENT' | 'FAILED' | 'SKIPPED') {
  return engagementDb.notificationLog
    .create({ data: { userId: input.userId, kind: input.kind, channel, status } })
    .catch(() => undefined)
}

async function pushToUser(input: NotifyInput, url?: string) {
  const subs = await engagementDb.pushSubscription.findMany({ where: { userId: input.userId } })
  if (subs.length === 0) return log(input, 'PUSH', 'SKIPPED')
  let sent = 0
  for (const s of subs) {
    const res = await sendPush(
      { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
      { title: input.title, body: input.body, url },
    )
    if (res.ok) sent += 1
    if (res.expired) {
      await engagementDb.pushSubscription.delete({ where: { id: s.id } }).catch(() => undefined)
    }
  }
  return log(input, 'PUSH', sent > 0 ? 'SENT' : 'FAILED')
}

/**
 * Notifie un utilisateur : push (si consentement notifications) + email.
 * UNIQUEMENT alerte générique + lien sécurisé authentifié — aucune donnée santé.
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  const user = await engagementDb.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, patientId: true },
  })
  if (!user) return

  const link = input.secureResource
    ? createSecureLink({ ...input.secureResource, audience: input.userId })
    : null

  // Fail-closed pour les patients : push uniquement si consentement EXPLICITE.
  // (Un compte staff sans profil patient n'est pas soumis à ce consentement.)
  let pushAllowed = user.patientId == null
  if (user.patientId) {
    const consents = await engagementDb.consent.findMany({
      where: { patientId: user.patientId },
      select: { type: true, granted: true, createdAt: true, revokedAt: true },
    })
    pushAllowed = hasConsent(consents, 'PUSH_NOTIFICATIONS')
  }
  if (pushAllowed) await pushToUser(input, link?.url)
  else await log(input, 'PUSH', 'SKIPPED')

  // Email TRANSACTIONNEL uniquement (notification + lien sécurisé, jamais de
  // contenu). Tout usage marketing devra passer par le consentement MARKETING.
  const to = input.email ?? user.email
  if (to) {
    await sendEmail(to, { subject: input.title, intro: input.body, linkUrl: link?.url })
    await log(input, 'EMAIL', 'SENT')
  }
}
