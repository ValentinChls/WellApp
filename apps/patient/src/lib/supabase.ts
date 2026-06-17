import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/** Vrai si Supabase est configuré (évite de crasher en preview sans `.env`). */
export const isSupabaseConfigured = Boolean(url && anonKey)

// ⚠️ `createClient('', '')` jette « supabaseUrl is required » et casserait le
// rendu. Quand l'env n'est pas configuré, on passe des placeholders valides :
// l'app se rend (écran de connexion), `isSupabaseConfigured` reste `false`.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
