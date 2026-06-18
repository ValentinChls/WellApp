import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@wellpharma/api/types'
import { supabase } from './supabase'

// API tRPC servie par l'app admin.
// En PRODUCTION : URL fixe de l'admin déployé. On IGNORE volontairement
// VITE_API_URL en prod (une valeur mal configurée côté Vercel cassait le
// carrousel). En DEV : VITE_API_URL si défini, sinon l'admin local.
const API_URL = import.meta.env.PROD
  ? 'https://well-app-admin.vercel.app/api/trpc'
  : import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/trpc'

/** Client tRPC impératif (hors hooks React) — utilisé par la couche data. */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
      transformer: superjson,
      async headers() {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        return token ? { authorization: `Bearer ${token}` } : {}
      },
    }),
  ],
})
