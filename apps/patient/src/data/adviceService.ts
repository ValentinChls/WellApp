/**
 * Couche d'accès « demande de conseil » (santé).
 * MODE DÉMO : métadonnées en localStorage (pas de backend → pas de chiffrement
 * réel ; c'est le serveur qui chiffre/journalise en mode réel).
 * MODE RÉEL : tRPC → API (chiffrement + audit + consentement + notification).
 */
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export interface AdviceSummary {
  id: string
  subject: string
  status: string
  createdAt: string
}

export interface CreateAdviceInput {
  pharmacyId: string
  subject: string
  body: string
}

const KEY = 'wp-demo-advice'

function readDemo(): AdviceSummary[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as AdviceSummary[]
  } catch {
    return []
  }
}
function writeDemo(list: AdviceSummary[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export async function createAdvice(input: CreateAdviceInput): Promise<{ id: string }> {
  if (isDemoEnabled()) {
    const id = `demo-advice-${Date.now()}`
    const list = readDemo()
    list.unshift({ id, subject: input.subject, status: 'OPEN', createdAt: new Date().toISOString() })
    writeDemo(list)
    return { id }
  }
  const created = await trpc.health.adviceRequests.create.mutate(input)
  return { id: created.id }
}

export async function listMyAdvice(): Promise<AdviceSummary[]> {
  if (isDemoEnabled()) return readDemo()
  const rows = await trpc.health.adviceRequests.listMine.query()
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }))
}
