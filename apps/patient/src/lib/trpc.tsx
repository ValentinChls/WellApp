import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'
// Côté client : UNIQUEMENT le type du routeur (jamais le runtime serveur/Prisma).
import type { AppRouter } from '@wellpharma/api/types'
import { supabase } from './supabase'

export const api = createTRPCReact<AppRouter>()

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/trpc'

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }),
  )

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: API_URL,
          // En tRPC v11, le transformer est déclaré DANS le link.
          transformer: superjson,
          async headers() {
            const { data } = await supabase.auth.getSession()
            const token = data.session?.access_token
            return token ? { authorization: `Bearer ${token}` } : {}
          },
        }),
      ],
    }),
  )

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  )
}
