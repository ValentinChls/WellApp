/**
 * Couche d'accès « calendrier marronnier » (engagement).
 * DÉMO : événements depuis @wellpharma/shared, rappels en localStorage.
 * RÉEL : tRPC (CareEvent + CareEventReminder, consentement notifications côté serveur).
 */
import { MARRONNIER_EVENTS, type CareEventCategory } from '@wellpharma/shared'
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export interface CareEventView {
  id: string
  title: string
  category: CareEventCategory
  month: number
  description: string | null
}

export async function listCareEvents(): Promise<CareEventView[]> {
  if (isDemoEnabled()) {
    return MARRONNIER_EVENTS.map((e) => ({
      id: e.slug,
      title: e.title,
      category: e.category,
      month: e.month,
      description: e.description ?? null,
    }))
  }
  const rows = await trpc.engagement.careEvents.list.query(undefined)
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category as CareEventCategory,
    month: r.month ?? 0,
    description: r.description,
  }))
}

const REM_KEY = 'wp-demo-reminders'
function readDemo(): string[] {
  try {
    return JSON.parse(localStorage.getItem(REM_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export async function listReminders(): Promise<string[]> {
  if (isDemoEnabled()) return readDemo()
  return trpc.reminders.listMine.query()
}

export async function toggleReminder(careEventId: string): Promise<{ active: boolean }> {
  if (isDemoEnabled()) {
    const list = readDemo()
    if (list.includes(careEventId)) {
      localStorage.setItem(REM_KEY, JSON.stringify(list.filter((x) => x !== careEventId)))
      return { active: false }
    }
    localStorage.setItem(REM_KEY, JSON.stringify([...list, careEventId]))
    return { active: true }
  }
  return trpc.reminders.toggle.mutate({ careEventId })
}
