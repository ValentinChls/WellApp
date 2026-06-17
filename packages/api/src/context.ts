import { createClient } from '@supabase/supabase-js'
import { engagementDb } from '@wellpharma/db'

export type Role = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE' | 'PATIENT'

export interface AuthedUser {
  id: string
  authId: string
  email: string
  role: Role
  pharmacyId: string | null
  patientId: string | null
}

export interface Context {
  user: AuthedUser | null
  ip: string | null
  userAgent: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Construit le contexte tRPC à partir de la requête entrante.
 * Vérifie le JWT Supabase (header Authorization) puis résout l'utilisateur
 * applicatif (rôle, pharmacie, patient) depuis le domaine engagement.
 */
export async function createTRPCContext(opts: { headers: Headers }): Promise<Context> {
  const authHeader = opts.headers.get('authorization') ?? ''
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null
  const ip = opts.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = opts.headers.get('user-agent') ?? null

  if (!token || !SUPABASE_URL || !SUPABASE_ANON) {
    return { user: null, ip, userAgent }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { user: null, ip, userAgent }

  const dbUser = await engagementDb.user.findUnique({ where: { authId: data.user.id } })
  if (!dbUser) return { user: null, ip, userAgent }

  return {
    user: {
      id: dbUser.id,
      authId: dbUser.authId,
      email: dbUser.email,
      role: dbUser.role as Role,
      pharmacyId: dbUser.pharmacyId,
      patientId: dbUser.patientId,
    },
    ip,
    userAgent,
  }
}
