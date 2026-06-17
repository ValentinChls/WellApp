import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/**
 * Middleware d'authentification :
 *  1. Rafraîchit la session Supabase (rotation des cookies) à chaque requête.
 *  2. Protège l'application : toute route hors /login et /api exige un
 *     utilisateur authentifié, sinon redirection vers /login.
 *
 * Robuste si les variables Supabase sont absentes : on laisse alors passer la
 * requête (pas de crash au build / en preview sans configuration).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Sans configuration Supabase : tolérant en dev/preview, mais FAIL-CLOSED en
  // production (une mauvaise config ne doit jamais ouvrir l'accès silencieusement).
  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'production') {
      const { pathname } = request.nextUrl
      const isPublic = pathname.startsWith('/login') || pathname.startsWith('/api')
      if (!isPublic) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        return NextResponse.redirect(redirectUrl)
      }
    }
    return response
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // IMPORTANT : ne rien exécuter entre createServerClient et getUser (sinon
  // risque de déconnexion aléatoire — recommandation Supabase SSR).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/api')

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Toutes les routes SAUF :
     * - _next/static, _next/image (assets build)
     * - favicon.ico
     * - /api/trpc (endpoint tRPC, géré par son propre contexte)
     * - tout fichier statique (extension) : sinon le middleware intercepte les
     *   assets du dossier /public (ex. /brand/logo-badge.png) et redirige vers
     *   /login → l'image revient en HTML et s'affiche cassée sur la page login.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/trpc|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|pdf|txt|webmanifest|woff|woff2|ttf|eot)).*)',
  ],
}
