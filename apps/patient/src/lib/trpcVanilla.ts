import { createTRPCClient, httpBatchLink } from '@trpc/client'
import superjson from 'superjson'
import type { AppRouter } from '@wellpharma/api/types'
import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/trpc'

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
