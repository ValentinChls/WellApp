'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  ClipboardList,
  Database,
  FileText,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Store,
  Users,
} from 'lucide-react'
import { cn } from '@wellpharma/ui/cn'

export type StaffRole = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'

/**
 * Navigation latérale avec surbrillance de la page active.
 * La config (avec icônes Lucide) vit ICI, côté client : on ne peut pas passer
 * de composant/fonction depuis un Server Component vers un Client Component.
 */
const NAV = {
  SUPER_ADMIN_GROUPEMENT: [
    { label: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { label: 'Missions', href: '/missions', icon: ClipboardList },
    { label: 'Groupement', href: '/groupement', icon: Building2 },
    { label: 'Pharmacies', href: '/pharmacies', icon: Store },
    { label: 'Campagnes', href: '/campagnes', icon: Megaphone },
    { label: 'Données', href: '/donnees', icon: Database },
  ],
  ADMIN_PHARMACIE: [
    { label: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { label: 'Missions', href: '/missions', icon: ClipboardList },
    { label: 'Ma pharmacie', href: '/pharmacie', icon: Store },
    { label: 'Demandes de conseil', href: '/advice', icon: MessageSquare },
    { label: 'Entretiens', href: '/interviews', icon: FileText },
    { label: 'Patients', href: '/patients', icon: Users },
    { label: 'Campagnes', href: '/campagnes', icon: Megaphone },
  ],
} as const

export function SidebarNav({ role }: { role: StaffRole }) {
  const path = usePathname()
  const items = NAV[role] ?? []
  return (
    <nav className="flex-1 space-y-1 p-3">
      {items.map((item) => {
        const Icon = item.icon
        const active = item.href === '/' ? path === '/' : path.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-secondary',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
