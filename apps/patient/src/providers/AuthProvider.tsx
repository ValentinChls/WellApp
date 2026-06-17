import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { DEMO_SESSION, disableDemo, enableDemo, isDemoEnabled } from '../lib/demo'

interface AuthState {
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  enterDemo: () => void
}

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  signOut: async () => {},
  enterDemo: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mode démo : session factice, on court-circuite Supabase.
    if (isDemoEnabled()) {
      setSession(DEMO_SESSION as unknown as Session)
      setLoading(false)
      return
    }
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => {
        /* clés Supabase invalides : on ne bloque pas l'UI sur le splash */
      })
      .finally(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      enterDemo: () => {
        enableDemo()
        setSession(DEMO_SESSION as unknown as Session)
      },
      signOut: async () => {
        if (isDemoEnabled()) {
          disableDemo()
          setSession(null)
          return
        }
        await supabase.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
