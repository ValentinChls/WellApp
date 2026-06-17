'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  ClipboardList,
  CornerDownLeft,
  Database,
  FileText,
  GalleryHorizontalEnd,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Search,
  Store,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { api } from '@/lib/trpc/react'

type Role = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'
interface Command {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

const COMMANDS: Record<Role, Command[]> = {
  ADMIN_PHARMACIE: [
    { id: 'home', label: 'Mon comptoir', href: '/', icon: LayoutDashboard },
    { id: 'missions', label: 'Missions à valider', href: '/missions', icon: ClipboardList },
    { id: 'patients', label: 'Patients', href: '/patients', icon: Users },
    { id: 'advice', label: 'Demandes de conseil', href: '/advice', icon: MessageSquare },
    { id: 'interviews', label: 'Entretiens', href: '/interviews', icon: FileText },
    { id: 'pharmacie', label: 'Ma pharmacie', href: '/pharmacie', icon: Store },
    { id: 'campagnes', label: 'Campagnes', href: '/campagnes', icon: Megaphone },
  ],
  SUPER_ADMIN_GROUPEMENT: [
    { id: 'home', label: 'Tableau de bord', href: '/', icon: LayoutDashboard },
    { id: 'missions', label: 'Catalogue de missions', href: '/missions', icon: ClipboardList },
    { id: 'accueil-app', label: "Carrousel d'accueil", href: '/accueil-app', icon: GalleryHorizontalEnd },
    { id: 'groupement', label: 'Groupement', href: '/groupement', icon: Building2 },
    { id: 'pharmacies', label: 'Pharmacies', href: '/pharmacies', icon: Store },
    { id: 'campagnes', label: 'Campagnes', href: '/campagnes', icon: Megaphone },
    { id: 'donnees', label: 'Données & conformité', href: '/donnees', icon: Database },
  ],
}

export function CommandPalette({ role }: { role: Role }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
    return undefined
  }, [open])

  const needle = q.trim().toLowerCase()
  const patients = api.patients.list.useQuery(needle.length >= 2 ? { q: q.trim() } : undefined, {
    enabled: open && needle.length >= 2,
  })

  const commands = COMMANDS[role] ?? []
  const filteredCommands = useMemo(
    () => commands.filter((c) => needle === '' || c.label.toLowerCase().includes(needle)),
    [commands, needle],
  )
  const patientResults = (needle.length >= 2 ? patients.data ?? [] : []).slice(0, 6)

  type Row =
    | { kind: 'command'; cmd: Command }
    | { kind: 'patient'; id: string; name: string }
  const rows: Row[] = [
    ...filteredCommands.map((cmd) => ({ kind: 'command' as const, cmd })),
    ...patientResults.map((p) => ({
      kind: 'patient' as const,
      id: p.id,
      name: `${p.lastName ?? ''} ${p.firstName ?? ''}`.trim() || 'Patient',
    })),
  ]

  function run(row: Row) {
    setOpen(false)
    if (row.kind === 'command') router.push(row.cmd.href)
    else router.push(`/patients?q=${encodeURIComponent(row.name)}`)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const row = rows[Math.min(active, rows.length - 1)]
      if (row) run(row)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKey}
            placeholder="Rechercher une page, un patient…"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
          <span className="shrink-0 rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground">Esc</span>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Aucun résultat.</p>
          ) : (
            <ul>
              {rows.map((row, i) => {
                const isActive = i === active
                const key = row.kind === 'command' ? `c-${row.cmd.id}` : `p-${row.id}`
                const Icon = row.kind === 'command' ? row.cmd.icon : User
                const label = row.kind === 'command' ? row.cmd.label : row.name
                const tag = row.kind === 'patient' ? 'Patient' : null
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => run(row)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                        isActive ? 'bg-secondary' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-foreground">{label}</span>
                      {tag ? (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          {tag}
                        </span>
                      ) : null}
                      {isActive ? <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
