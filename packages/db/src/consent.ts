/**
 * Résolution du consentement (modèle append-only).
 * Fonctions PURES (testables sans base) : le consentement "courant" pour un
 * type donné est la dernière ligne (par `createdAt`) le concernant.
 */

export interface ConsentRecord {
  type: string
  granted: boolean
  createdAt: Date
  revokedAt: Date | null
}

/** Map type -> dernier enregistrement de consentement. */
export function resolveCurrentConsents<T extends ConsentRecord>(rows: readonly T[]): Map<string, T> {
  const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const current = new Map<string, T>()
  for (const row of sorted) {
    current.set(row.type, row)
  }
  return current
}

/** Vrai si le consentement courant pour `type` est accordé et non révoqué. */
export function hasConsent(rows: readonly ConsentRecord[], type: string): boolean {
  const current = resolveCurrentConsents(rows).get(type)
  return Boolean(current && current.granted && current.revokedAt === null)
}
