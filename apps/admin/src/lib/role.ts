import { engagementDb } from '@wellpharma/db'
import { getServerSupabase } from './supabase/server'

export type StaffRole = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'

/**
 * Rôle staff résolu côté serveur (le layout garantit déjà une session staff).
 * Défaut prudent : ADMIN_PHARMACIE (périmètre le plus restreint) si indéterminé.
 */
export async function getStaffRole(): Promise<StaffRole> {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'ADMIN_PHARMACIE'
  try {
    const dbUser = await engagementDb.user.findUnique({
      where: { authId: user.id },
      select: { role: true },
    })
    return dbUser?.role === 'SUPER_ADMIN_GROUPEMENT' ? 'SUPER_ADMIN_GROUPEMENT' : 'ADMIN_PHARMACIE'
  } catch {
    return 'ADMIN_PHARMACIE'
  }
}
