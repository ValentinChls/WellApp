import { createHmac } from 'node:crypto'
import { engagementDb } from './engagement'

// Pepper secret (hors base) : rend la ré-identification d'un UUID patient
// impraticable (un SHA-256 nu serait corrélable / réversible par énumération).
// À défaut de KPI_PSEUDO_SECRET, on réutilise ENCRYPTION_KEK (déjà secret serveur).
const PEPPER = process.env.KPI_PSEUDO_SECRET ?? process.env.ENCRYPTION_KEK ?? 'wellpharma-kpi-dev'

/** Pseudonymise un identifiant (ex. patient) pour les KPI — HMAC keyé, jamais d'ID direct. */
export function pseudonymize(value: string): string {
  return createHmac('sha256', PEPPER).update(value).digest('hex').slice(0, 32)
}

export interface KpiInput {
  name: string
  pharmacyId?: string | null
  /** Identifiant sujet (patient) — sera HASHÉ, jamais stocké en clair. */
  subjectId?: string | null
  properties?: Record<string, unknown>
}

/** Journalise un évènement analytique (domaine engagement, pseudonymisé). */
export function writeKpi(input: KpiInput) {
  return engagementDb.kpiEvent.create({
    data: {
      name: input.name,
      pharmacyId: input.pharmacyId ?? null,
      subjectHash: input.subjectId ? pseudonymize(input.subjectId) : null,
      properties: (input.properties ?? undefined) as object | undefined,
    },
  })
}
