import { TRPCError } from '@trpc/server'
import { engagementDb } from '@wellpharma/db'
import type { Role } from '../context'

/**
 * Périmètre RBAC du back-office : ensemble des pharmacyId qu'un membre du staff
 * peut consulter.
 * - ADMIN_PHARMACIE → sa seule pharmacie (filtre divergent → FORBIDDEN).
 * - SUPER_ADMIN_GROUPEMENT → toutes les pharmacies (déploiement mono-groupement),
 *   éventuellement restreint à une pharmacie via `filterPharmacyId`.
 */
export async function resolveScopedPharmacyIds(
  user: { role: Role; pharmacyId: string | null },
  filterPharmacyId?: string,
): Promise<string[]> {
  if (user.role === 'ADMIN_PHARMACIE') {
    if (!user.pharmacyId) return []
    if (filterPharmacyId && filterPharmacyId !== user.pharmacyId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Périmètre pharmacie non autorisé.' })
    }
    return [user.pharmacyId]
  }
  // SUPER_ADMIN_GROUPEMENT : tout le groupement (un seul groupement pour l'instant).
  const rows = await engagementDb.pharmacy.findMany({
    where: filterPharmacyId ? { id: filterPharmacyId } : {},
    select: { id: true },
  })
  return rows.map((r) => r.id)
}

export function isGroupementRole(role: Role): boolean {
  return role === 'SUPER_ADMIN_GROUPEMENT'
}

/**
 * pharmacyId à affecter à la CRÉATION d'une ressource scopée (campagne, promo…).
 * - ADMIN_PHARMACIE → toujours sa pharmacie.
 * - SUPER_ADMIN_GROUPEMENT → la pharmacie fournie, ou null = niveau groupement.
 */
export function resolveOwnerPharmacyId(
  user: { role: Role; pharmacyId: string | null },
  inputPharmacyId?: string | null,
): string | null {
  if (user.role === 'ADMIN_PHARMACIE') {
    if (!user.pharmacyId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Pharmacie absente.' })
    return user.pharmacyId
  }
  return inputPharmacyId ?? null
}

/** Garde une ressource existante : un ADMIN_PHARMACIE ne touche QUE sa pharmacie. */
export function assertPharmacyInScope(
  user: { role: Role; pharmacyId: string | null },
  recordPharmacyId: string | null,
): void {
  if (user.role === 'ADMIN_PHARMACIE' && recordPharmacyId !== user.pharmacyId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Ressource hors de votre périmètre.' })
  }
}
