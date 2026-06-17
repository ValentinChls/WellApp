import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@wellpharma/api/types'
import { supabase } from './supabase'

// API tRPC servie par l'app admin. Priorité à VITE_API_URL si défini ; sinon
// valeur par défaut selon l'environnement (prod → admin déployé ; dev → local).
const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD
    ? 'https://well-app-admin.vercel.app/api/trpc'
    : 'http://localhost:3000/api/trpc')

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
