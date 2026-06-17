import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createTRPCContext } from '@wellpharma/api'

/**
 * Endpoint HTTP tRPC du monorepo, servi par l'app admin à `/api/trpc`.
 * L'app patient (Expo) appelle cette même URL.
 *
 * Le contexte est construit à partir des headers de la requête (le JWT
 * Supabase est lu depuis l'en-tête Authorization par `createTRPCContext`).
 */
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: ({ req }) => createTRPCContext({ headers: req.headers }),
  })
}

export { handler as GET, handler as POST }
