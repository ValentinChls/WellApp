/**
 * Couche d'accès « entretien pharmaceutique » (santé).
 * DÉMO : brouillons/réponses en localStorage (pas de chiffrement réel — c'est le
 * serveur qui chiffre/journalise en mode réel). RÉEL : tRPC.
 */
import {
  INTERVIEW_TEMPLATES,
  getInterviewTemplate,
  type InterviewTemplate,
} from '@wellpharma/shared'
import { isDemoEnabled } from '../lib/demo'
import { trpc } from '../lib/trpcVanilla'

export interface InterviewSummary {
  id: string
  templateCode: string | null
  type: string
  status: string
  startedAt: string | null
  completedAt: string | null
}
export interface InterviewDetail extends InterviewSummary {
  answers: Record<string, unknown>
}

const KEY = 'wp-demo-interviews'

export function listTemplates(): InterviewTemplate[] {
  return INTERVIEW_TEMPLATES
}

function readDemo(): InterviewDetail[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as InterviewDetail[]
  } catch {
    return []
  }
}
function writeDemo(list: InterviewDetail[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export async function listMyInterviews(): Promise<InterviewSummary[]> {
  if (isDemoEnabled()) {
    return readDemo().map(({ answers: _answers, ...summary }) => summary)
  }
  const rows = await trpc.health.interviews.listMine.query()
  return rows.map((r) => ({
    id: r.id,
    templateCode: r.templateCode,
    type: r.type,
    status: r.status,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
  }))
}

export async function getInterview(id: string): Promise<InterviewDetail | null> {
  if (isDemoEnabled()) return readDemo().find((i) => i.id === id) ?? null
  const r = await trpc.health.interviews.get.query({ id })
  return {
    id: r.id,
    templateCode: r.templateCode,
    type: r.type,
    status: r.status,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
    answers: r.answers,
  }
}

export async function saveDraft(input: {
  id?: string
  pharmacyId: string
  templateCode: string
  answers: Record<string, unknown>
}): Promise<{ id: string }> {
  if (isDemoEnabled()) {
    const list = readDemo()
    if (input.id) {
      const idx = list.findIndex((i) => i.id === input.id)
      const existing = list[idx]
      if (existing) {
        list[idx] = { ...existing, answers: input.answers, status: 'IN_PROGRESS' }
        writeDemo(list)
        return { id: input.id }
      }
    }
    const tpl = getInterviewTemplate(input.templateCode)
    const id = `demo-itw-${Date.now()}`
    list.unshift({
      id,
      templateCode: input.templateCode,
      type: tpl?.prismaType ?? 'AUTRE',
      status: 'DRAFT',
      startedAt: new Date().toISOString(),
      completedAt: null,
      answers: input.answers,
    })
    writeDemo(list)
    return { id }
  }
  const res = await trpc.health.interviews.saveDraft.mutate(input)
  return { id: res.id }
}

export async function submitInterview(id: string): Promise<void> {
  if (isDemoEnabled()) {
    const list = readDemo()
    const idx = list.findIndex((i) => i.id === id)
    const existing = list[idx]
    if (existing) {
      list[idx] = { ...existing, status: 'COMPLETED', completedAt: new Date().toISOString() }
      writeDemo(list)
    }
    return
  }
  await trpc.health.interviews.submit.mutate({ id })
}
