/**
 * Couche d'accès « missions patient ».
 * DÉMO : affectations + réponses en localStorage (autosave + reprise).
 * RÉEL : tRPC (routeur missions — back-office, à venir). Le pari produit
 * (parcours asynchrone 1 question/écran) est entièrement jouable en démo.
 */
import {
  MISSION_TEMPLATES,
  getMissionTemplate,
  isMissionComplete,
  type MissionState,
  type MissionTemplate,
} from '@wellpharma/shared'
import { isDemoEnabled } from '../lib/demo'

export interface MissionAssignment {
  id: string
  code: string
  state: MissionState
  answers: Record<string, unknown>
  startedAt: string | null
  completedAt: string | null
  /** Pharmacien proposant (réassurance patient). */
  pharmacistName: string
}

export interface MissionWithTemplate extends MissionAssignment {
  template: MissionTemplate
}

const KEY = 'wp-demo-missions'
const PHARMACIST = 'Mme Léonard'

function seed(): MissionAssignment[] {
  const now = new Date().toISOString()
  return [
    { id: 'm-aod', code: 'ENTRETIEN_AOD', state: 'PROPOSEE', answers: {}, startedAt: null, completedAt: null, pharmacistName: PHARMACIST },
    { id: 'm-grippe', code: 'VACCINATION_GRIPPE', state: 'PROPOSEE', answers: {}, startedAt: null, completedAt: null, pharmacistName: PHARMACIST },
    { id: 'm-obs', code: 'OBSERVANCE', state: 'EN_COURS', answers: { oubli_hier: false }, startedAt: now, completedAt: null, pharmacistName: PHARMACIST },
    { id: 'm-suivi', code: 'SUIVI_POST_DELIVRANCE', state: 'VALIDEE', answers: { commence: true, posologie_claire: 'Très claire', effet_ressenti: 'Non, tout va bien' }, startedAt: now, completedAt: now, pharmacistName: PHARMACIST },
  ]
}

function read(): MissionAssignment[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const s = seed()
      localStorage.setItem(KEY, JSON.stringify(s))
      return s
    }
    return JSON.parse(raw) as MissionAssignment[]
  } catch {
    return seed()
  }
}
function write(list: MissionAssignment[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

function demoOnly(): void {
  if (!isDemoEnabled()) {
    throw new Error('Les missions sont disponibles en mode démo (back-office en cours d’intégration).')
  }
}

export function availableTemplates(): MissionTemplate[] {
  return MISSION_TEMPLATES
}

export async function listMissions(): Promise<MissionWithTemplate[]> {
  demoOnly()
  return read()
    .map((a) => {
      const template = getMissionTemplate(a.code)
      return template ? { ...a, template } : null
    })
    .filter((x): x is MissionWithTemplate => x !== null)
}

export async function getMission(id: string): Promise<MissionWithTemplate | null> {
  demoOnly()
  const a = read().find((m) => m.id === id)
  if (!a) return null
  const template = getMissionTemplate(a.code)
  return template ? { ...a, template } : null
}

/** Autosave d'une réponse (à chaque étape). Bascule en EN_COURS. */
export async function saveAnswer(id: string, stepId: string, value: unknown): Promise<void> {
  demoOnly()
  const list = read()
  const idx = list.findIndex((m) => m.id === id)
  const cur = list[idx]
  if (!cur) return
  const answers = { ...cur.answers, [stepId]: value }
  list[idx] = {
    ...cur,
    answers,
    state: cur.state === 'PROPOSEE' || cur.state === 'OUVERTE' ? 'EN_COURS' : cur.state,
    startedAt: cur.startedAt ?? new Date().toISOString(),
  }
  write(list)
}

/** Soumission finale → COMPLETEE (passe côté pharmacien « à valider »). */
export async function submitMission(id: string): Promise<{ ok: boolean }> {
  demoOnly()
  const list = read()
  const idx = list.findIndex((m) => m.id === id)
  const cur = list[idx]
  if (!cur) return { ok: false }
  const template = getMissionTemplate(cur.code)
  if (template && !isMissionComplete(template, cur.answers)) return { ok: false }
  list[idx] = { ...cur, state: 'COMPLETEE', completedAt: new Date().toISOString() }
  write(list)
  return { ok: true }
}
