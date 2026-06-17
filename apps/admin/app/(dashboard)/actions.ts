'use server'

import { redirect } from 'next/navigation'
import { getServerSupabase } from '@/lib/supabase/server'

/**
 * Server Action de déconnexion : invalide la session Supabase puis renvoie
 * l'utilisateur vers la page de connexion.
 */
export async function signOut() {
  const supabase = await getServerSupabase()
  await supabase.auth.signOut()
  redirect('/login')
}
