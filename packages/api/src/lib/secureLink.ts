import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Liens sécurisés : un token signé (HMAC-SHA256) + expirant qui désigne une
 * ressource santé. Le lien ouvre un portail AUTHENTIFIÉ qui re-vérifie l'identité
 * (l'`audience`) puis journalise l'accès (AuditLog). Le token ne contient AUCUNE
 * donnée de santé — uniquement des identifiants opaques.
 */
const SECRET = process.env.SECURE_LINK_SECRET ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export interface SecureLinkPayload {
  resourceType: 'AdviceRequest' | 'PharmaceuticalInterview' | 'Appointment' | 'MissionResponse'
  resourceId: string
  /** UserId autorisé à ouvrir le lien. */
  audience: string
  /** Expiration (epoch ms). */
  exp: number
}

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('base64url')
}

export function createSecureLink(
  input: Omit<SecureLinkPayload, 'exp'> & { ttlMinutes?: number },
): { token: string; url: string } {
  if (!SECRET) throw new Error('SECURE_LINK_SECRET manquant.')
  const payload: SecureLinkPayload = {
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    audience: input.audience,
    exp: Date.now() + (input.ttlMinutes ?? 60 * 24) * 60_000,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const token = `${body}.${sign(body)}`
  return { token, url: `${APP_URL}/secure/${token}` }
}

/** Vérifie signature + expiration. Retourne le payload, ou null si invalide. */
export function verifySecureLink(token: string): SecureLinkPayload | null {
  if (!SECRET) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  const expected = sign(body)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SecureLinkPayload
    return payload.exp >= Date.now() ? payload : null
  } catch {
    return null
  }
}
