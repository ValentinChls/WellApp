import { redirect } from 'next/navigation'
import { engagementDb } from '@wellpharma/db'
import { getServerSupabase } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { SidebarNav, type StaffRole } from '@/components/sidebar-nav'
import { CommandPalette } from '@/components/command-palette'
import { signOut } from './actions'

/** Rôles applicatifs (alignés sur @wellpharma/api). */
type Role = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE' | 'PATIENT'

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN_GROUPEMENT: 'Administrateur groupement',
  ADMIN_PHARMACIE: 'Administrateur pharmacie',
  PATIENT: 'Patient',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Session Supabase obligatoire.
  const supabase = await getServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 2. Résolution du rôle applicatif depuis le domaine engagement.
  let dbUser: { email: string; role: string } | null = null
  try {
    dbUser = await engagementDb.user.findUnique({
      where: { authId: user.id },
      select: { email: true, role: true },
    })
  } catch {
    dbUser = null
  }

  const email = dbUser?.email ?? user.email ?? ''
  const role = (dbUser?.role ?? 'PATIENT') as Role

  // 3. Le patient n'a pas accès à l'espace d'administration.
  if (role === 'PATIENT') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="font-display text-xl font-bold text-foreground">
            Espace réservé aux pharmacies
          </h1>
          <p className="text-sm text-muted-foreground">
            Votre compte n’a pas accès à l’administration Wellpharma.
          </p>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Se déconnecter
            </Button>
          </form>
        </div>
      </main>
    )
  }

  const initials = (email.slice(0, 2) || 'WP').toUpperCase()

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Barre latérale, navigation gardée par rôle. */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
        <div className="h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-badge.png" alt="Wellpharma" className="h-11 w-11" />
            <span className="font-display text-lg font-bold text-foreground">wellpharma</span>
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Espace pilotage
          </p>
        </div>
        <SidebarNav role={role as StaffRole} />
        <div className="border-t px-4 py-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-wellpharma-50 px-2.5 py-1 text-xs font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {ROLE_LABEL[role]}
          </span>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Barre supérieure : identité + déconnexion. */}
        <header className="flex items-center justify-between border-b bg-background px-6 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-badge.png" alt="Wellpharma" className="h-8 w-8 md:hidden" />
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </span>
            <span className="text-sm text-muted-foreground">{email}</span>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Déconnexion
            </Button>
          </form>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>

      <CommandPalette role={role as 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'} />
    </div>
  )
}
