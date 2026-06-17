'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import superjson from 'superjson'
// Côté client on n'importe QUE le type du routeur (jamais l'implémentation,
// qui embarque Prisma). `import type` garantit l'effacement à la compilation.
import type { AppRouter } from '@wellpharma/api'
import { createClient } from '@/lib/supabase/client'

/** Hooks tRPC typés (api.engagement.xxx.useQuery, etc.). */
export const api = createTRPCReact<AppRouter>()

/**
 * URL de base de l'endpoint tRPC.
 * - Navigateur : on s'appuie sur l'origine courante (l'API est servie par
 *   cette même app Next à /api/trpc).
 * - Serveur (SSR) : on retombe sur localhost:3000 par défaut.
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:3000'
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  // QueryClient stable par montage (évite le partage d'état entre requêtes SSR).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000 },
        },
      }),
  )

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // En tRPC v11, le transformer est déclaré DANS le link.
          transformer: superjson,
          async headers() {
            // Joint le JWT Supabase à chaque requête pour authentifier le
            // contexte tRPC côté serveur.
            const supabase = createClient()
            const {
              data: { session },
            } = await supabase.auth.getSession()
            const token = session?.access_token
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
