'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileText,
  Megaphone,
  MessageSquare,
  Store,
  Tag,
  Users,
} from 'lucide-react'
import { adviceStatusLabel, appointmentStatusLabel } from '@wellpharma/shared'
import { cn } from '@wellpharma/ui/cn'
import { api } from '@/lib/trpc/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/stat-card'
import { TrendArea } from '@/components/dashboard/trend-area'
import { StatusDonut } from '@/components/dashboard/status-donut'
import { ReseauMap } from '@/components/reseau-map'

type StaffRole = 'SUPER_ADMIN_GROUPEMENT' | 'ADMIN_PHARMACIE'
type Period = '7d' | '30d' | '90d' | '365d'

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
  { key: '365d', label: '12 mois' },
]

const INTENT_LABELS: Record<string, string> = {
  horaires: 'Horaires',
  services: 'Services',
  adresse: 'Adresse / accès',
  contact: 'Contact',
  autre: 'Autre',
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function DashboardClient({ role }: { role: StaffRole }) {
  const isGroupement = role === 'SUPER_ADMIN_GROUPEMENT'
  const [period, setPeriod] = useState<Period>('30d')
  const [pharmacyId, setPharmacyId] = useState<string | undefined>(undefined)

  const pharmacies = api.kpi.scopePharmacies.useQuery(undefined, { enabled: isGroupement })
  const { data, isLoading, isError } = api.kpi.dashboard.useQuery({ period, pharmacyId })

  const redirectRate =
    data && data.totals.chatTotal > 0
      ? Math.round((data.totals.chatRedirected / data.totals.chatTotal) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            {isGroupement
              ? `Vue groupement${data ? ` · ${data.scope.pharmacyCount} pharmacie${data.scope.pharmacyCount > 1 ? 's' : ''}` : ''}`
              : 'Activité de votre officine'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isGroupement ? (
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground"
              value={pharmacyId ?? ''}
              onChange={(e) => setPharmacyId(e.target.value || undefined)}
            >
              <option value="">Toutes les pharmacies</option>
              {pharmacies.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.city ? ` — ${p.city}` : ''}
                </option>
              ))}
            </select>
          ) : null}
          <div className="inline-flex overflow-hidden rounded-md border">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  period === p.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-secondary',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : isError || !data ? (
        <Card className="p-6">
          <p className="text-sm text-destructive">Le chargement des indicateurs a échoué.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/missions" className="block transition-transform hover:-translate-y-0.5">
              <StatCard label="Missions à valider" value={data.totals.missionsToValidate} icon={ClipboardList} accent="#009dc5" delay={0} />
            </Link>
            <StatCard label="Patients de référence" value={data.totals.patients} icon={Users} accent="#37bac9" delay={60} />
            <StatCard label="Pharmacies consultées" value={data.totals.consultations} icon={Store} accent="#37bac9" delay={60} />
            <StatCard label="RDV à venir" value={data.totals.apptUpcoming} icon={CalendarClock} accent="#2bad70" delay={120} />
            <StatCard label="Entretiens réalisés" value={data.totals.interviewsCompleted} icon={ClipboardCheck} accent="#f39655" delay={180} />
            <StatCard label="Campagnes envoyées" value={data.totals.campaignsSent} icon={Megaphone} accent="#007e9e" delay={240} />
            <StatCard label="Promotions actives" value={data.totals.promosActive} icon={Tag} accent="#e8902b" delay={300} />
            <StatCard
              label="Échanges chatbot"
              value={data.totals.chatTotal}
              icon={MessageSquare}
              accent="#0bb3b0"
              hint={`${redirectRate}% redirigés vers le pharmacien`}
              delay={360}
            />
            {data.totals.reminders != null ? (
              <StatCard label="Rappels activés" value={data.totals.reminders} icon={Bell} accent="#afca0b" delay={420} />
            ) : null}
          </div>

          <ChartCard title="Activité dans le temps">
            <TrendArea data={data.timeline} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Demandes de conseil par statut">
              <StatusDonut
                data={data.adviceByStatus.map((r) => ({ label: adviceStatusLabel(r.key), count: r.count }))}
              />
            </ChartCard>
            <ChartCard title="Rendez-vous par statut">
              <StatusDonut
                data={data.apptByStatus.map((r) => ({ label: appointmentStatusLabel(r.key), count: r.count }))}
              />
            </ChartCard>
          </div>

          {isGroupement ? <ReseauMap /> : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ressources marketing</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href="/docs/plan-marketing-2026.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-secondary"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Plan marketing consommateur 2026</p>
                  <p className="text-xs text-muted-foreground">« Faire équipe pour votre santé » · PDF</p>
                </div>
                <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>

          <ChartCard title="Assistant — questions pratiques">
            <StatusDonut
              data={data.chatByIntent.map((r) => ({ label: INTENT_LABELS[r.key] ?? r.key, count: r.count }))}
            />
          </ChartCard>
        </>
      )}
    </div>
  )
}
