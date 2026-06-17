import { engagementDb } from '@wellpharma/db'
import { getServerSupabase } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import { CockpitClient } from './cockpit-client'

type StaffRole = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'

/**
 * Tableau de bord. Le rôle est résolu côté serveur (le layout garantit déjà
 * une session staff) puis transmis au composant client qui charge les
 * indicateurs via tRPC (scoping RBAC appliqué côté serveur).
 */
export default async function DashboardPage() {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: StaffRole = 'ADMIN_PHARMACIE'
  if (user) {
    try {
      const dbUser = await engagementDb.user.findUnique({
        where: { authId: user.id },
        select: { role: true },
      })
      if (dbUser?.role === 'SUPER_ADMIN_GROUPEMENT') role = 'SUPER_ADMIN_GROUPEMENT'
    } catch {
      // Base indisponible : on garde la vue pharmacie par défaut.
    }
  }

  // Pharmacien → cockpit « Aujourd'hui » (orienté action). Groupement → pilotage.
  if (role === 'ADMIN_PHARMACIE') return <CockpitClient />
  return <DashboardClient role={role} />
}
