import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createTRPCContext } from '@wellpharma/api'

/**
 * Endpoint HTTP tRPC du monorepo, servi par l'app admin à `/api/trpc`.
 * L'app patient (autre origine) appelle cette même URL → CORS ouvert.
 *
 * Sécurité : `Access-Control-Allow-Origin: *` est SANS danger ici car
 *  - l'auth se fait par jeton Bearer (en-tête Authorization), pas par cookie →
 *    les navigateurs bloquent de toute façon les requêtes cookie cross-origin
 *    avec une origine `*` ;
 *  - les procédures sensibles exigent un jeton valide (seul `home.list` est public).
 * Le contexte lit le JWT Supabase depuis l'en-tête Authorization.
 */
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Max-Age': '86400',
}

async function handler(req: Request) {
  const res = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: ({ req }) => createTRPCContext({ headers: req.headers }),
  })
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
  return new Response(res.body, { status: res.status, headers })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export { handler as GET, handler as POST }
