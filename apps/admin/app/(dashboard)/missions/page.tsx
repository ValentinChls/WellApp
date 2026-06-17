import { engagementDb } from '@wellpharma/db'
import { getServerSupabase } from '@/lib/supabase/server'
import { MissionsClient } from './missions-client'

type StaffRole = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'

/** Pilotage des missions. Groupement → catalogue/activation ; pharmacien → file. */
export default async function MissionsPage() {
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
      // base indisponible : vue pharmacie par défaut
    }
  }

  return <MissionsClient role={role} />
}
