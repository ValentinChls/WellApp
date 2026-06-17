/**
 * Couche d'accès « consentement ». DÉMO : état courant en localStorage.
 * RÉEL : tRPC (append-only versionné côté serveur).
 */
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export type ConsentType = 'HEALTH_DATA' | 'MARKETING' | 'PUSH_NOTIFICATIONS' | 'DATA_SHARING_PHARMACY'

const KEY = 'wp-demo-consents'

function readDemo(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, boolean>
  } catch {
    return {}
  }
}

/** État courant des consentements (dernier par type). */
export async function getConsents(): Promise<Record<string, boolean>> {
  if (isDemoEnabled()) return readDemo()
  const rows = await trpc.consent.list.query() // historique trié desc (récent d'abord)
  const current: Record<string, boolean> = {}
  for (const r of rows) {
    if (!(r.type in current)) current[r.type] = r.granted
  }
  return current
}

export async function hasConsent(type: ConsentType): Promise<boolean> {
  const consents = await getConsents()
  return consents[type] === true
}

export async function setConsent(type: ConsentType, granted: boolean): Promise<void> {
  if (isDemoEnabled()) {
    const consents = readDemo()
    consents[type] = granted
    localStorage.setItem(KEY, JSON.stringify(consents))
    return
  }
  await trpc.consent.set.mutate({ type, granted })
}
