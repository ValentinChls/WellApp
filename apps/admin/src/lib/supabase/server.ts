import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server
 * Actions). En Next 15, `cookies()` est asynchrone : on l'attend avant de
 * brancher le store de cookies sur le client Supabase (lecture + écriture pour
 * le rafraîchissement de session).
 *
 * Robuste si les variables Supabase sont absentes (chaînes vides) afin de ne
 * pas faire échouer le build / le rendu statique.
 */
export async function getServerSupabase() {
  const cookieStore = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // `setAll` est appelé depuis un Server Component : l'écriture de
          // cookies y est interdite. Ignorable car le middleware se charge du
          // rafraîchissement de la session.
        }
      },
    },
  })
}
