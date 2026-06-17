import { engagementDb } from '@wellpharma/db'
import { getServerSupabase } from '@/lib/supabase/server'
import { CarouselClient } from './carousel-client'

/** Pilotage du carrousel d'accueil de l'app patient — réservé au groupement. */
export default async function AccueilAppPage() {
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isGroupement = false
  if (user) {
    try {
      const dbUser = await engagementDb.user.findUnique({
        where: { authId: user.id },
        select: { role: true },
      })
      isGroupement = dbUser?.role === 'SUPER_ADMIN_GROUPEMENT'
    } catch {
      isGroupement = false
    }
  }

  if (!isGroupement) {
    return (
      <p className="text-sm text-muted-foreground">
        Cette section est réservée à l’administration du groupement.
      </p>
    )
  }

  return <CarouselClient />
}
