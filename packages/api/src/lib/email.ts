/**
 * Composeur / transport email du socle notifications.
 *
 * ⚠️ NON NÉGOCIABLE : l'email ne contient JAMAIS de donnée de santé. C'est une
 * notification générique + un lien sécurisé authentifié (`linkUrl`).
 *
 * Transport de DÉPART : log console (dev). TODO prod : brancher Resend/SMTP via
 * une variable d'env (le composeur ci-dessous reste identique).
 */
export interface EmailContent {
  subject: string
  intro: string
  linkUrl?: string
}

export async function sendEmail(to: string, content: EmailContent): Promise<void> {
  // Dev : destinataire masqué, et on NE LOGGE PAS le lien (token = secret de capacité).
  const maskedTo = to.replace(/^(.).*(@.*)$/, '$1***$2')
  console.log('[email]', {
    to: maskedTo,
    subject: content.subject,
    intro: content.intro,
    hasSecureLink: Boolean(content.linkUrl),
  })
  // TODO: const { error } = await resend.emails.send({ from, to, subject, html })
  return Promise.resolve()
}
