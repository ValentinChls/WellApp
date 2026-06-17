import { type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { verifySecureLink } from '@wellpharma/api'
import { engagementDb, writeAudit } from '@wellpharma/db'
import { getServerSupabase } from '@/lib/supabase/server'

/**
 * Portail de lien sécurisé. Transforme un token opaque en ACCÈS CONTRÔLÉ :
 *  1. vérifie la signature + l'expiration du token,
 *  2. exige une session authentifiée,
 *  3. refuse si l'utilisateur connecté ≠ `audience` du token,
 *  4. journalise l'accès (AuditLog santé : qui / quoi / quand),
 *  5. (à venir) rend la ressource santé — branché par les phases métier.
 */
export default async function SecureResourcePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const payload = verifySecureLink(token)
  if (!payload) {
    return (
      <Shell title="Lien invalide ou expiré">
        Ce lien sécurisé n’est plus valide. Reconnectez-vous à votre espace pour accéder au
        contenu.
      </Shell>
    )
  }

  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/secure/${token}`)}`)
  }

  const dbUser = await engagementDb.user.findUnique({ where: { authId: user.id } })
  if (!dbUser || dbUser.id !== payload.audience) {
    return (
      <Shell title="Accès refusé">
        Vous n’êtes pas autorisé·e à consulter cette ressource.
      </Shell>
    )
  }

  // Accès tracé (journal d'audit du domaine santé).
  await writeAudit({
    actorUserId: dbUser.id,
    actorRole: dbUser.role,
    action: 'READ',
    entityType: payload.resourceType,
    entityId: payload.resourceId,
  })

  return (
    <Shell title="Accès autorisé">
      Accès tracé à <strong>{payload.resourceType}</strong> (réf. {payload.resourceId}). Le contenu
      détaillé sera affiché ici par le module concerné.
    </Shell>
  )
}

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ color: '#009dc5' }}>{title}</h1>
      <p style={{ color: '#585856', lineHeight: 1.6 }}>{children}</p>
    </main>
  )
}
